"""
Explicit-agent SQL analyst for Oura Ring data.

Ports patterns from the AI Financial Advisor project:
- Explicit pipeline (no LangChain ReAct black-box)
- Tool registry pattern
- Retry strategy with provider-aware wait times
- Read-only SQL enforcement
- Structured JSON outputs
"""

import json
import logging
import os
import re
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List
from fastapi import Request

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain_community.utilities import SQLDatabase
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from backend.src.config import config_manager
from backend.src.paths import get_user_data_dir

logger = logging.getLogger(__name__)


# =============================================================================
# Retry Strategy (ported from AI Financial Advisor)
# =============================================================================

class FailureType(Enum):
    EMPTY_RESPONSE = "empty_response"
    EARLY_FAILURE = "early_failure"
    LATE_FAILURE = "late_failure"
    STREAM_ERROR = "stream_error"
    QUALITY_DEGRADATION = "quality_degradation"


class ProviderType(Enum):
    LOCAL = "local"
    REMOTE = "remote"


@dataclass
class RetryDecision:
    should_retry: bool
    wait_seconds: float
    failure_type: FailureType
    reason: str


class RetryStrategy:
    """
    Intelligent retry for LLM calls.
    Local providers (LM Studio, Ollama) can't cancel in-flight requests,
    so we wait before retrying. Remote providers can retry immediately.
    """

    LOCAL_MINIMUM_WAIT = 2.0
    MAXIMUM_WAIT_SECONDS = 120.0
    BACKOFF_BASE = 2.0
    BACKOFF_MAX = 60.0

    def __init__(self, max_retries: int = 3, provider_type: ProviderType = ProviderType.LOCAL):
        self.max_retries = max_retries
        self.provider_type = provider_type

    @classmethod
    def from_provider_key(cls, provider_key: str, max_retries: int = 3) -> "RetryStrategy":
        local_markers = {"lm_studio", "lmstudio", "local", "ollama", "localhost", ":1234", ":11434"}
        is_local = any(m in provider_key.lower() for m in local_markers)
        ptype = ProviderType.LOCAL if is_local else ProviderType.REMOTE
        logger.info(f"RetryStrategy: provider_key='{provider_key}' → {ptype.value}")
        return cls(max_retries=max_retries, provider_type=ptype)

    def get_retry_decision(self, attempt: int, error_message: str | None = None) -> RetryDecision:
        if attempt >= self.max_retries:
            ft = self._classify_error(error_message)
            return RetryDecision(
                should_retry=False,
                wait_seconds=0.0,
                failure_type=ft,
                reason=f"Exhausted all {self.max_retries} retry attempts",
            )

        ft = self._classify_error(error_message)

        if self.provider_type == ProviderType.REMOTE:
            wait = 0.0 if ft != FailureType.STREAM_ERROR else min(self.BACKOFF_BASE ** attempt, self.BACKOFF_MAX)
            reason = "Remote provider — immediate retry" if wait == 0 else f"Remote provider — backoff {wait:.1f}s"
        else:
            wait = min(self.BACKOFF_BASE ** attempt + self.LOCAL_MINIMUM_WAIT, self.MAXIMUM_WAIT_SECONDS)
            reason = f"Local provider — waiting {wait:.1f}s for model to settle"

        return RetryDecision(should_retry=True, wait_seconds=wait, failure_type=ft, reason=reason)

    @staticmethod
    def _classify_error(error_message: str | None) -> FailureType:
        if not error_message:
            return FailureType.EMPTY_RESPONSE
        msg = error_message.lower()
        if any(k in msg for k in ("connection", "timeout", "refused", "network", "socket", "ssl", "http")):
            return FailureType.STREAM_ERROR
        if any(k in msg for k in ("repetition", "malformed", "quality", "pattern")):
            return FailureType.QUALITY_DEGRADATION
        return FailureType.EARLY_FAILURE


# =============================================================================
# SQL Safety
# =============================================================================

_READ_ONLY_PATTERN = re.compile(r"^\s*SELECT\s+", re.IGNORECASE)
_FORBIDDEN_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|EXEC|EXECUTE|PRAGMA|ATTACH|DETACH)\b",
    re.IGNORECASE,
)


def enforce_read_only(sql: str) -> str:
    """Validate that a SQL query is read-only."""
    if not sql or not sql.strip():
        raise ValueError("Empty SQL query")
    if _FORBIDDEN_KEYWORDS.search(sql):
        raise ValueError("Query contains forbidden keywords. Only SELECT statements are allowed.")
    if not _READ_ONLY_PATTERN.match(sql):
        raise ValueError(f"Query must start with SELECT. Got: {sql[:60]}...")
    return sql.strip()


# =============================================================================
# Tool Registry
# =============================================================================

class SQLToolRegistry:
    """Explicit SQL tool registry — no LangChain agent black-box."""

    def __init__(self, db: SQLDatabase, engine):
        self.db = db
        self.engine = engine

    def list_tables(self) -> List[str]:
        names = self.db.get_usable_table_names()
        return list(names) if names else []

    def get_schema(self, tables: List[str]) -> str:
        if not tables:
            return "No tables specified."
        return self.db.get_table_info(table_names=tables)

    def execute_query(self, sql: str, max_rows: int = 100) -> str:
        safe_sql = enforce_read_only(sql)
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(safe_sql))
                rows = result.fetchall()
                if not rows:
                    return "Query returned 0 rows."

                headers = list(result.keys())
                lines = [" | ".join(str(h) for h in headers)]
                lines.append("-" * max(len(lines[0]), 40))

                for row in rows[:max_rows]:
                    lines.append(" | ".join(str(c) if c is not None else "NULL" for c in row))

                if len(rows) > max_rows:
                    lines.append(f"... and {len(rows) - max_rows} more rows")

                return "\n".join(lines)
        except SQLAlchemyError as e:
            return f"SQL Error: {e}"


# =============================================================================
# JSON Extraction Helper
# =============================================================================

def extract_json(text: str, fallback: Any = None) -> Any:
    """Extract JSON from LLM output, handling markdown fences and partial JSON."""
    if not text:
        return fallback

    text = text.strip()

    # Markdown code blocks
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        parts = text.split("```")
        if len(parts) >= 3:
            text = parts[1].strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to find outermost JSON object
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    # Try JSON array
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    logger.warning(f"Failed to extract JSON from: {text[:200]}...")
    return fallback


# =============================================================================
# DataAnalyst — Explicit Agent Loop
# =============================================================================

class DataAnalyst:
    """
    Oura Ring SQL Data Analyst with explicit agent loop.

    Pipeline:
        1. PLAN    → decide which tables are needed
        2. SCHEMA  → fetch schema for those tables
        3. GENERATE→ produce a read-only SELECT query (JSON)
        4. VALIDATE→ enforce read-only + syntax check
        5. EXECUTE → run against SQLite with row limits
        6. SYNTHESIZE→ format natural-language answer
    """

    def __init__(self):
        cfg = config_manager.get_config()
        host = cfg.get("llm_host", "http://localhost:1234/v1")
        model = cfg.get("llm_model", "llama3.1")
        api_key = cfg.get("llm_api_key", "not-needed")

        self.llm = ChatOpenAI(
            base_url=host,
            model=model,
            api_key=api_key,
            temperature=0,
            streaming=False,
        )

        db_path = os.path.join(get_user_data_dir(), "oura_database.db")
        db_uri = f"sqlite:///{db_path}"
        self.db = SQLDatabase.from_uri(db_uri)
        self.engine = create_engine(db_uri, connect_args={"timeout": 30.0})

        self.tools = SQLToolRegistry(self.db, self.engine)
        self.retry = RetryStrategy.from_provider_key(host, max_retries=3)

        from datetime import date

        self.today = date.today().strftime("%Y-%m-%d")

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------

    def chat(self, history: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Answer a user question about Oura data.
        history: list of {"role": "user"/"assistant", "content": "..."}
        Returns: {"response": str, "thoughts": list}
        """
        user_query = history[-1]["content"] if history else ""
        thoughts: List[Dict[str, Any]] = []

        # Build conversation context from history (last 6 messages)
        context = self._build_history_context(history)

        try:
            # Step 1 — PLAN
            tables = self._step_plan(user_query, context, thoughts)

            # Step 2 — SCHEMA
            schema = self._step_schema(tables, thoughts)

            # Step 3 — GENERATE SQL
            sql_query = self._step_generate_sql(user_query, schema, context, thoughts)

            # Step 4 — VALIDATE
            safe_sql = self._step_validate(sql_query, thoughts)

            # Step 5 — EXECUTE
            result = self._step_execute(safe_sql, thoughts)

            # Step 6 — SYNTHESIZE
            answer = self._step_synthesize(user_query, safe_sql, result, context, thoughts)

            return {"response": answer, "thoughts": thoughts}

        except Exception as e:
            logger.exception("Agent loop failed")
            return {
                "response": f"I encountered an error: {str(e)}",
                "thoughts": thoughts + [{"step": 99, "type": "error", "content": str(e)}],
            }

    async def chat_stream(
        self, query: str, history: List[Dict[str, str]], request: Request
    ):
        """
        Stream the agent pipeline steps and token-by-token answer chunks.
        """
        thoughts: List[Dict[str, Any]] = []
        full_history = history + [{"role": "user", "content": query}]
        context = self._build_history_context(full_history)

        try:
            # Step 1 — PLAN
            if await request.is_disconnected():
                logger.info("Client disconnected before Plan step.")
                return
            tables = self._step_plan(query, context, thoughts)
            yield {"type": "thought", "thought": thoughts[-1]}

            # Step 2 — SCHEMA
            if await request.is_disconnected():
                logger.info("Client disconnected before Schema step.")
                return
            schema = self._step_schema(tables, thoughts)
            yield {"type": "thought", "thought": thoughts[-1]}

            # Step 3 — GENERATE SQL
            if await request.is_disconnected():
                logger.info("Client disconnected before Generate SQL step.")
                return
            sql_query = self._step_generate_sql(query, schema, context, thoughts)
            yield {"type": "thought", "thought": thoughts[-1]}

            # Step 4 — VALIDATE
            if await request.is_disconnected():
                logger.info("Client disconnected before Validate step.")
                return
            safe_sql = self._step_validate(sql_query, thoughts)
            yield {"type": "thought", "thought": thoughts[-1]}

            # Step 5 — EXECUTE
            if await request.is_disconnected():
                logger.info("Client disconnected before Execute step.")
                return
            result = self._step_execute(safe_sql, thoughts)
            yield {"type": "thought", "thought": thoughts[-1]}

            # Step 6 — SYNTHESIZE (with token streaming)
            if await request.is_disconnected():
                logger.info("Client disconnected before Synthesize step.")
                return

            ctx_block = f"\n\nConversation history:\n{context}\n\n" if context else "\n\n"
            prompt = (
                f"You are an Oura Ring data analyst. A user asked a question, you ran a SQL query, "
                f"and got results. Provide a clear, natural language answer. Be concise but informative.\n\n"
                f"Respond in plain text only. Do NOT use JSON, markdown code blocks, or backticks.\n"
                f"If this is a follow-up question, reference the conversation history for context.\n"
                f"Do not repeat yourself if the answer was already given in a previous turn.\n{ctx_block}"
                f"Current user question: \"{query}\"\n"
                f"SQL: {safe_sql}\n"
                f"Results:\n{result}\n\n"
                f"Answer:"
            )

            system_text = (
                f"You are an expert Oura Ring Data Analyst. "
                f"Today is {self.today}. "
                f"You have access to a SQLite database with Oura health data. "
                f"Follow the output format requested in each prompt exactly."
            )
            messages = [
                SystemMessage(content=system_text),
                HumanMessage(content=prompt),
            ]

            full_answer = ""
            
            async for chunk in self.llm.astream(messages):
                if await request.is_disconnected():
                    logger.info("Client disconnected during final response streaming.")
                    return
                content = chunk.content if hasattr(chunk, "content") else str(chunk)
                if content:
                    full_answer += content
                    yield {"type": "token", "content": content}

            full_answer = self._strip_markdown_fences(full_answer)

            thoughts.append({
                "step": 6,
                "type": "tool_result",
                "content": "Synthesized final answer.",
            })
            yield {"type": "thought", "thought": thoughts[-1]}
            yield {"type": "done", "response": full_answer, "thoughts": thoughts}

        except Exception as e:
            logger.exception("Streaming agent loop failed")
            yield {"type": "error", "message": str(e)}


    # -------------------------------------------------------------------------
    # Pipeline Steps
    # -------------------------------------------------------------------------

    def _build_history_context(self, history: List[Dict[str, str]]) -> str:
        """Format the last few messages as context for follow-up questions."""
        if not history or len(history) <= 1:
            return ""
        # Use last 6 messages (3 turns) for context
        recent = history[-7:-1]
        lines = []
        for msg in recent:
            role = "User" if msg.get("role") == "user" else "Assistant"
            lines.append(f"{role}: {msg.get('content', '')}")
        return "\n".join(lines)

    def _step_plan(self, query: str, context: str, thoughts: List[Dict[str, Any]]) -> List[str]:
        """Decide which tables are needed."""
        tables = self.tools.list_tables()
        ctx_block = f"\n\nConversation history:\n{context}\n\n" if context else "\n\n"
        prompt = (
            f"You are a SQLite analyst. Choose the MINIMUM tables needed to answer the question.\n\n"
            f"Available tables: {', '.join(tables)}\n\n"
            f"GUIDANCE:\n"
            f"- 'sleep' = daily sleep summaries (score, contributors, spo2, etc.)\n"
            f"- 'sleep_session' = detailed nightly sessions (heart rate, HRV, phases, etc.)\n"
            f"- 'activity' = daily activity (steps, calories, etc.)\n"
            f"- 'readiness' = daily readiness scores\n"
            f"- 'resilience' = resilience metrics\n"
            f"- 'workout' = workout sessions\n"
            f"- 'tag' = tags/notes added to days\n"
            f"- 'temperature' = temperature data\n"
            f"- 'heart_rate' = heart rate samples\n"
            f"- 'cardiovascular_age' = cardiovascular age estimates\n"
            f"- 'meditation' = meditation sessions\n"
            f"- 'ring_battery' = battery levels\n"
            f"- 'ring_configuration' = ring settings\n{ctx_block}"
            f"Current user question: \"{query}\"\n\n"
            f"If the question refers to something from the conversation history, use that context.\n"
            f"Respond with JSON only:\n"
            f'{{"tables": ["table1"], "reasoning": "brief explanation"}}'
        )
        raw = self._llm_call(prompt)
        plan = extract_json(raw, fallback={"tables": ["sleep"]})
        chosen = plan.get("tables", ["sleep"]) if isinstance(plan, dict) else ["sleep"]
        chosen = [t for t in chosen if t in tables]
        if not chosen:
            chosen = tables[:3] if tables else ["sleep"]

        thoughts.append({
            "step": 1,
            "type": "tool_call",
            "tool": "plan",
            "params": {"query": query},
            "content": f"Tables: {chosen}. Reason: {plan.get('reasoning', 'N/A')}",
        })
        return chosen

    def _step_schema(self, tables: List[str], thoughts: List[Dict[str, Any]]) -> str:
        """Fetch schema for selected tables."""
        schema = self.tools.get_schema(tables)
        thoughts.append({
            "step": 2,
            "type": "tool_result",
            "content": f"Retrieved schema for {len(tables)} table(s)",
        })
        return schema

    def _step_generate_sql(
        self, query: str, schema: str, context: str, thoughts: List[Dict[str, Any]]
    ) -> str:
        """Generate a read-only SELECT query."""
        ctx_block = f"\n\nConversation history:\n{context}\n\n" if context else "\n\n"
        prompt = (
            f"Generate a SQLite SELECT query to answer the user's question.\n\n"
            f"Database schema:\n{schema}\n\n"
            f"CRITICAL RULES:\n"
            f"- Output ONLY a SELECT query (read-only)\n"
            f"- Use strftime('%Y-%m-%d', day) for date filtering\n"
            f"- Always use table prefixes: sleep.score, activity.steps, etc.\n"
            f"- Today is {self.today}\n"
            f"- Use date(day) for date equality comparisons\n"
            f"- Do NOT use LIMIT unless the user asks for a specific number\n"
            f"- If the question is a follow-up, use the conversation history for context\n"
            f"- 'The last 7 days' = date('now', '-7 day') to date('now')\n"
            f"- 'Last week' = previous calendar week (not last 7 days)\n"
            f"- 'Last month' = previous calendar month\n{ctx_block}"
            f'Respond with JSON only:\n'
            f'{{"query": "SELECT ...", "explanation": "what this query does"}}\n\n'
            f"Current user question: \"{query}\""
        )
        raw = self._llm_call(prompt)
        data = extract_json(raw, fallback={"query": "SELECT COUNT(*) FROM sleep"})
        sql = data.get("query", "") if isinstance(data, dict) else ""
        explanation = data.get("explanation", "") if isinstance(data, dict) else ""

        thoughts.append({
            "step": 3,
            "type": "tool_call",
            "tool": "generate_sql",
            "params": {"query": sql},
            "content": explanation or f"Generated SQL: {sql[:120]}...",
        })
        return sql

    def _step_validate(self, sql: str, thoughts: List[Dict[str, Any]]) -> str:
        """Enforce read-only safety."""
        safe = enforce_read_only(sql)
        thoughts.append({
            "step": 4,
            "type": "tool_result",
            "content": f"Query validated as read-only.",
        })
        return safe

    def _step_execute(self, sql: str, thoughts: List[Dict[str, Any]]) -> str:
        """Run the query. If it fails, ask the LLM to fix it once."""
        result = self.tools.execute_query(sql)

        # Error recovery: if SQL failed, send error back to LLM for correction
        if result.startswith("SQL Error:"):
            thoughts.append({
                "step": 5,
                "type": "tool_call",
                "tool": "execute_query",
                "params": {"query": sql},
                "content": result[:500],
            })
            fix_prompt = (
                f"The following SQLite query failed with an error. "
                f"Fix the query and respond with JSON only.\n\n"
                f"Failed query:\n{sql}\n\n"
                f"Error:\n{result}\n\n"
                f"Respond with JSON:\n"
                f'{{"query": " corrected SELECT query ", "explanation": "what was wrong"}}'
            )
            raw_fix = self._llm_call(fix_prompt)
            fix_data = extract_json(raw_fix, fallback={})
            fixed_sql = fix_data.get("query", sql) if isinstance(fix_data, dict) else sql
            safe_fixed = enforce_read_only(fixed_sql)
            result = self.tools.execute_query(safe_fixed)
            thoughts.append({
                "step": 5,
                "type": "tool_call",
                "tool": "execute_query",
                "params": {"query": safe_fixed},
                "content": f"(retry after error) {result[:500]}",
            })
        else:
            thoughts.append({
                "step": 5,
                "type": "tool_call",
                "tool": "execute_query",
                "params": {"query": sql},
                "content": result[:800] if len(result) > 800 else result,
            })
        return result

    def _step_synthesize(
        self, query: str, sql: str, result: str, context: str, thoughts: List[Dict[str, Any]]
    ) -> str:
        """Produce natural-language answer."""
        ctx_block = f"\n\nConversation history:\n{context}\n\n" if context else "\n\n"
        prompt = (
            f"You are an Oura Ring data analyst. A user asked a question, you ran a SQL query, "
            f"and got results. Provide a clear, natural language answer. Be concise but informative.\n\n"
            f"Respond in plain text only. Do NOT use JSON, markdown code blocks, or backticks.\n"
            f"If this is a follow-up question, reference the conversation history for context.\n"
            f"Do not repeat yourself if the answer was already given in a previous turn.\n{ctx_block}"
            f"Current user question: \"{query}\"\n"
            f"SQL: {sql}\n"
            f"Results:\n{result}\n\n"
            f"Answer:"
        )
        answer = self._llm_call(prompt)
        # Strip any accidental markdown fences
        answer = self._strip_markdown_fences(answer)
        thoughts.append({
            "step": 6,
            "type": "tool_result",
            "content": "Synthesized final answer.",
        })
        return answer

    # -------------------------------------------------------------------------
    # LLM Call with Retry
    # -------------------------------------------------------------------------

    @staticmethod
    def _strip_markdown_fences(text: str) -> str:
        """Remove markdown code fences (```json ... ```) from LLM output."""
        text = text.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            # Drop first line if it's ``` or ```json
            if lines and lines[0].strip().startswith("```"):
                lines = lines[1:]
            # Drop last line if it's ```
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        return text

    def _llm_call(self, prompt: str) -> str:
        """Call the LLM with retry logic."""
        system_text = (
            f"You are an expert Oura Ring Data Analyst. "
            f"Today is {self.today}. "
            f"You have access to a SQLite database with Oura health data. "
            f"Follow the output format requested in each prompt exactly."
        )
        messages = [
            SystemMessage(content=system_text),
            HumanMessage(content=prompt),
        ]

        for attempt in range(self.retry.max_retries + 1):
            try:
                response = self.llm.invoke(messages)
                content = response.content if hasattr(response, "content") else str(response)
                if content and content.strip():
                    return content.strip()
                raise ValueError("LLM returned empty content")
            except Exception as e:
                logger.warning(f"LLM call failed (attempt {attempt + 1}): {e}")
                decision = self.retry.get_retry_decision(attempt, str(e))
                if not decision.should_retry:
                    raise RuntimeError(
                        f"LLM call failed after {attempt + 1} attempts. Last error: {e}"
                    )
                logger.info(f"Retrying: {decision.reason}")
                time.sleep(decision.wait_seconds)

        raise RuntimeError("LLM call failed after all retries")
