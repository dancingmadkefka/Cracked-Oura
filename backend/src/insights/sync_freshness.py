"""Shared sync freshness read model used by desktop and Android.

Computes the latest local Oura day, the last successful ingest time, the last
export-request time, the current automation status, and the mobile sync server
state. Reads only existing config and database state - no new persistence.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from ..config import config_manager
from ..models import Activity, Readiness, Sleep, SleepSession


@dataclass
class SyncFreshness:
    latest_day: Optional[str]
    last_ingest_at: Optional[str]
    last_export_request_at: Optional[str]
    status: str
    message: Optional[str]
    mobile_server_enabled: bool
    mobile_server_status: Optional[str]
    automation_status: Optional[str]
    next_run: Optional[str]
    days_behind: Optional[int]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _latest_day(db: Session) -> Optional[date]:
    candidates = [
        db.query(Sleep.day).order_by(Sleep.day.desc()).limit(1).scalar(),
        db.query(Activity.day).order_by(Activity.day.desc()).limit(1).scalar(),
        db.query(Readiness.day).order_by(Readiness.day.desc()).limit(1).scalar(),
        db.query(SleepSession.day).order_by(SleepSession.day.desc()).limit(1).scalar(),
    ]
    valid = [d for d in candidates if d is not None]
    return max(valid) if valid else None


def _classify(latest: Optional[date], automation_status: Optional[str]) -> str:
    """Map raw state into a short status keyword for UI badges."""

    if automation_status in ("otp_needed", "Error"):
        return "blocked"
    if automation_status and automation_status not in ("Idle",):
        return "syncing"
    if latest is None:
        return "empty"
    lag = (date.today() - latest).days
    if lag <= 1:
        return "fresh"
    if lag <= 3:
        return "stale"
    return "very_stale"


def build_sync_freshness(
    db: Session,
    mobile_server_state: Any = None,
) -> SyncFreshness:
    """Build the shared sync freshness payload.

    ``mobile_server_state`` is the dataclass returned by ``mobile_server_manager``
    if the caller has it; otherwise we report only what config knows.
    """

    cfg = config_manager.get_config()
    latest = _latest_day(db)
    automation_status = cfg.get("status")
    last_run = cfg.get("last_run")
    next_run = cfg.get("next_run")
    message = cfg.get("message") if isinstance(cfg.get("message"), str) else None

    last_export_request = cfg.get("last_export_request_at") or None

    status_keyword = _classify(latest, automation_status)
    if message is None:
        message = _default_message(status_keyword, latest, automation_status)

    mobile_enabled = bool(cfg.get("mobile_sync_enabled", False))
    mobile_status = None
    if mobile_server_state is not None:
        mobile_status = getattr(mobile_server_state, "status", None)
        if getattr(mobile_server_state, "running", False) and not mobile_status:
            mobile_status = "Running"

    days_behind = None
    if latest is not None:
        days_behind = max(0, (date.today() - latest).days)

    return SyncFreshness(
        latest_day=latest.isoformat() if latest else None,
        last_ingest_at=last_run,
        last_export_request_at=last_export_request,
        status=status_keyword,
        message=message,
        mobile_server_enabled=mobile_enabled,
        mobile_server_status=mobile_status,
        automation_status=automation_status,
        next_run=next_run,
        days_behind=days_behind,
    )


def _default_message(
    status_keyword: str,
    latest: Optional[date],
    automation_status: Optional[str],
) -> str:
    if status_keyword == "blocked":
        if automation_status == "otp_needed":
            return "OTP required to continue sync."
        return "Sync is blocked. Check Settings for details."
    if status_keyword == "syncing":
        return automation_status or "Sync in progress."
    if status_keyword == "empty":
        return "No Oura data has been ingested yet."
    if latest is None:
        return "Status unknown."
    lag = (date.today() - latest).days
    if status_keyword == "fresh":
        return f"Up to date through {latest.isoformat()}."
    return f"Latest local day is {latest.isoformat()} ({lag} days behind)."
