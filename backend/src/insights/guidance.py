"""Deterministic daily guidance built strictly from the local database.

Each sentence must reference an actual numeric value or absence-of-data signal,
so the user can always trace the guidance back to a metric. No marketing copy.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from ..models import Activity, Readiness, Sleep, SleepSession
from .baselines import build_baseline_bundle


@dataclass
class DailyGuidance:
    day: str
    headline: str
    body: List[str] = field(default_factory=list)
    citations: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _cite(metric: str, value: Any, day: str, source_path: str) -> Dict[str, Any]:
    return {"metric": metric, "value": value, "day": day, "source_path": source_path}


def _primary_session(db: Session, day: date) -> Optional[SleepSession]:
    sessions = (
        db.query(SleepSession)
        .filter(SleepSession.day == day)
        .filter(SleepSession.type.in_(["long_sleep", "sleep"]))
        .all()
    )
    if not sessions:
        return None
    return max(sessions, key=lambda s: s.total_sleep_duration or 0)


def build_daily_guidance(db: Session, day: date) -> DailyGuidance:
    """Compose a deterministic guidance card for ``day``.

    The output always cites the metric that triggered each sentence. If no data
    exists for ``day``, the guidance becomes a single "no data" sentence.
    """

    day_str = day.isoformat()
    sleep = db.query(Sleep).filter(Sleep.day == day).one_or_none()
    activity = db.query(Activity).filter(Activity.day == day).one_or_none()
    readiness = db.query(Readiness).filter(Readiness.day == day).one_or_none()
    session = _primary_session(db, day)

    if sleep is None and activity is None and readiness is None and session is None:
        return DailyGuidance(
            day=day_str,
            headline="No Oura data for this day",
            body=[
                "Nothing was exported for this date yet. Run a sync from "
                "Settings or upload an export ZIP."
            ],
            citations=[],
        )

    bundle = build_baseline_bundle(db, day)
    by_metric = {d.metric: d for d in bundle.deltas}

    body: List[str] = []
    citations: List[Dict[str, Any]] = []

    if readiness is not None and readiness.score is not None:
        headline = f"Readiness is {readiness.score}/100 today."
        citations.append(_cite("readiness.score", readiness.score, day_str, "readiness.score"))
    elif sleep is not None and sleep.score is not None:
        headline = f"Sleep scored {sleep.score}/100 last night."
        citations.append(_cite("sleep.score", sleep.score, day_str, "sleep.score"))
    else:
        headline = "Partial data for this day."

    hrv = by_metric.get("hrv")
    if hrv and hrv.current is not None and hrv.baseline_14d is not None and hrv.delta_14d is not None:
        if hrv.delta_14d <= -8:
            body.append(
                f"HRV is {hrv.current:.0f} ms, {abs(hrv.delta_14d):.1f} ms below your 14-day baseline ({hrv.baseline_14d:.0f} ms)."
            )
            citations.append(_cite("hrv", hrv.current, day_str, "sleep_session.average_hrv"))
        elif hrv.delta_14d >= 5:
            body.append(
                f"HRV is {hrv.current:.0f} ms, {hrv.delta_14d:.1f} ms above your 14-day baseline."
            )
            citations.append(_cite("hrv", hrv.current, day_str, "sleep_session.average_hrv"))

    rhr = by_metric.get("resting_hr")
    if rhr and rhr.current is not None and rhr.baseline_14d is not None and rhr.delta_14d is not None:
        if rhr.delta_14d >= 5:
            body.append(
                f"Resting heart rate is {rhr.current:.0f} bpm, {rhr.delta_14d:+.1f} bpm vs your 14-day baseline."
            )
            citations.append(_cite("resting_hr", rhr.current, day_str, "sleep_session.lowest_heart_rate"))

    temp = by_metric.get("temperature_deviation")
    if temp and temp.current is not None and abs(temp.current) >= 0.4:
        body.append(
            f"Body temperature deviation is {temp.current:+.1f} \u00b0C from your baseline."
        )
        citations.append(_cite("temperature_deviation", temp.current, day_str, "readiness.temperature_deviation"))

    if session is not None and session.total_sleep_duration is not None:
        minutes = session.total_sleep_duration / 60.0
        if minutes < 360:
            body.append(
                f"You slept {int(minutes)} minutes last night, under your 6-hour floor."
            )
            citations.append(_cite("total_sleep_minutes", round(minutes, 1), day_str, "sleep_session.total_sleep_duration"))

    if activity is not None and activity.meters_to_target is not None and activity.target_meters:
        if activity.meters_to_target > 0:
            body.append(
                f"Activity goal is still {activity.meters_to_target} m away ({activity.steps or 0} steps so far)."
            )
            citations.append(_cite("activity.meters_to_target", activity.meters_to_target, day_str, "activity.meters_to_target"))

    if readiness is not None and readiness.stress_high is not None and readiness.recovery_high is not None:
        if readiness.stress_high > readiness.recovery_high * 2 and readiness.stress_high >= 180:
            body.append(
                f"Yesterday recorded {readiness.stress_high} min high stress vs {readiness.recovery_high} min high recovery."
            )
            citations.append(_cite("readiness.stress_high", readiness.stress_high, day_str, "readiness.stress_high"))

    if not body:
        if readiness is not None and readiness.score is not None and readiness.score >= 80:
            body.append("All tracked baselines are within typical range \u2014 a green-light day.")
        else:
            body.append("Nothing notable above your baseline thresholds today.")

    return DailyGuidance(day=day_str, headline=headline, body=body, citations=citations)
