import { Trash2 } from 'lucide-react';
import type { SavedInvestigation } from '@/lib/api';

interface Props {
  investigations: SavedInvestigation[];
  loading: boolean;
  onDelete: (id: string) => Promise<void> | void;
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

function summarize(inv: SavedInvestigation): string {
  const p = inv.payload || {};
  if (inv.kind === 'correlation') {
    const c = typeof p.coefficient === 'number' ? p.coefficient.toFixed(2) : '—';
    const n = p.sample_count ?? '?';
    const lag = p.lag_days ?? 0;
    return `r = ${c} · n = ${n} · lag ${lag > 0 ? `+${lag}` : lag}d`;
  }
  if (inv.kind === 'anomaly') {
    return p.day ? `Anomaly snapshot for ${p.day}` : 'Anomaly snapshot';
  }
  if (inv.kind === 'ai') {
    return p.prompt ? String(p.prompt).slice(0, 80) : 'AI investigation';
  }
  return inv.kind;
}

export function SavedInvestigationsPanel({ investigations, loading, onDelete }: Props) {
  if (loading) {
    return <div className="glass-card rounded-2xl p-5 text-white/40 text-sm">Loading saved investigations…</div>;
  }
  if (investigations.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5 text-white/40 text-sm">
        No saved investigations yet. Run a correlation in the Correlate tab and press “Save investigation”.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {investigations.map((inv) => (
        <div key={inv.id} className="glass-card rounded-2xl p-4 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate">{inv.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/40 px-1.5 py-0.5 rounded bg-white/[0.05]">
                {inv.kind}
              </span>
            </div>
            <div className="text-xs text-white/60 mt-1">{summarize(inv)}</div>
            <div className="text-[11px] text-white/30 mt-1">Saved {fmtDate(inv.updated_at)}</div>
          </div>
          <button
            onClick={() => onDelete(inv.id)}
            className="p-2 rounded-lg text-white/30 hover:text-living-coral hover:bg-white/[0.04] transition"
            title="Delete investigation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
