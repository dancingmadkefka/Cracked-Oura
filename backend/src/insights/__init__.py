"""Derived insight services: contributor cards, baseline deltas, action cards,
deterministic daily guidance, and sync freshness.

These services are read models over the existing raw imports; they never mutate
ingested data and can be recomputed at any time.
"""

from .contributors import (
    ContributorSummary,
    build_contributor_summaries,
    DOMAIN_CONTRIBUTOR_LABELS,
)
from .baselines import (
    BaselineDelta,
    BaselineBundle,
    build_baseline_bundle,
)
from .action_cards import (
    ActionCard,
    ActionEvidence,
    build_action_cards,
)
from .guidance import DailyGuidance, build_daily_guidance
from .sync_freshness import SyncFreshness, build_sync_freshness

__all__ = [
    "ContributorSummary",
    "build_contributor_summaries",
    "DOMAIN_CONTRIBUTOR_LABELS",
    "BaselineDelta",
    "BaselineBundle",
    "build_baseline_bundle",
    "ActionCard",
    "ActionEvidence",
    "build_action_cards",
    "DailyGuidance",
    "build_daily_guidance",
    "SyncFreshness",
    "build_sync_freshness",
]
