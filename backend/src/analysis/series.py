"""Build a uniform daily ``MetricSeries`` from the SQLAlchemy models.

The :class:`MetricSeries` shape is what correlation, anomaly detection, and
the frontend Explorer all consume. Series are extracted per metric path from
the catalog. Days with no data are simply absent from ``points`` and surfaced
via ``missing_count`` (the gap between the requested range and the data).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from ..models import Activity, Readiness, Sleep, SleepSession
from .metric_catalog import MetricSpec, resolve_metric


@dataclass(frozen=True)
class SeriesPoint:
    day: date
    value: float


@dataclass
class MetricSeries:
    metric_path: str
    label: str
    unit: str
    start_day: date
    end_day: date
    points: List[SeriesPoint] = field(default_factory=list)

    @property
    def sample_count(self) -> int:
        return len(self.points)

    @property
    def expected_count(self) -> int:
        return (self.end_day - self.start_day).days + 1

    @property
    def missing_count(self) -> int:
        return max(0, self.expected_count - self.sample_count)

    def as_dict(self) -> Dict[date, float]:
        return {p.day: p.value for p in self.points}

    def to_response(self) -> Dict[str, object]:
        return {
            "metric_path": self.metric_path,
            "label": self.label,
            "unit": self.unit,
            "date_range": [self.start_day.isoformat(), self.end_day.isoformat()],
            "sample_count": self.sample_count,
            "missing_count": self.missing_count,
            "points": [{"day": p.day.isoformat(), "value": p.value} for p in self.points],
        }


def _extract_sleep(db: Session, spec: MetricSpec, start: date, end: date) -> List[SeriesPoint]:
    rows = db.query(Sleep).filter(Sleep.day >= start, Sleep.day <= end).all()
    pts: List[SeriesPoint] = []
    for r in rows:
        v = getattr(r, spec.field, None)
        if v is not None:
            pts.append(SeriesPoint(r.day, float(v)))
    return pts


def _extract_activity(db: Session, spec: MetricSpec, start: date, end: date) -> List[SeriesPoint]:
    rows = db.query(Activity).filter(Activity.day >= start, Activity.day <= end).all()
    pts: List[SeriesPoint] = []
    for r in rows:
        v = getattr(r, spec.field, None)
        if v is not None:
            pts.append(SeriesPoint(r.day, float(v)))
    return pts


def _extract_readiness(db: Session, spec: MetricSpec, start: date, end: date) -> List[SeriesPoint]:
    rows = db.query(Readiness).filter(Readiness.day >= start, Readiness.day <= end).all()
    pts: List[SeriesPoint] = []
    for r in rows:
        v = getattr(r, spec.field, None)
        if v is not None:
            pts.append(SeriesPoint(r.day, float(v)))
    return pts


def _extract_sleep_session(
    db: Session, spec: MetricSpec, start: date, end: date
) -> List[SeriesPoint]:
    sessions = (
        db.query(SleepSession)
        .filter(SleepSession.day >= start, SleepSession.day <= end)
        .filter(SleepSession.type.in_(["long_sleep", "sleep"]))
        .all()
    )
    # Pick the longest primary session per day.
    primary: Dict[date, SleepSession] = {}
    for s in sessions:
        cur = primary.get(s.day)
        if cur is None or (s.total_sleep_duration or 0) > (cur.total_sleep_duration or 0):
            primary[s.day] = s

    pts: List[SeriesPoint] = []
    for day, sess in sorted(primary.items()):
        if spec.path == "sleep_session.bedtime_start_minutes":
            bt = sess.bedtime_start
            if bt is None:
                continue
            mins = bt.hour * 60 + bt.minute
            # Normalize so 22:00 (1320) stays positive but 01:00 next day reads as 25*60 = 1500
            if mins < 12 * 60:
                mins += 24 * 60
            pts.append(SeriesPoint(day, float(mins)))
        else:
            raw = getattr(sess, spec.field, None)
            if raw is None:
                continue
            if spec.unit == "min" and spec.field == "total_sleep_duration":
                pts.append(SeriesPoint(day, float(raw) / 60.0))
            else:
                pts.append(SeriesPoint(day, float(raw)))
    return pts


_EXTRACTORS = {
    "sleep": _extract_sleep,
    "activity": _extract_activity,
    "readiness": _extract_readiness,
    "sleep_session": _extract_sleep_session,
}


def build_metric_series(
    db: Session, metric_path: str, start: date, end: date
) -> MetricSeries:
    """Extract a daily time series for ``metric_path`` over ``[start, end]``."""

    if end < start:
        raise ValueError("end day must be on or after start day")
    spec = resolve_metric(metric_path)
    extractor = _EXTRACTORS.get(spec.domain)
    if extractor is None:
        raise KeyError(f"No extractor registered for domain '{spec.domain}'")
    points = sorted(extractor(db, spec, start, end), key=lambda p: p.day)
    return MetricSeries(
        metric_path=spec.path,
        label=spec.label,
        unit=spec.unit,
        start_day=start,
        end_day=end,
        points=points,
    )


def default_range(end: date, days: int) -> tuple[date, date]:
    return end - timedelta(days=days - 1), end
