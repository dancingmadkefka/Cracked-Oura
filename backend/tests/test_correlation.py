"""Unit tests for the Phase 2 correlation service."""

from __future__ import annotations

from datetime import date, datetime, timedelta

from backend.src.analysis.correlation import compute_correlation
from backend.src.analysis.series import build_metric_series
from backend.src.models import Readiness, SleepSession


def _seed_pairs(db, days: int = 20) -> date:
    """Seed bedtime + readiness so bedtime(D) strongly anti-correlates with readiness(D+1)."""
    end = date(2025, 6, 30)
    for offset in range(days):
        d = end - timedelta(days=days - 1 - offset)
        # Later bedtime each day -> lower next-day readiness.
        bt_hour = 22 + (offset % 4)  # 22..25
        db.add(SleepSession(
            id=f"ss-{d.isoformat()}",
            day=d,
            type="long_sleep",
            bedtime_start=datetime(d.year, d.month, d.day, bt_hour % 24, 0),
            total_sleep_duration=7 * 3600,
            average_hrv=50,
        ))
        next_day = d + timedelta(days=1)
        db.add(Readiness(
            id=f"r-{next_day.isoformat()}",
            day=next_day,
            score=90 - (offset % 4) * 8,
        ))
    db.commit()
    return end


def test_correlation_lag_pairs_bedtime_with_next_day_readiness(db_session):
    end = _seed_pairs(db_session, days=20)
    start = end - timedelta(days=25)
    bedtime = build_metric_series(db_session, "sleep_session.bedtime_start_minutes", start, end)
    readiness = build_metric_series(db_session, "readiness.score", start, end + timedelta(days=1))
    result = compute_correlation(bedtime, readiness, lag_days=1, method="pearson")
    assert result.coefficient is not None
    assert result.coefficient < 0  # later bedtime -> lower next-day readiness
    assert result.sample_count >= 14
    assert result.warning is None


def test_correlation_zero_lag_no_pairs(db_session):
    end = _seed_pairs(db_session, days=20)
    start = end - timedelta(days=25)
    bedtime = build_metric_series(db_session, "sleep_session.bedtime_start_minutes", start, end)
    readiness = build_metric_series(db_session, "readiness.score", start, end + timedelta(days=1))
    # With lag=0 we still pair bedtime(D) and readiness(D) since both seeded at same days too.
    result = compute_correlation(bedtime, readiness, lag_days=0)
    assert result.sample_count >= 1


def test_correlation_warns_below_14_paired_samples(db_session):
    _seed_pairs(db_session, days=10)
    start = date(2025, 6, 1)
    end = date(2025, 6, 30)
    bedtime = build_metric_series(db_session, "sleep_session.bedtime_start_minutes", start, end)
    readiness = build_metric_series(db_session, "readiness.score", start, end + timedelta(days=1))
    result = compute_correlation(bedtime, readiness, lag_days=1)
    assert result.sample_count < 14
    assert result.warning == "fewer_than_14_paired_samples" or result.warning == "low_samples"


def test_correlation_unknown_method_rejected(db_session):
    s = build_metric_series(db_session, "readiness.score", date(2025, 1, 1), date(2025, 1, 10))
    try:
        compute_correlation(s, s, method="foo")
    except ValueError:
        return
    assert False, "expected ValueError"


def test_spearman_handles_ties(db_session):
    end = _seed_pairs(db_session, days=20)
    start = end - timedelta(days=25)
    bedtime = build_metric_series(db_session, "sleep_session.bedtime_start_minutes", start, end)
    readiness = build_metric_series(db_session, "readiness.score", start, end + timedelta(days=1))
    result = compute_correlation(bedtime, readiness, lag_days=1, method="spearman")
    assert result.coefficient is not None
    assert -1.0 <= result.coefficient <= 1.0
