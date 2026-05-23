"""Unit tests for the contributor read model."""

from __future__ import annotations

from backend.src.insights.contributors import (
    DOMAIN_CONTRIBUTOR_LABELS,
    build_contributor_summaries,
)


def test_known_keys_get_labels_and_status_buckets():
    raw = {
        "deep_sleep": 90,
        "efficiency": 72,
        "latency": 58,
        "rem_sleep": 40,
    }
    summaries = {c.key: c for c in build_contributor_summaries("sleep", raw)}

    assert summaries["deep_sleep"].status == "optimal"
    assert summaries["deep_sleep"].label == "Deep sleep"
    assert summaries["deep_sleep"].source_path == "sleep.contributors.deep_sleep"
    assert summaries["efficiency"].status == "good"
    assert summaries["latency"].status == "fair"
    assert summaries["rem_sleep"].status == "pay_attention"


def test_missing_keys_are_emitted_as_missing():
    summaries = build_contributor_summaries("sleep", {})
    expected_keys = set(DOMAIN_CONTRIBUTOR_LABELS["sleep"].keys())
    keys = {c.key for c in summaries}
    assert keys == expected_keys
    assert all(c.status == "missing" for c in summaries)
    assert all(c.value is None for c in summaries)


def test_json_string_input_is_parsed():
    summaries = build_contributor_summaries(
        "readiness", '{"hrv_balance": 88, "resting_heart_rate": 60}'
    )
    by_key = {c.key: c for c in summaries}
    assert by_key["hrv_balance"].value == 88
    assert by_key["hrv_balance"].status == "optimal"
    assert by_key["resting_heart_rate"].status == "fair"


def test_unknown_keys_are_surfaced_with_title_case_label():
    raw = {"hrv_balance": 80, "future_signal": 50}
    summaries = build_contributor_summaries("readiness", raw)
    extra = next(c for c in summaries if c.key == "future_signal")
    assert extra.label == "Future Signal"
    assert extra.status == "pay_attention"
    assert extra.source_path == "readiness.contributors.future_signal"


def test_garbage_input_returns_only_known_keys_as_missing():
    summaries = build_contributor_summaries("activity", "not json at all")
    keys = {c.key for c in summaries}
    assert keys == set(DOMAIN_CONTRIBUTOR_LABELS["activity"].keys())
    assert all(c.status == "missing" for c in summaries)
