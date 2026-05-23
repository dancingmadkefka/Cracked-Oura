"""Unit tests for the sync freshness read model."""

from __future__ import annotations

from datetime import date, timedelta

import pytest

from backend.src.insights import sync_freshness as sf_module
from backend.src.insights.sync_freshness import build_sync_freshness
from backend.src.models import Sleep


@pytest.fixture()
def patch_config(monkeypatch):
    def _apply(values):
        monkeypatch.setattr(
            sf_module.config_manager,
            "get_config",
            lambda: dict(values),
        )
    return _apply


def test_empty_database_reports_empty_status(db_session, patch_config):
    patch_config({"status": "Idle"})
    fresh = build_sync_freshness(db_session)
    assert fresh.status == "empty"
    assert fresh.latest_day is None
    assert fresh.days_behind is None
    assert "No Oura data" in (fresh.message or "")


def test_recent_day_reports_fresh(db_session, patch_config):
    today = date.today()
    db_session.add(Sleep(id="s", day=today, score=80))
    db_session.commit()
    patch_config({"status": "Idle", "last_run": "2025-01-01T00:00:00"})

    fresh = build_sync_freshness(db_session)
    assert fresh.status == "fresh"
    assert fresh.latest_day == today.isoformat()
    assert fresh.days_behind == 0
    assert fresh.last_ingest_at == "2025-01-01T00:00:00"


def test_stale_data_reports_stale_status(db_session, patch_config):
    stale_day = date.today() - timedelta(days=3)
    db_session.add(Sleep(id="s", day=stale_day, score=80))
    db_session.commit()
    patch_config({"status": "Idle"})

    fresh = build_sync_freshness(db_session)
    assert fresh.status == "stale"
    assert fresh.days_behind == 3


def test_otp_needed_reports_blocked_status(db_session, patch_config):
    patch_config({"status": "otp_needed"})
    fresh = build_sync_freshness(db_session)
    assert fresh.status == "blocked"
    assert "OTP" in (fresh.message or "")


def test_mobile_server_state_is_surfaced(db_session, patch_config):
    patch_config({"status": "Idle", "mobile_sync_enabled": True})

    class _State:
        running = True
        status = None

    fresh = build_sync_freshness(db_session, mobile_server_state=_State())
    assert fresh.mobile_server_enabled is True
    assert fresh.mobile_server_status == "Running"
