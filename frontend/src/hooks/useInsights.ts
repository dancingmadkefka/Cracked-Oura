import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  ActionCard,
  BaselineBundle,
  ContributorBundle,
  DailyGuidance,
  SyncFreshness,
} from '@/lib/api';

export interface InsightsBundle {
  contributors: ContributorBundle | null;
  baselines: BaselineBundle | null;
  actionCards: ActionCard[];
  guidance: DailyGuidance | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/** Fetches all per-day insights for the selected day. */
export function useInsights(day: string | null): InsightsBundle {
  const [contributors, setContributors] = useState<ContributorBundle | null>(null);
  const [baselines, setBaselines] = useState<BaselineBundle | null>(null);
  const [actionCards, setActionCards] = useState<ActionCard[]>([]);
  const [guidance, setGuidance] = useState<DailyGuidance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!day) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    Promise.all([
      api.getContributors(day).catch(() => null),
      api.getBaselines(day).catch(() => null),
      api.getActionCards(day).catch(() => [] as ActionCard[]),
      api.getGuidance(day).catch(() => null),
    ])
      .then(([c, b, a, g]) => {
        if (cancelled) return;
        setContributors(c);
        setBaselines(b);
        setActionCards(a ?? []);
        setGuidance(g);
      })
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [day, tick]);

  return { contributors, baselines, actionCards, guidance, isLoading, error, refresh };
}

export function useSyncFreshness(refreshMs = 60_000): {
  freshness: SyncFreshness | null;
  refresh: () => void;
} {
  const [freshness, setFreshness] = useState<SyncFreshness | null>(null);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    const fetchOnce = () => {
      api.getSyncFreshness()
        .then((f) => !cancelled && setFreshness(f))
        .catch(() => !cancelled && setFreshness(null));
    };
    fetchOnce();
    const id = window.setInterval(fetchOnce, refreshMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [refreshMs, tick]);

  return { freshness, refresh };
}
