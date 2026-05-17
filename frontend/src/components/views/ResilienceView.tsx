import { useDashboard } from '@/contexts/DashboardContext';
import { MetricPill } from '@/components/health/MetricPill';
import { Shield } from 'lucide-react';
import { format } from 'date-fns';

export function ResilienceView() {
  const { data, isDataLoading, selectedDate } = useDashboard();

  if (isDataLoading) {
    return <div className="flex items-center justify-center h-full text-white/30 text-sm">Loading...</div>;
  }

  const raw = data;
  const resilience = raw?.resilience?.[0] ?? raw?.resilience;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-medium text-white/95">Resilience</h1>
        <p className="text-sm text-white/40 mt-1">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="flex items-center justify-center py-4">
        {resilience?.level ? (
          <div className="flex flex-col items-center gap-2">
            <Shield className="h-16 w-16 text-emerald-400" />
            <span className="text-xl font-semibold text-white/90">{resilience.level}</span>
            <span className="text-xs text-white/40">Resilience Level</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Shield className="h-16 w-16 text-white/20" />
            <span className="text-sm text-white/30">No resilience data</span>
          </div>
        )}
      </div>

      {resilience && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MetricPill
            label="Sleep Recovery"
            value={resilience.sleep_recovery != null ? `${Math.round(resilience.sleep_recovery)}%` : null}
          />
          <MetricPill
            label="Daytime Recovery"
            value={resilience.daytime_recovery != null ? `${Math.round(resilience.daytime_recovery)}%` : null}
          />
          <MetricPill
            label="Stress"
            value={resilience.stress != null ? `${Math.round(resilience.stress)}%` : null}
          />
        </div>
      )}

      {!resilience && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-white/40">Resilience data not available for this date</p>
          <p className="text-xs text-white/25 mt-1">This feature may require a newer Oura export format</p>
        </div>
      )}
    </div>
  );
}
