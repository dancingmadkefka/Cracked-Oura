import { useDashboard } from '@/contexts/DashboardContext';
import { buildDaySummary } from '@/lib/day-summary';
import { ScoreRing } from '@/components/health/ScoreRing';
import { MetricPill } from '@/components/health/MetricPill';
import { Brain, Heart, Zap, Thermometer } from 'lucide-react';
import { format } from 'date-fns';

export function ReadinessView() {
  const { data, isDataLoading, selectedDate } = useDashboard();

  if (isDataLoading) {
    return <div className="flex items-center justify-center h-full text-white/30 text-sm">Loading...</div>;
  }

  const summary = buildDaySummary(data, format(selectedDate, 'yyyy-MM-dd'));
  const raw = data;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-medium text-white/95">Readiness</h1>
        <p className="text-sm text-white/40 mt-1">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="flex items-center justify-center py-4">
        <ScoreRing score={summary.scores.readiness} label="Readiness Score" color="#34d399" size={140} strokeWidth={10} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricPill label="Resting HR" value={summary.metrics.restingHr} unit="bpm" icon={<Heart className="h-3.5 w-3.5" />} />
        <MetricPill label="HRV" value={summary.metrics.hrv} icon={<Zap className="h-3.5 w-3.5" />} />
        <MetricPill
          label="Body Temp"
          value={raw?.readiness?.body_temperature != null ? `${raw.readiness.body_temperature}°C` : null}
          icon={<Thermometer className="h-3.5 w-3.5" />}
        />
        <MetricPill label="Recovery" value={raw?.resilience?.[0]?.sleep_recovery != null ? `${Math.round(raw.resilience[0].sleep_recovery)}%` : null} icon={<Brain className="h-3.5 w-3.5" />} />
      </div>

      {!summary.scores.readiness && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-white/40">No readiness data for this date</p>
        </div>
      )}
    </div>
  );
}
