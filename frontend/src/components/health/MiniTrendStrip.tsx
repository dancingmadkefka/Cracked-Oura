import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface MiniTrendStripProps {
  metric: string;
  label: string;
  color: string;
  days?: number;
  endDate?: string;
}

export function MiniTrendStrip({ metric, label, color, days = 30, endDate }: MiniTrendStripProps) {
  const [data, setData] = useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = new Date(new Date(end).setDate(new Date(end).getDate() - days)).toISOString().split('T')[0];

    api.getQuery(metric, start, end)
      .then((res) => {
        if (Array.isArray(res)) {
          setData(res.map((d: any) => ({ date: d.day || d.date, value: d.value ?? d.score })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [metric, days, endDate]);

  if (loading || data.length === 0) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-wider text-white/30">{label}</span>
        <div className="h-8 flex-1 rounded-lg bg-white/[0.03]" />
      </div>
    );
  }

  const values = data.map(d => d.value).filter(v => v != null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const height = 32;
  const width = 120;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const latest = values[values.length - 1];

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-white/30">{label}</span>
        <span className="text-sm font-semibold text-white/90">{latest}</span>
      </div>
      <svg width={width} height={height} className="flex-1">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          opacity="0.8"
        />
      </svg>
    </div>
  );
}
