"""Rolling-baseline robust z-score anomaly detection per metric.

Anomalies are computed strictly from local history. Each result includes the
baseline window, threshold, observed value, and method label so the UI can
show the exact reason a day is flagged. Anomalies are **local** — they reflect
deviation from the user's recent norm, not a clinical diagnosis.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from math import sqrt
from typing import Dict, Iterable, List, Optional

from sqlalchemy.orm import Session

from .metric_catalog import resolve_metric
from .series import MetricSeries, build_metric_series


# Default metrics surfaced by the anomaly endpoint.
DEFAULT_ANOMALY_METRICS = [
    "sleep_session.average_hrv",
    "sleep_session.average_heart_rate",
    "readiness.temperature_deviation",
    "sleep_session.total_sleep_duration",
    "sleep_session.bedtime_start_minutes",
    "activity.score",
    "readiness.score",
]

# Robust z-score thresholds (modified z using MAD).
SEVERITY_THRESHOLDS = (("warning", 2.0), ("critical", 3.0))
MIN_BASELINE_SAMPLES = 10
DEFAULT_BASELINE_WINDOW = 28
MAD_SCALE = 1.4826  # makes MAD a consistent estimator of stdev for normal data


@dataclass
class AnomalyResult:
    metric_path: str
    label: str
    unit: str
    day: date
    value: float
    baseline_median: float
    baseline_mad: float
    score: float  # signed modified z-score (or stdev z-score fallback)
    direction: str  # "above" | "below"
    severity: str  # "warning" | "critical"
    baseline_window: int
    method: str = "rolling_modified_z"
    note: str = ""

    def to_dict(self) -> Dict[str, object]:
        return {
            "metric_path": self.metric_path,
            "label": self.label,
            "unit": self.unit,
            "day": self.day.isoformat(),
            "value": self.value,
            "baseline_median": self.baseline_median,
            "baseline_mad": self.baseline_mad,
            "score": round(self.score, 3),
            "direction": self.direction,
            "severity": self.severity,
            "baseline_window": self.baseline_window,
            "method": self.method,
            "note": self.note or "local anomaly",
        }


def _median(values: List[float]) -> float:
    s = sorted(values)
    n = len(s)
    if n == 0:
        return 0.0
    mid = n // 2
    return s[mid] if n % 2 else (s[mid - 1] + s[mid]) / 2.0


def _mad(values: List[float], med: float) -> float:
    return _median([abs(v - med) for v in values])


def _stdev(values: List[float], mean: float) -> float:
    if len(values) < 2:
        return 0.0
    return sqrt(sum((v - mean) ** 2 for v in values) / (len(values) - 1))


def _severity(score: float) -> Optional[str]:
    abs_s = abs(score)
    sev: Optional[str] = None
    for name, threshold in SEVERITY_THRESHOLDS:
        if abs_s >= threshold:
            sev = name
    return sev


def detect_anomalies_in_series(
    series: MetricSeries,
    target_days: Iterable[date],
    baseline_window: int = DEFAULT_BASELINE_WINDOW,
    min_samples: int = MIN_BASELINE_SAMPLES,
) -> List[AnomalyResult]:
    spec = resolve_metric(series.metric_path)
    day_value: Dict[date, float] = series.as_dict()
    out: List[AnomalyResult] = []
    for day in target_days:
        if day not in day_value:
            continue
        window_start = day - timedelta(days=baseline_window)
        baseline = [v for d, v in day_value.items() if window_start <= d < day]
        if len(baseline) < min_samples:
            continue
        med = _median(baseline)
        mad = _mad(baseline, med)
        value = day_value[day]
        method = "rolling_modified_z"
        if mad > 0:
            score = (value - med) / (MAD_SCALE * mad)
        else:
            # MAD collapses when the majority of the baseline is identical.
            # Fall back to a stdev-based z-score so a real deviation is still flagged.
            mean = sum(baseline) / len(baseline)
            sd = _stdev(baseline, mean)
            if sd > 0:
                score = (value - mean) / sd
                method = "rolling_stdev_z"
            else:
                # Constant baseline (no variance at all). Only flag a deviation
                # that is meaningfully large relative to the baseline level so
                # we don't surface noise (e.g. a 1-bpm jump from a flat seed).
                diff = value - mean
                threshold = max(1.0, 0.10 * abs(mean))
                if abs(diff) < threshold:
                    continue
                score = float("inf") if diff > 0 else float("-inf")
                method = "constant_baseline_deviation"
        severity = _severity(score)
        if severity is None:
            continue
        out.append(
            AnomalyResult(
                metric_path=series.metric_path,
                label=series.label,
                unit=series.unit,
                day=day,
                value=value,
                baseline_median=round(med, 3),
                baseline_mad=round(mad, 3),
                score=score,
                direction="above" if score > 0 else "below",
                severity=severity,
                baseline_window=baseline_window,
                method=method,
                note=f"{spec.label} deviates from your {baseline_window}-day local baseline.",
            )
        )
    return out


def compute_anomalies(
    db: Session,
    day: date,
    metrics: Optional[List[str]] = None,
    baseline_window: int = DEFAULT_BASELINE_WINDOW,
    window_days: int = 1,
) -> List[AnomalyResult]:
    """Return anomalies for the ``window_days`` ending on ``day``.

    ``window_days=1`` (default) inspects only ``day`` itself; larger values
    surface anomalies inside ``[day - window_days + 1, day]`` so the Trends
    view can highlight unusual days across a recent range.
    """

    chosen = metrics or DEFAULT_ANOMALY_METRICS
    target_days = [day - timedelta(days=i) for i in range(window_days)]
    target_days.reverse()
    series_end = day
    series_start = day - timedelta(days=baseline_window + window_days)
    results: List[AnomalyResult] = []
    for path in chosen:
        try:
            resolve_metric(path)
        except KeyError:
            continue
        series = build_metric_series(db, path, series_start, series_end)
        results.extend(
            detect_anomalies_in_series(series, target_days, baseline_window=baseline_window)
        )
    results.sort(key=lambda r: (r.day, r.severity == "critical", abs(r.score)), reverse=True)
    return results
