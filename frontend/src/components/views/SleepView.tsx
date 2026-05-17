import { useDashboard } from '@/contexts/DashboardContext';
import { buildDaySummary } from '@/lib/day-summary';
import { ScoreRing } from '@/components/health/ScoreRing';
import { MetricPill } from '@/components/health/MetricPill';
import { Moon, Heart, Clock, Sun, Sunset } from 'lucide-react';
import { format } from 'date-fns';

export function SleepView() {
  const { data, isDataLoading, selectedDate } = useDashboard();

  if (isDataLoading) {
    return <div className="flex items-center justify-center h-full text-white/30 text-sm">Loading...</div>;
  }

  const summary = buildDaySummary(data, format(selectedDate, 'yyyy-MM-dd'));
  const session = summary.primarySleepSession;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-medium text-white/95">Sleep</h1>
        <p className="text-sm text-white/40 mt-1">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="flex items-center justify-center py-4">
        <ScoreRing score={summary.scores.sleep} label="Sleep Score" color="#60a5fa" size={140} strokeWidth={10} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricPill label="Total Sleep" value={session.durationFormatted} icon={<Clock className="h-3.5 w-3.5" />} />
        <MetricPill label="Deep Sleep" value={session.deepMinutes != null ? `${session.deepMinutes}m` : null} icon={<Moon className="h-3.5 w-3.5" />} />
        <MetricPill label="REM Sleep" value={session.remMinutes != null ? `${session.remMinutes}m` : null} icon={<Sun className="h-3.5 w-3.5" />} />
        <MetricPill label="Light Sleep" value={session.lightMinutes != null ? `${session.lightMinutes}m` : null} icon={<Sunset className="h-3.5 w-3.5" />} />
      </div>

      {session.avgHr && (
        <MetricPill label="Avg Heart Rate" value={session.avgHr} unit="bpm" icon={<Heart className="h-3.5 w-3.5" />} />
      )}

      {!session.durationMinutes && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-white/40">No sleep data for this date</p>
        </div>
      )}
    </div>
  );
}
