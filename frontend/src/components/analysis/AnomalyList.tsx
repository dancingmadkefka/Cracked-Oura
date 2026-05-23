import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnomalyResult } from '@/lib/api';

interface Props {
  anomalies: AnomalyResult[];
  loading: boolean;
  day: string;
}

const SEV_STYLES: Record<string, string> = {
  critical: 'border-living-coral/40 bg-living-coral/[0.06]',
  warning: 'border-enso-blue/40 bg-enso-blue/[0.06]',
};
const SEV_LABELS: Record<string, string> = {
  critical: 'Critical',
  warning: 'Warning',
};

function fmt(n: number, unit: string): string {
  if (!Number.isFinite(n)) return '—';
  const decimals = unit === '°C' ? 2 : Math.abs(n) >= 100 ? 0 : 1;
  return n.toFixed(decimals);
}

export function AnomalyList({ anomalies, loading, day }: Props) {
  if (loading) {
    return <div className="glass-card rounded-2xl p-5 text-white/40 text-sm">Loading anomalies…</div>;
  }
  if (anomalies.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5 text-white/40 text-sm">
        No local anomalies in the last 14 days ending {day}.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40">
        {anomalies.length} local anomal{anomalies.length === 1 ? 'y' : 'ies'} flagged in the last 14 days.
        These reflect deviation from your recent baseline, not a clinical diagnosis.
      </p>
      {anomalies.map((a, i) => {
        const Trend = a.direction === 'above' ? TrendingUp : TrendingDown;
        return (
          <div
            key={`${a.metric_path}-${a.day}-${i}`}
            className={cn(
              'glass-card rounded-2xl p-4 border',
              SEV_STYLES[a.severity] ?? 'border-white/10'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <AlertTriangle className={cn(
                  'h-4 w-4 shrink-0 mt-0.5',
                  a.severity === 'critical' ? 'text-living-coral' : 'text-enso-blue'
                )} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{a.label}</div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {a.day} · {SEV_LABELS[a.severity] ?? a.severity}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={cn(
                  'font-serif text-2xl tabular-nums',
                  a.direction === 'above' ? 'text-score-green' : 'text-living-coral'
                )}>
                  {fmt(a.value, a.unit)}
                  <span className="text-xs text-white/40 ml-1">{a.unit}</span>
                </div>
                <div className="flex items-center justify-end gap-1 text-[11px] text-white/40">
                  <Trend className="h-3 w-3" /> vs {fmt(a.baseline_median, a.unit)} {a.unit}
                </div>
              </div>
            </div>
            <p className="text-xs text-white/60 mt-3">{a.note}</p>
            <div className="text-[11px] text-white/30 mt-2 font-mono">
              z = {Number.isFinite(a.score) ? a.score.toFixed(2) : '∞'} · {a.method} · {a.baseline_window}d window
            </div>
          </div>
        );
      })}
    </div>
  );
}
