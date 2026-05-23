"""Normalized contributor read model for sleep, readiness, and activity scores.

The official Oura app displays each contributor with a label, status, and short
explanation. The exported JSON stored in our database keeps the underlying 0-100
scores, but lacks a uniform shape across domains. This module produces a single
``ContributorSummary`` shape that desktop and Android can both render.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

# Human-friendly labels per domain key. Keys are the literal JSON field names
# present in the Oura export. Anything not listed falls back to a title-cased
# version of the key.
DOMAIN_CONTRIBUTOR_LABELS: Dict[str, Dict[str, str]] = {
    "sleep": {
        "deep_sleep": "Deep sleep",
        "efficiency": "Efficiency",
        "latency": "Sleep latency",
        "rem_sleep": "REM sleep",
        "restfulness": "Restfulness",
        "timing": "Sleep timing",
        "total_sleep": "Total sleep",
    },
    "readiness": {
        "activity_balance": "Activity balance",
        "body_temperature": "Body temperature",
        "hrv_balance": "HRV balance",
        "previous_day_activity": "Previous day activity",
        "previous_night": "Previous night",
        "recovery_index": "Recovery index",
        "resting_heart_rate": "Resting heart rate",
        "sleep_balance": "Sleep balance",
    },
    "activity": {
        "meet_daily_targets": "Meet daily targets",
        "move_every_hour": "Move every hour",
        "recovery_time": "Recovery time",
        "stay_active": "Stay active",
        "training_frequency": "Training frequency",
        "training_volume": "Training volume",
    },
}

# Buckets used to convert a 0-100 contributor score into a status badge.
_STATUS_BUCKETS = [
    (85, "optimal"),
    (70, "good"),
    (55, "fair"),
    (0, "pay_attention"),
]


@dataclass
class ContributorSummary:
    domain: str
    key: str
    label: str
    status: str
    value: Optional[int]
    unit: str
    explanation: str
    source_path: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "domain": self.domain,
            "key": self.key,
            "label": self.label,
            "status": self.status,
            "value": self.value,
            "unit": self.unit,
            "explanation": self.explanation,
            "source_path": self.source_path,
        }


def _coerce_dict(raw: Any) -> Dict[str, Any]:
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return {}
        return parsed if isinstance(parsed, dict) else {}
    return {}


def _bucket_for(value: Optional[int]) -> str:
    if value is None:
        return "missing"
    for threshold, label in _STATUS_BUCKETS:
        if value >= threshold:
            return label
    return "pay_attention"


def _explanation_for(domain: str, label: str, status: str, value: Optional[int]) -> str:
    if value is None:
        return f"{label} was not exported for this day."
    pretty = {
        "optimal": "is in the optimal range",
        "good": "is on track",
        "fair": "is slightly below your typical range",
        "pay_attention": "is below your typical range — consider easing up today",
    }.get(status, "is within range")
    return f"{label} scored {value}/100 and {pretty}."


def build_contributor_summaries(
    domain: str,
    contributors_json: Any,
) -> List[ContributorSummary]:
    """Convert a raw contributor JSON blob into a list of ``ContributorSummary``.

    Missing keys (per ``DOMAIN_CONTRIBUTOR_LABELS``) are still emitted with a
    ``missing`` status so the UI can render a compact "not exported" pill rather
    than an empty card.
    """

    domain_key = domain.lower()
    labels = DOMAIN_CONTRIBUTOR_LABELS.get(domain_key, {})
    raw = _coerce_dict(contributors_json)

    summaries: List[ContributorSummary] = []
    seen: set[str] = set()

    for key, label in labels.items():
        value = raw.get(key)
        value_int = int(value) if isinstance(value, (int, float)) and value is not None else None
        status = _bucket_for(value_int)
        summaries.append(
            ContributorSummary(
                domain=domain_key,
                key=key,
                label=label,
                status=status,
                value=value_int,
                unit="score",
                explanation=_explanation_for(domain_key, label, status, value_int),
                source_path=f"{domain_key}.contributors.{key}",
            )
        )
        seen.add(key)

    # Surface unexpected keys exported by Oura (e.g. future contributors) so we
    # don't silently drop data.
    for key, value in raw.items():
        if key in seen:
            continue
        value_int = int(value) if isinstance(value, (int, float)) else None
        status = _bucket_for(value_int)
        label = key.replace("_", " ").title()
        summaries.append(
            ContributorSummary(
                domain=domain_key,
                key=key,
                label=label,
                status=status,
                value=value_int,
                unit="score",
                explanation=_explanation_for(domain_key, label, status, value_int),
                source_path=f"{domain_key}.contributors.{key}",
            )
        )

    return summaries
