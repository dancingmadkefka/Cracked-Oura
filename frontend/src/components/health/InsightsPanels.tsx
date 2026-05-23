import type { ActionCard, BaselineBundle, ContributorSummary, DailyGuidance, SyncFreshness } from '@/lib/api';
import { AlertTriangle, AlertCircle, Info, ArrowDown, ArrowUp, Minus, RefreshCcw, CheckCircle2, CloudOff } from 'lucide-react';

const STATUS_COLORS: Record<ContributorSummary['status'], string> = {
  optimal: 'text-score-green border-score-green/30 bg-score-green/10',
  good: 'text-enso-blue border-enso-blue/30 bg-enso-blue/10',
  fair: 'text-score-yellow border-score-yellow/30 bg-score-yellow/10',
  pay_attention: 'text-score-red border-score-red/30 bg-score-red/10',
  missing: 'text-white/40 border-white/10 bg-white/[0.04]',
};

const STATUS_LABEL: Record<ContributorSummary['status'], string> = {
  optimal: 'Optimal',
  good: 'Good',
  fair: 'Fair',
  pay_attention: 'Pay attention',
  missing: 'Not exported',
};

const SEVERITY_ICON = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const FRESHNESS_BADGE: Record<SyncFreshness['status'], { label: string; cls: string; Icon: React.ElementType }> = {
  fresh: { label: 'Fresh', cls: 'bg-score-green/10 text-score-green border-score-green/30', Icon: CheckCircle2 },
  stale: { label: 'Stale', cls: 'bg-score-yellow/10 text-score-yellow border-score-yellow/30', Icon: RefreshCcw },
  very_stale: { label: 'Very stale', cls: 'bg-score-red/10 text-score-red border-score-red/30', Icon: AlertTriangle },
  empty: { label: 'No data', cls: 'bg-white/5 text-white/50 border-white/10', Icon: CloudOff },
  syncing: { label: 'Syncing', cls: 'bg-enso-blue/10 text-enso-blue border-enso-blue/30', Icon: RefreshCcw },
  blocked: { label: 'Blocked', cls: 'bg-score-red/10 text-score-red border-score-red/30', Icon: AlertCircle },
};

export function SyncFreshnessChip({ freshness }: { freshness: SyncFreshness | null }) {
  if (!freshness) return null;
  const { label, cls, Icon } = FRESHNESS_BADGE[freshness.status];
  const title = freshness.message ?? '';
  return (
    <div
      title={title}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${cls}`}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
      {freshness.latest_day && (
        <span className="text-white/40 hidden sm:inline">· {freshness.latest_day}</span>
      )}
    </div>
  );
}

export function GuidanceBlock({ guidance }: { guidance: DailyGuidance | null }) {
  if (!guidance) return null;
  return (
    <div className="space-y-2">
      <h2 className="font-serif text-2xl md:text-3xl text-white leading-tight tracking-wide">
        {guidance.headline}
      </h2>
      {guidance.body.map((line, i) => (
        <p key={i} className="text-sm text-white/55 leading-relaxed">{line}</p>
      ))}
    </div>
  );
}

export function ActionCardsList({ cards }: { cards: ActionCard[] }) {
  if (!cards || cards.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-white/30">Today&apos;s actions</p>
      <div className="space-y-2">
        {cards.map((card) => {
          const Icon = SEVERITY_ICON[card.severity] ?? Info;
          const tone =
            card.severity === 'critical' ? 'border-score-red/40 bg-score-red/[0.06]' :
            card.severity === 'warning' ? 'border-score-yellow/30 bg-score-yellow/[0.06]' :
            'border-enso-blue/30 bg-enso-blue/[0.06]';
          return (
            <div key={card.id} className={`rounded-xl border ${tone} p-3 flex gap-3`}>
              <Icon className="w-4 h-4 mt-0.5 text-white/70 flex-shrink-0" />
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-white">{card.title}</p>
                <p className="text-xs text-white/60">{card.reason}</p>
                <p className="text-xs text-white/45">{card.recommendation}</p>
                {card.evidence.length > 0 && (
                  <p className="text-[10px] text-white/30 truncate">
                    Source: {card.evidence.map((e) => e.source_path).join(', ')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ContributorGrid({ title, items }: { title: string; items: ContributorSummary[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-xl glass-card p-4 space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-white/30">{title}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {items.map((c) => (
          <div
            key={c.key}
            title={c.explanation}
            className={`rounded-lg border px-3 py-2 text-xs ${STATUS_COLORS[c.status]}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-white/80 font-medium truncate">{c.label}</span>
              <span className="text-white/60 text-[11px]">{c.value ?? '—'}</span>
            </div>
            <div className="text-[10px] mt-0.5 opacity-80">{STATUS_LABEL[c.status]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BaselineTable({ bundle }: { bundle: BaselineBundle | null }) {
  if (!bundle || bundle.deltas.length === 0) return null;
  return (
    <div className="rounded-xl glass-card p-4 space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-white/30">Baselines vs your usual</p>
      <div className="divide-y divide-white/[0.05]">
        {bundle.deltas.map((d) => {
          const ArrowIcon = d.direction === 'up' ? ArrowUp : d.direction === 'down' ? ArrowDown : Minus;
          const tone =
            d.preferred === 'higher' && d.direction === 'down' ? 'text-score-red' :
            d.preferred === 'lower' && d.direction === 'up' ? 'text-score-red' :
            d.direction === 'flat' ? 'text-white/40' : 'text-score-green';
          const fmt = (v: number | null) => v == null ? '—' : `${v}${d.unit && d.unit !== 'score' ? ' ' + d.unit : ''}`;
          return (
            <div key={d.metric} className="flex items-center justify-between py-2 text-xs">
              <span className="text-white/70">{d.label}</span>
              <div className="flex items-center gap-3 text-white/60">
                <span className="tabular-nums">{fmt(d.current)}</span>
                <span className="text-white/30">7d {fmt(d.baseline_7d)} · 14d {fmt(d.baseline_14d)} · 30d {fmt(d.baseline_30d)}</span>
                {d.delta_14d != null && (
                  <span className={`inline-flex items-center gap-0.5 tabular-nums ${tone}`}>
                    <ArrowIcon className="w-3 h-3" />
                    {d.delta_14d > 0 ? '+' : ''}{d.delta_14d}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
