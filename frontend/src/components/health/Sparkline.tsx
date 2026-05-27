import { useId } from 'react';
import { STATUS_HEX, type Status } from './status';

interface SparklineProps {
  data: (number | null)[];
  status: Status;
  height?: number;
  showAxis?: boolean;
  className?: string;
}

/**
 * Compact area+line sparkline. Renders gaps for null entries (sparse days).
 * Last non-null point is highlighted with a small dot.
 */
export function Sparkline({
  data,
  status,
  height = 36,
  showAxis = false,
  className = '',
}: SparklineProps) {
  const id = useId();
  const gradId = `spark-${id}`;
  const w = 200;
  const h = height;
  const pad = 3;
  const n = data.length;

  const values = data.filter((v): v is number => v != null);
  if (values.length < 2) {
    return (
      <div
        className={`rounded-md bg-white/[0.03] ${className}`}
        style={{ height: h }}
        aria-hidden
      />
    );
  }

  const min = Math.min(...values) - 4;
  const max = Math.max(...values) + 4;
  const range = Math.max(1, max - min);
  const x = (i: number) => pad + (i * (w - pad * 2)) / Math.max(1, n - 1);
  const y = (v: number) => pad + (1 - (v - min) / range) * (h - pad * 2);

  // Split into contiguous segments so nulls become visual gaps.
  const segments: string[][] = [];
  let current: string[] = [];
  data.forEach((v, i) => {
    if (v == null) {
      if (current.length) {
        segments.push(current);
        current = [];
      }
    } else {
      current.push(`${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    }
  });
  if (current.length) segments.push(current);

  let lastIdx = -1;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i] != null) {
      lastIdx = i;
      break;
    }
  }

  const color = STATUS_HEX[status];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      preserveAspectRatio="none"
      className={`block ${className}`}
      role="img"
      aria-label="7-day trend"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.34} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {showAxis && (
        <line
          x1={pad}
          y1={h - pad - 0.5}
          x2={w - pad}
          y2={h - pad - 0.5}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      )}
      {segments.map((seg, idx) => {
        if (seg.length === 0) return null;
        const firstX = seg[0].split(',')[0];
        const lastX = seg[seg.length - 1].split(',')[0];
        const areaPath = `M ${firstX},${h - pad} L ${seg.join(' L ')} L ${lastX},${h - pad} Z`;
        const linePath = `M ${seg.join(' L ')}`;
        return (
          <g key={idx}>
            <path d={areaPath} fill={`url(#${gradId})`} />
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth={1.6}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        );
      })}
      {lastIdx >= 0 && (
        <circle
          cx={x(lastIdx).toFixed(1)}
          cy={y(data[lastIdx] as number).toFixed(1)}
          r={3}
          fill={color}
          stroke="#151619"
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
}

/**
 * Returns the small "↑ +6 7d" / "↓ -23 7d" / "→ flat 7d" hint that sits beside
 * the status badge. Returns null when there isn't enough data to be meaningful.
 */
export function deltaIndicator(
  data: (number | null)[],
): { arrow: string; tone: string; label: string } | null {
  const values = data.filter((v): v is number => v != null);
  if (values.length < 2) return null;
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;
  if (Math.abs(delta) < 2) {
    return { arrow: '→', tone: 'text-white/40', label: 'flat 7d' };
  }
  if (delta > 0) {
    return { arrow: '↑', tone: 'text-score-green', label: `+${Math.round(delta)} 7d` };
  }
  return { arrow: '↓', tone: 'text-score-red', label: `${Math.round(delta)} 7d` };
}
