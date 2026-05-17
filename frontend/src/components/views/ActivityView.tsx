import { useDashboard } from '@/contexts/DashboardContext';
import { buildDaySummary } from '@/lib/day-summary';
import { ScoreRing } from '@/components/health/ScoreRing';
import { MetricPill } from '@/components/health/MetricPill';
import { Footprints, Flame, TrendingUp, Timer } from 'lucide-react';
import { format } from 'date-fns';

export function ActivityView() {
  const { data, isDataLoading, selectedDate } = useDashboard();

  if (isDataLoading) {
    return <div className="flex items-center justify-center h-full text-white/30 text-sm">Loading...</div>;
  }

  const summary = buildDaySummary(data, format(selectedDate, 'yyyy-MM-dd'));
  const raw = data;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-medium text-white/95">Activity</h1>
        <p className="text-sm text-white/40 mt-1">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="flex items-center justify-center py-4">
        <ScoreRing score={summary.scores.activity} label="Activity Score" color="#f59e0b" size={140} strokeWidth={10} />
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
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Workouts</p>
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

      {!summary.scores.activity && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-white/40">No activity data for this date</p>
        </div>
      )}
    </div>
  );
}
