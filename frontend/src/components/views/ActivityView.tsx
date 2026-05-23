import { useDashboard } from '@/contexts/DashboardContext';
import { buildDaySummary } from '@/lib/day-summary';
import { ScoreRing } from '@/components/health/ScoreRing';
import { MetricPill } from '@/components/health/MetricPill';
import { Flame, Footprints, TrendingUp, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { useInsights } from '@/hooks/useInsights';
import { BaselineTable, ContributorGrid } from '@/components/health/InsightsPanels';

const ACTIVITY_BASELINE_METRICS = new Set([
  'activity_score',
]);

export function ActivityView() {
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
        <h1 className="font-serif text-3xl text-white tracking-wide">Activity</h1>
        <p className="text-sm text-white/40 mt-1">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="flex items-center justify-center py-4">
        <ScoreRing score={summary.scores.activity} label="Activity Score" color="#FFD166" size={140} strokeWidth={10} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricPill label="Steps" value={summary.metrics.steps?.toLocaleString() ?? null} icon={<Footprints className="h-3.5 w-3.5" />} />
        <MetricPill label="Calories" value={summary.metrics.calories?.toLocaleString() ?? null} icon={<Flame className="h-3.5 w-3.5" />} />
        <MetricPill
          label="Active Time"
          value={raw?.activity?.active_time != null ? `${Math.round(raw.activity.active_time / 60)}m` : null}
          icon={<Timer className="h-3.5 w-3.5" />}
        />
        <MetricPill
          label="Workouts"
          value={raw?.workouts?.length ?? null}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
      </div>

      {raw?.workouts && raw.workouts.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3">Workouts</p>
          <div className="space-y-2">
            {raw.workouts.map((w: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-white/70">{w.type || 'Workout'}</span>
                <span className="text-white/40">{w.intensity || ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.contributors && (
        <ContributorGrid title="Activity contributors" items={insights.contributors.activity} />
      )}

      {insights.baselines && (
        <BaselineTable
          bundle={{
            day: insights.baselines.day,
            deltas: insights.baselines.deltas.filter((d) => ACTIVITY_BASELINE_METRICS.has(d.metric)),
          }}
        />
      )}

      {!summary.scores.activity && (
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-sm text-white/40">No activity data for this date</p>
        </div>
      )}
    </div>
  );
}
