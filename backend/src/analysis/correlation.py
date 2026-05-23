"""Lag-aware Pearson/Spearman correlation between two metric series.

A positive ``lag_days`` means ``y`` is shifted forward by N days relative to
``x`` — i.e. we compare ``x`` on day D with ``y`` on day D+N. This is the
useful framing for Oura questions such as "does later bedtime affect
readiness tomorrow?" (lag = +1).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from math import sqrt
from typing import Dict, List, Optional, Tuple

from .series import MetricSeries


_MIN_PAIRED_FOR_INTERPRETATION = 7
_MIN_PAIRED_WITH_WARNING = 14


@dataclass
class CorrelationResult:
    x_metric: str
    y_metric: str
    lag_days: int
    method: str
    coefficient: Optional[float]
    sample_count: int
    paired_dates: List[Tuple[date, date]] = field(default_factory=list)
    warning: Optional[str] = None
    interpretation: str = ""

    def to_dict(self) -> Dict[str, object]:
        return {
            "x_metric": self.x_metric,
            "y_metric": self.y_metric,
            "lag_days": self.lag_days,
            "method": self.method,
            "coefficient": self.coefficient,
            "sample_count": self.sample_count,
            "paired_dates": [[a.isoformat(), b.isoformat()] for a, b in self.paired_dates],
            "warning": self.warning,
            "interpretation": self.interpretation,
        }


def _pearson(xs: List[float], ys: List[float]) -> Optional[float]:
    n = len(xs)
    if n < 2:
        return None
    mx = sum(xs) / n
    my = sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    dx = sqrt(sum((x - mx) ** 2 for x in xs))
    dy = sqrt(sum((y - my) ** 2 for y in ys))
    if dx == 0 or dy == 0:
        return None
    return num / (dx * dy)


def _rank(values: List[float]) -> List[float]:
    # Average rank for ties; supports Spearman.
    indexed = sorted(enumerate(values), key=lambda kv: kv[1])
    ranks = [0.0] * len(values)
    i = 0
    while i < len(indexed):
        j = i
        while j + 1 < len(indexed) and indexed[j + 1][1] == indexed[i][1]:
            j += 1
        avg_rank = (i + j) / 2.0 + 1.0
        for k in range(i, j + 1):
            ranks[indexed[k][0]] = avg_rank
        i = j + 1
    return ranks


def _spearman(xs: List[float], ys: List[float]) -> Optional[float]:
    return _pearson(_rank(xs), _rank(ys))


def _interpret(coef: Optional[float], n: int) -> Tuple[str, Optional[str]]:
    warning: Optional[str] = None
    if n < _MIN_PAIRED_FOR_INTERPRETATION:
        return ("Not enough paired samples to interpret.", "low_samples")
    if n < _MIN_PAIRED_WITH_WARNING:
        warning = "fewer_than_14_paired_samples"
    if coef is None:
        return ("Coefficient could not be computed (zero variance in one series).", warning)
    abs_c = abs(coef)
    direction = "positive" if coef > 0 else "negative" if coef < 0 else "no"
    if abs_c < 0.1:
        strength = "essentially no"
    elif abs_c < 0.3:
        strength = "weak"
    elif abs_c < 0.5:
        strength = "moderate"
    elif abs_c < 0.7:
        strength = "strong"
    else:
        strength = "very strong"
    text = f"{strength} {direction} association across {n} paired days."
    return text, warning


def compute_correlation(
    x_series: MetricSeries,
    y_series: MetricSeries,
    lag_days: int = 0,
    method: str = "pearson",
) -> CorrelationResult:
    """Correlate ``x_series`` with ``y_series`` shifted forward by ``lag_days``."""

    if method not in {"pearson", "spearman"}:
        raise ValueError(f"unknown method '{method}'")
    y_map = {p.day: p.value for p in y_series.points}
    xs: List[float] = []
    ys: List[float] = []
    pairs: List[Tuple[date, date]] = []
    for p in x_series.points:
        target_day = p.day + timedelta(days=lag_days)
        v = y_map.get(target_day)
        if v is None:
            continue
        xs.append(p.value)
        ys.append(v)
        pairs.append((p.day, target_day))

    coef = _pearson(xs, ys) if method == "pearson" else _spearman(xs, ys)
    interpretation, warning = _interpret(coef, len(xs))
    return CorrelationResult(
        x_metric=x_series.metric_path,
        y_metric=y_series.metric_path,
        lag_days=lag_days,
        method=method,
        coefficient=None if coef is None else round(coef, 4),
        sample_count=len(xs),
        paired_dates=pairs,
        warning=warning,
        interpretation=interpretation,
    )
