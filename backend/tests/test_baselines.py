"""Unit tests for the baseline delta service."""

from __future__ import annotations

from datetime import date, timedelta

from backend.src.insights.baselines import (
    MIN_SAMPLES_LONG,
    MIN_SAMPLES_SHORT,
    build_baseline_bundle,
)
from backend.src.models import Activity, Readiness, Sleep, SleepSession


def _seed_sleep_sessions(db, day: date, days: int, hrv: int, rhr: int, total_min: int):
    for offset in range(days):
        d = day - timedelta(days=offset)
        db.add(SleepSession(
            id=f"ss-{d.isoformat()}",
            day=d,
            type="long_sleep",
            average_hrv=hrv if offset > 0 else hrv + 10,  # current day spike
            lowest_heart_rate=rhr if offset > 0 else rhr - 4,
            total_sleep_duration=total_min * 60,
        ))


def _seed_readiness(db, day: date, days: int, score: int):
    for offset in range(days):
        d = day - timedelta(days=offset)
        db.add(Readiness(
            id=f"r-{d.isoformat()}",
            day=d,
            score=score if offset > 0 else score - 10,
            temperature_deviation=0.1,
        ))


def test_baseline_bundle_computes_deltas_when_samples_sufficient(db_session):
    day = date(2025, 1, 31)
    _seed_sleep_sessions(db_session, day, days=15, hrv=50, rhr=58, total_min=420)
    _seed_readiness(db_session, day, days=15, score=80)
    db_session.commit()

    bundle = build_baseline_bundle(db_session, day)
    by_metric = {d.metric: d for d in bundle.deltas}

    hrv = by_metric["hrv"]
    assert hrv.current == 60.0
    assert hrv.baseline_7d == 50.0
    assert hrv.baseline_14d == 50.0
    assert hrv.delta_14d == 10.0
    assert hrv.direction == "up"
    assert hrv.preferred == "higher"

    rhr = by_metric["resting_hr"]
    assert rhr.current == 54.0
    assert rhr.baseline_14d == 58.0
    assert rhr.delta_14d == -4.0
    assert rhr.preferred == "lower"

    rscore = by_metric["readiness_score"]
    assert rscore.current == 70.0
    assert rscore.baseline_14d == 80.0
    assert rscore.delta_14d == -10.0


def test_baseline_returns_none_when_short_window_below_minimum(db_session):
    day = date(2025, 2, 10)
    _seed_sleep_sessions(db_session, day, days=MIN_SAMPLES_SHORT - 1, hrv=50, rhr=58, total_min=420)
    db_session.commit()

    bundle = build_baseline_bundle(db_session, day)
    hrv = next(d for d in bundle.deltas if d.metric == "hrv")
    assert hrv.baseline_7d is None
    assert hrv.delta_7d is None
    assert hrv.sample_count_7d == MIN_SAMPLES_SHORT - 2  # excludes current day


def test_baseline_30d_requires_long_minimum(db_session):
    day = date(2025, 3, 1)
    _seed_sleep_sessions(db_session, day, days=MIN_SAMPLES_LONG, hrv=55, rhr=60, total_min=400)
    db_session.commit()
    bundle = build_baseline_bundle(db_session, day)
    hrv = next(d for d in bundle.deltas if d.metric == "hrv")
    # 13 prior samples - below long minimum
    assert hrv.baseline_30d is None
    assert hrv.delta_30d is None
    # 14-day window has enough samples
    assert hrv.baseline_14d is not None


def test_primary_sleep_session_chooses_longest_per_day(db_session):
    day = date(2025, 4, 5)
    # Two sessions for the same prior day; longer one should be used.
    prior = day - timedelta(days=1)
    db_session.add(SleepSession(id="a", day=prior, type="sleep",
                                 average_hrv=40, lowest_heart_rate=55,
                                 total_sleep_duration=60 * 60))
    db_session.add(SleepSession(id="b", day=prior, type="long_sleep",
                                 average_hrv=80, lowest_heart_rate=50,
                                 total_sleep_duration=8 * 60 * 60))
    # Fill remaining days so the window has samples.
    for offset in range(2, MIN_SAMPLES_SHORT + 1):
        d = day - timedelta(days=offset)
        db_session.add(SleepSession(id=f"f-{d}", day=d, type="long_sleep",
                                     average_hrv=80, lowest_heart_rate=50,
                                     total_sleep_duration=8 * 60 * 60))
    db_session.commit()

    bundle = build_baseline_bundle(db_session, day)
    hrv = next(d for d in bundle.deltas if d.metric == "hrv")
    assert hrv.baseline_7d == 80.0  # the 40 hrv "nap" was ignored
