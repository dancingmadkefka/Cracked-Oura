import { useDashboard } from '@/contexts/DashboardContext';
import { buildDaySummary } from '@/lib/day-summary';
import { ScoreRing } from '@/components/health/ScoreRing';
import { MetricPill } from '@/components/health/MetricPill';
import { Heart, Zap, Thermometer, Brain } from 'lucide-react';
import { format } from 'date-fns';
import { useInsights } from '@/hooks/useInsights';
import { BaselineTable, ContributorGrid } from '@/components/health/InsightsPanels';

const READINESS_BASELINE_METRICS = new Set([
  'readiness_score',
  'hrv',
  'resting_hr',
  'temperature_deviation',
]);

export function ReadinessView() {
  const { data, isDataLoading, selectedDate } = useDashboard();
  const dayKey = format(selectedDate, 'yyyy-MM-dd');
  const insights = useInsights(dayKey);

  if (isDataLoading) {
    return <div className="flex items-center justify-center h-full text-white/30 text-sm">Loading...</div>;
  }

  const summary = buildDaySummary(data, format(selectedDate, 'yyyy-MM-dd'));
  const raw = data;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto animate-fadeIn">
      <div>
        <h1 className="font-serif text-3xl text-white tracking-wide">Readiness</h1>
        <p className="text-sm text-white/40 mt-1">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="flex items-center justify-center py-4">
        <ScoreRing score={summary.scores.readiness} label="Readiness Score" color="#4ECDC4" size={140} strokeWidth={10} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricPill label="Resting HR" value={summary.metrics.restingHr} unit="bpm" icon={<Heart className="h-3.5 w-3.5" />} />
        <MetricPill label="HRV" value={summary.metrics.hrv} icon={<Zap className="h-3.5 w-3.5" />} />
        <MetricPill
          label="Temp Deviation"
          value={raw?.readiness?.temperature_deviation != null ? `${raw.readiness.temperature_deviation}°C` : null}
          icon={<Thermometer className="h-3.5 w-3.5" />}
        />
        <MetricPill label="Recovery" value={raw?.resilience?.[0]?.sleep_recovery != null ? `${Math.round(raw.resilience[0].sleep_recovery)}%` : null} icon={<Brain className="h-3.5 w-3.5" />} />
      </div>

      {insights.contributors && (
        <ContributorGrid title="Readiness contributors" items={insights.contributors.readiness} />
      )}

      {insights.baselines && (
        <BaselineTable
          bundle={{
            day: insights.baselines.day,
            deltas: insights.baselines.deltas.filter((d) => READINESS_BASELINE_METRICS.has(d.metric)),
          }}
        />
      )}

      {!summary.scores.readiness && (
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-sm text-white/40">No readiness data for this date</p>
        </div>
      )}
    </div>
  );
}
