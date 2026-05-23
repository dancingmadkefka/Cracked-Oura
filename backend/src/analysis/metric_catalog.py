"""Canonical catalog of metrics usable in correlation/anomaly analyses.

Each entry is a curated, stable metric path (``domain.field`` or
``domain.json.key``) with a friendly label and unit. Phase 2 analysis features
restrict themselves to this catalog so that lag semantics, units, and direction
remain well-defined.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, Optional, Tuple


@dataclass(frozen=True)
class MetricSpec:
    path: str
    label: str
    unit: str
    domain: str  # one of: sleep | activity | readiness | sleep_session
    field: str
    json_key: Optional[str] = None
    preferred: Optional[str] = None  # "higher" | "lower" | None
    description: str = ""

    def to_dict(self) -> Dict[str, object]:
        return {
            "path": self.path,
            "label": self.label,
            "unit": self.unit,
            "domain": self.domain,
            "field": self.field,
            "json_key": self.json_key,
            "preferred": self.preferred,
            "description": self.description,
        }


def _spec(
    path: str,
    label: str,
    unit: str,
    domain: str,
    field: str,
    json_key: Optional[str] = None,
    preferred: Optional[str] = None,
    description: str = "",
) -> Tuple[str, MetricSpec]:
    return path, MetricSpec(path, label, unit, domain, field, json_key, preferred, description)


METRIC_CATALOG: Dict[str, MetricSpec] = dict([
    _spec("sleep.score", "Sleep score", "score", "sleep", "score", preferred="higher"),
    _spec(
        "sleep_session.total_sleep_duration",
        "Total sleep",
        "min",
        "sleep_session",
        "total_sleep_duration",
        preferred="higher",
        description="Longest primary session per day, in minutes.",
    ),
    _spec(
        "sleep_session.efficiency",
        "Sleep efficiency",
        "%",
        "sleep_session",
        "efficiency",
        preferred="higher",
    ),
    _spec(
        "sleep_session.average_hrv",
        "Average HRV",
        "ms",
        "sleep_session",
        "average_hrv",
        preferred="higher",
    ),
    _spec(
        "sleep_session.average_heart_rate",
        "Resting heart rate",
        "bpm",
        "sleep_session",
        "average_heart_rate",
        preferred="lower",
    ),
    _spec(
        "sleep_session.bedtime_start_minutes",
        "Bedtime (mins after midnight)",
        "min",
        "sleep_session",
        "bedtime_start",
        description="Minutes after midnight; supports lag-aware bedtime analyses.",
    ),
    _spec("readiness.score", "Readiness score", "score", "readiness", "score", preferred="higher"),
    _spec(
        "readiness.temperature_deviation",
        "Temperature deviation",
        "°C",
        "readiness",
        "temperature_deviation",
    ),
    _spec(
        "readiness.temperature_trend_deviation",
        "Temperature trend deviation",
        "°C",
        "readiness",
        "temperature_trend_deviation",
    ),
    _spec("activity.score", "Activity score", "score", "activity", "score", preferred="higher"),
    _spec("activity.steps", "Steps", "steps", "activity", "steps", preferred="higher"),
    _spec(
        "activity.active_calories",
        "Active calories",
        "kcal",
        "activity",
        "active_calories",
        preferred="higher",
    ),
    _spec(
        "activity.high_activity_time",
        "High activity time",
        "sec",
        "activity",
        "high_activity_time",
        preferred="higher",
    ),
    _spec(
        "activity.sedentary_time",
        "Sedentary time",
        "sec",
        "activity",
        "sedentary_time",
        preferred="lower",
    ),
])


def resolve_metric(path: str) -> MetricSpec:
    spec = METRIC_CATALOG.get(path)
    if spec is None:
        raise KeyError(f"Unknown metric path: {path}")
    return spec


def catalog_iter() -> Iterable[MetricSpec]:
    return METRIC_CATALOG.values()
