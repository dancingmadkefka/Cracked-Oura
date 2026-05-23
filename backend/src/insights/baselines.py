"""Personal baseline deltas across 7/14/30 day rolling windows.

The official Oura app frames a daily metric in terms of "your usual." We compute
that from local historical data so the desktop and Android UIs can show the same
context. Minimum sample counts guard against thin baselines.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any, Callable, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from ..models import Activity, Readiness, Sleep, SleepSession

# Minimum samples required before a baseline value is exposed. Anything below
# this still returns the count so the UI can show "needs more data".
MIN_SAMPLES_SHORT = 5  # 7 / 14 day windows
MIN_SAMPLES_LONG = 14  # 30 day window

# Metric specifications. Order is significant — it controls UI render order.
# Each tuple: (metric key, label, unit, "higher is better"|"lower is better"|None)
_METRIC_SPECS: Tuple[Tuple[str, str, str, Optional[str]], ...] = (
    ("hrv", "Average HRV", "ms", "higher"),
    ("resting_hr", "Resting heart rate", "bpm", "lower"),
    ("readiness_score", "Readiness score", "score", "higher"),
    ("sleep_score", "Sleep score", "score", "higher"),
    ("total_sleep_minutes", "Total sleep", "min", "higher"),
    ("activity_score", "Activity score", "score", "higher"),
    ("temperature_deviation", "Temperature deviation", "°C", None),
)


@dataclass
class BaselineDelta:
    metric: str
    label: str
    unit: str
    current: Optional[float]
    baseline_7d: Optional[float]
    baseline_14d: Optional[float]
    baseline_30d: Optional[float]
    delta_7d: Optional[float]
    delta_14d: Optional[float]
    delta_30d: Optional[float]
    direction: Optional[str]
    sample_count_7d: int
    sample_count_14d: int
    sample_count_30d: int
    preferred: Optional[str]  # "higher" | "lower" | None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "metric": self.metric,
            "label": self.label,
            "unit": self.unit,
            "current": self.current,
            "baseline_7d": self.baseline_7d,
            "baseline_14d": self.baseline_14d,
            "baseline_30d": self.baseline_30d,
            "delta_7d": self.delta_7d,
            "delta_14d": self.delta_14d,
            "delta_30d": self.delta_30d,
            "direction": self.direction,
            "sample_count_7d": self.sample_count_7d,
            "sample_count_14d": self.sample_count_14d,
            "sample_count_30d": self.sample_count_30d,
            "preferred": self.preferred,
        }


@dataclass
class BaselineBundle:
    day: date
    deltas: List[BaselineDelta] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "day": self.day.isoformat(),
            "deltas": [d.to_dict() for d in self.deltas],
        }


def _round(value: Optional[float], digits: int = 1) -> Optional[float]:
    if value is None:
        return None
    return round(float(value), digits)


def _avg(values: List[float]) -> Optional[float]:
    if not values:
        return None
    return sum(values) / len(values)


def _window_avg(values: List[Tuple[date, float]], end_day: date, days: int) -> Tuple[Optional[float], int]:
    start = end_day - timedelta(days=days)
    filtered = [v for d, v in values if start <= d < end_day]
    return _avg(filtered), len(filtered)


def _direction(delta: Optional[float]) -> Optional[str]:
    if delta is None:
        return None
    if delta > 0:
        return "up"
    if delta < 0:
        return "down"
    return "flat"


def _collect_metric_series(
    db: Session,
    day: date,
) -> Dict[str, List[Tuple[date, float]]]:
    """Pull the last 31 days of values for each tracked metric."""

    start = day - timedelta(days=30)

    series: Dict[str, List[Tuple[date, float]]] = {key: [] for key, *_ in _METRIC_SPECS}

    sessions = (
        db.query(SleepSession)
        .filter(SleepSession.day >= start, SleepSession.day <= day)
        .filter(SleepSession.type.in_(["long_sleep", "sleep"]))
        .all()
    )
    primary_by_day: Dict[date, SleepSession] = {}
    for s in sessions:
        existing = primary_by_day.get(s.day)
        if existing is None or (s.total_sleep_duration or 0) > (existing.total_sleep_duration or 0):
            primary_by_day[s.day] = s

    for d, s in primary_by_day.items():
        if s.average_hrv is not None:
            series["hrv"].append((d, float(s.average_hrv)))
        if s.lowest_heart_rate is not None:
            series["resting_hr"].append((d, float(s.lowest_heart_rate)))
        if s.total_sleep_duration is not None:
            series["total_sleep_minutes"].append((d, float(s.total_sleep_duration) / 60.0))

    for row in db.query(Readiness).filter(Readiness.day >= start, Readiness.day <= day).all():
        if row.score is not None:
            series["readiness_score"].append((row.day, float(row.score)))
        if row.temperature_deviation is not None:
            series["temperature_deviation"].append((row.day, float(row.temperature_deviation)))

    for row in db.query(Sleep).filter(Sleep.day >= start, Sleep.day <= day).all():
        if row.score is not None:
            series["sleep_score"].append((row.day, float(row.score)))

    for row in db.query(Activity).filter(Activity.day >= start, Activity.day <= day).all():
        if row.score is not None:
            series["activity_score"].append((row.day, float(row.score)))

    return series


def build_baseline_bundle(db: Session, day: date) -> BaselineBundle:
    """Compute baseline deltas for ``day`` against 7/14/30 day windows."""

    series = _collect_metric_series(db, day)
    bundle = BaselineBundle(day=day)

    for metric_key, label, unit, preferred in _METRIC_SPECS:
        values = series.get(metric_key, [])
        current = next((v for d, v in values if d == day), None)
        baseline_7d, count_7d = _window_avg(values, day, 7)
        baseline_14d, count_14d = _window_avg(values, day, 14)
        baseline_30d, count_30d = _window_avg(values, day, 30)

        if count_7d < MIN_SAMPLES_SHORT:
            baseline_7d = None
        if count_14d < MIN_SAMPLES_SHORT:
            baseline_14d = None
        if count_30d < MIN_SAMPLES_LONG:
            baseline_30d = None

        delta_7d = current - baseline_7d if (current is not None and baseline_7d is not None) else None
        delta_14d = current - baseline_14d if (current is not None and baseline_14d is not None) else None
        delta_30d = current - baseline_30d if (current is not None and baseline_30d is not None) else None

        direction = _direction(
            delta_14d if delta_14d is not None
            else (delta_7d if delta_7d is not None else delta_30d)
        )

        bundle.deltas.append(
            BaselineDelta(
                metric=metric_key,
                label=label,
                unit=unit,
                current=_round(current),
                baseline_7d=_round(baseline_7d),
                baseline_14d=_round(baseline_14d),
                baseline_30d=_round(baseline_30d),
                delta_7d=_round(delta_7d),
                delta_14d=_round(delta_14d),
                delta_30d=_round(delta_30d),
                direction=direction,
                sample_count_7d=count_7d,
                sample_count_14d=count_14d,
                sample_count_30d=count_30d,
                preferred=preferred,
            )
        )

    return bundle
