import type { ContributorSummary } from '@/lib/api';

export type Status = ContributorSummary['status'];

export const STATUS_LABEL: Record<Status, string> = {
  optimal: 'Optimal',
  good: 'Good',
  fair: 'Fair',
  pay_attention: 'Pay attention',
  missing: 'Not exported',
};

export const STATUS_TEXT_CLASS: Record<Status, string> = {
  optimal: 'text-score-green',
  good: 'text-enso-blue',
  fair: 'text-score-yellow',
  pay_attention: 'text-score-red',
  missing: 'text-white/40',
};

export const STATUS_DOT_BG: Record<Status, string> = {
  optimal: 'bg-score-green',
  good: 'bg-enso-blue',
  fair: 'bg-score-yellow',
  pay_attention: 'bg-score-red',
  missing: 'bg-white/30',
};

// Soft ring used for the standard contributor tile.
export const STATUS_RING_CLASS: Record<Status, string> = {
  optimal: 'border border-score-green/35 bg-score-green/[0.06]',
  good: 'border border-enso-blue/35 bg-enso-blue/[0.06]',
  fair: 'border border-score-yellow/35 bg-score-yellow/[0.06]',
  pay_attention: 'border border-score-red/40 bg-score-red/[0.07]',
  missing: 'border border-white/10 bg-white/[0.03]',
};

// Stronger treatment for the hero card.
export const STATUS_HERO_CLASS: Record<Status, string> = {
  optimal: 'border border-score-green/45 bg-score-green/[0.09]',
  good: 'border border-enso-blue/45 bg-enso-blue/[0.09]',
  fair: 'border border-score-yellow/50 bg-score-yellow/[0.10]',
  pay_attention: 'border border-score-red/55 bg-score-red/[0.11]',
  missing: 'border border-white/15 bg-white/[0.04]',
};

// Raw hex colours used by SVG fills/strokes (sparkline).
export const STATUS_HEX: Record<Status, string> = {
  optimal: '#4ECDC4',
  good: '#A2D3E8',
  fair: '#FFD166',
  pay_attention: '#FC6558',
  missing: 'rgba(255,255,255,0.4)',
};

// Sort order used to put the most actionable contributors first.
export const STATUS_ORDER: Status[] = ['pay_attention', 'fair', 'good', 'optimal', 'missing'];

export function StatusDot({ status, className = '' }: { status: Status; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT_BG[status]} ${className}`}
    />
  );
}

export function StatusBadge({
  status,
  className = '',
}: {
  status: Status;
  className?: string;
}) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${STATUS_TEXT_CLASS[status]} ${className}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
