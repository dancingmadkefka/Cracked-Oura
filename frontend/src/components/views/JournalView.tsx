import { useDashboard } from '@/contexts/DashboardContext';
import { Tag, FileText, Info } from 'lucide-react';
import { format } from 'date-fns';
import { buildDaySummary } from '@/lib/day-summary';

export function JournalView() {
  const { data, selectedDate } = useDashboard();
  const summary = buildDaySummary(data, format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-medium text-white/95">Journal</h1>
        <p className="text-sm text-white/40 mt-1">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Tags from data */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-4 w-4 text-white/40" />
          <p className="text-[10px] uppercase tracking-widest text-white/30">Tags</p>
        </div>
        {summary.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {summary.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-white/[0.06] text-xs text-white/60"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/30">No tags logged for this date</p>
        )}
      </div>

      {/* Notes Area */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-white/40" />
          <p className="text-[10px] uppercase tracking-widest text-white/30">Notes</p>
        </div>
        <textarea
          className="w-full h-32 bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 text-sm text-white/70 placeholder:text-white/20 resize-none focus:outline-none focus:border-white/[0.12]"
          placeholder="Add notes for this day..."
        />
      </div>

      {/* Info */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-white/30 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-white/40">
            Journal notes are currently local-only and not persisted. Tag data is read from your Oura export if available.
          </p>
        </div>
      </div>
    </div>
  );
}
