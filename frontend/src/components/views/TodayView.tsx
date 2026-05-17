import { useDashboard } from '@/contexts/DashboardContext';
import { buildDaySummary } from '@/lib/day-summary';
import { ScoreRing } from '@/components/health/ScoreRing';
import { MetricPill } from '@/components/health/MetricPill';
import { DailyInsightCard } from '@/components/health/DailyInsightCard';
import { MiniTrendStrip } from '@/components/health/MiniTrendStrip';
import { Footprints, Moon, Heart, Flame, Zap, Tag, Shield } from 'lucide-react';
import { format } from 'date-fns';
import type { AppView } from '@/components/layout/HealthSidebar';

interface TodayViewProps {
  onNavigate: (view: AppView) => void;
}

export function TodayView({ onNavigate }: TodayViewProps) {
  const { data, isDataLoading, selectedDate } = useDashboard();

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/30 text-sm">Loading today&apos;s data...</div>
      </div>
    );
  }

  const summary = buildDaySummary(data, format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-['Space_Grotesk',sans-serif] text-3xl font-medium tracking-tight text-white/95">
          {summary.greeting}
        </h1>
        <p className="text-sm text-white/40 mt-1">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Score Rings */}
      <div className="flex items-center justify-center gap-8 py-4">
        <ScoreRing
          score={summary.scores.sleep}
          label="Sleep"
          color="#60a5fa"
          onClick={() => onNavigate('sleep')}
        />
        <ScoreRing
          score={summary.scores.readiness}
          label="Readiness"
          color="#34d399"
          onClick={() => onNavigate('readiness')}
        />
        <ScoreRing
          score={summary.scores.activity}
          label="Activity"
          color="#f59e0b"
          onClick={() => onNavigate('activity')}
        />
      </div>

      {/* Insight */}
      <DailyInsightCard insight={summary.insight} />

      {/* Quick Metrics */}
      <div className="flex flex-wrap gap-2">
        <MetricPill
          label="Steps"
          value={summary.metrics.steps?.toLocaleString() ?? null}
          icon={<Footprints className="h-3.5 w-3.5" />}
        />
        <MetricPill
          label="Sleep"
          value={summary.metrics.totalSleepFormatted}
          icon={<Moon className="h-3.5 w-3.5" />}
        />
        <MetricPill
          label="Resting HR"
          value={summary.metrics.restingHr}
          unit="bpm"
          icon={<Heart className="h-3.5 w-3.5" />}
        />
        <MetricPill
          label="HRV"
          value={summary.metrics.hrv}
          icon={<Zap className="h-3.5 w-3.5" />}
        />
        <MetricPill
          label="Calories"
          value={summary.metrics.calories?.toLocaleString() ?? null}
          icon={<Flame className="h-3.5 w-3.5" />}
        />
        {summary.metrics.resilience && (
          <MetricPill
            label="Resilience"
            value={summary.metrics.resilience}
            icon={<Shield className="h-3.5 w-3.5" />}
          />
        )}
      </div>

      {/* Tags */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2 flex items-center gap-1.5">
          <Tag className="h-3 w-3" />
          Tags
        </p>
        {summary.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {summary.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-white/[0.06] text-xs text-white/60"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/30">No tags logged</p>
        )}
      </div>

      {/* Trend Strips */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-white/30">30-Day Trends</p>
        <MiniTrendStrip metric="sleep.score" label="Sleep" color="#60a5fa" />
        <MiniTrendStrip metric="readiness.score" label="Readiness" color="#34d399" />
        <MiniTrendStrip metric="activity.score" label="Activity" color="#f59e0b" />
      </div>
    </div>
  );
}
