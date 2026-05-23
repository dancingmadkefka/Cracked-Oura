"""Unit tests for the rolling-baseline anomaly detector."""

from __future__ import annotations

from datetime import date, datetime, timedelta

from backend.src.analysis.anomalies import compute_anomalies
from backend.src.models import Readiness, SleepSession


def _seed_steady_hrv(db, end: date, days: int, baseline: int, today_value: int) -> None:
    for offset in range(days):
        d = end - timedelta(days=offset)
        db.add(SleepSession(
            id=f"ss-{d.isoformat()}",
            day=d,
            type="long_sleep",
            average_hrv=today_value if offset == 0 else baseline,
            bedtime_start=datetime(d.year, d.month, d.day, 23, 0),
            total_sleep_duration=7 * 3600,
        ))
    db.commit()


def test_anomaly_flags_severe_hrv_drop(db_session):
    end = date(2025, 4, 30)
    _seed_steady_hrv(db_session, end, days=30, baseline=50, today_value=10)
    out = compute_anomalies(
        db_session,
        end,
        metrics=["sleep_session.average_hrv"],
        baseline_window=28,
    )
    assert len(out) == 1
    a = out[0]
    assert a.metric_path == "sleep_session.average_hrv"
    assert a.direction == "below"
    assert a.severity in {"warning", "critical"}
    assert a.day == end
    assert a.baseline_window == 28


def test_anomaly_no_flag_when_value_in_range(db_session):
    end = date(2025, 4, 30)
    _seed_steady_hrv(db_session, end, days=30, baseline=50, today_value=51)
    out = compute_anomalies(
        db_session,
        end,
        metrics=["sleep_session.average_hrv"],
        baseline_window=28,
    )
    assert out == []


def test_anomaly_requires_minimum_baseline_samples(db_session):
    end = date(2025, 4, 30)
    _seed_steady_hrv(db_session, end, days=5, baseline=50, today_value=10)
    out = compute_anomalies(
        db_session,
        end,
        metrics=["sleep_session.average_hrv"],
        baseline_window=28,
    )
    assert out == []  # not enough history


def test_anomaly_unknown_metric_silently_skipped(db_session):
    end = date(2025, 4, 30)
    _seed_steady_hrv(db_session, end, days=30, baseline=50, today_value=10)
    out = compute_anomalies(
        db_session,
        end,
        metrics=["does.not.exist", "sleep_session.average_hrv"],
        baseline_window=28,
    )
    assert len(out) == 1


def test_anomaly_window_days_returns_multiple(db_session):
    end = date(2025, 4, 30)
    # Seed baseline of 30 days; spike on the last two days
    for offset in range(30):
        d = end - timedelta(days=offset)
        val = 10 if offset in (0, 1) else 50
        db_session.add(SleepSession(
            id=f"ss-{d.isoformat()}",
            day=d,
            type="long_sleep",
            average_hrv=val,
            bedtime_start=datetime(d.year, d.month, d.day, 23, 0),
            total_sleep_duration=7 * 3600,
        ))
    db_session.commit()
    out = compute_anomalies(
        db_session,
        end,
        metrics=["sleep_session.average_hrv"],
        baseline_window=14,
        window_days=2,
    )
    days = {a.day for a in out}
    assert end in days
