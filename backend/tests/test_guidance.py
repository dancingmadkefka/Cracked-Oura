"""Unit tests for the deterministic daily guidance builder."""

from __future__ import annotations

from datetime import date, timedelta

from backend.src.insights.guidance import build_daily_guidance
from backend.src.models import Activity, Readiness, Sleep, SleepSession


def test_no_data_returns_explicit_empty_message(db_session):
    guidance = build_daily_guidance(db_session, date(2025, 7, 1))
    assert guidance.headline == "No Oura data for this day"
    assert guidance.body
    assert guidance.citations == []


def test_headline_prefers_readiness_then_sleep(db_session):
    day = date(2025, 7, 5)
    db_session.add(Readiness(id="r", day=day, score=85, temperature_deviation=0.0))
    db_session.add(Sleep(id="s", day=day, score=70))
    db_session.commit()

    guidance = build_daily_guidance(db_session, day)
    assert "Readiness is 85" in guidance.headline
    metrics = {c["metric"] for c in guidance.citations}
    assert "readiness.score" in metrics


def test_hrv_drop_creates_cited_body_sentence(db_session):
    day = date(2025, 7, 10)
    # 14 prior baseline days at HRV 60; today is 45 ms (15 below → triggers).
    for offset in range(1, 15):
        d = day - timedelta(days=offset)
        db_session.add(SleepSession(
            id=f"p-{d}", day=d, type="long_sleep",
            average_hrv=60, lowest_heart_rate=55,
            total_sleep_duration=8 * 60 * 60,
        ))
    db_session.add(SleepSession(
        id="today", day=day, type="long_sleep",
        average_hrv=45, lowest_heart_rate=55,
        total_sleep_duration=8 * 60 * 60,
    ))
    db_session.add(Readiness(id="r", day=day, score=70, temperature_deviation=0.0))
    db_session.commit()

    guidance = build_daily_guidance(db_session, day)
    assert any("HRV" in s for s in guidance.body)
    assert any(c["metric"] == "hrv" for c in guidance.citations)


def test_activity_gap_sentence_cites_meters_to_target(db_session):
    day = date(2025, 7, 12)
    db_session.add(Activity(
        id="a", day=day, steps=2000,
        target_meters=8000, meters_to_target=6000,
    ))
    db_session.add(Readiness(id="r", day=day, score=72, temperature_deviation=0.0))
    db_session.commit()

    guidance = build_daily_guidance(db_session, day)
    assert any("Activity goal" in s for s in guidance.body)
    assert any(c["metric"] == "activity.meters_to_target" for c in guidance.citations)


def test_green_light_message_when_nothing_notable(db_session):
    day = date(2025, 7, 15)
    db_session.add(Readiness(id="r", day=day, score=90, temperature_deviation=0.0))
    db_session.add(Sleep(id="s", day=day, score=85))
    db_session.commit()

    guidance = build_daily_guidance(db_session, day)
    assert any("green-light" in s or "typical range" in s for s in guidance.body)
