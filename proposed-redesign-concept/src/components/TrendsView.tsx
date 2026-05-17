import React, { useState } from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';
import { mockTrendsData } from '../data/mockOuraData';

export const TrendsView: React.FC = () => {
  const [metric1, setMetric1] = useState<'readiness' | 'sleep' | 'activity' | 'hrv' | 'rhr'>('readiness');
  const [metric2, setMetric2] = useState<'readiness' | 'sleep' | 'activity' | 'hrv' | 'rhr'>('sleep');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '1y'>('7d');

  const metricConfig: Record<string, { label: string; color: string; unit: string }> = {
    readiness: { label: 'Readiness Score', color: '#4ECDC4', unit: '' },
    sleep: { label: 'Sleep Score', color: '#A2D3E8', unit: '' },
    activity: { label: 'Activity Score', color: '#FFD166', unit: '' },
    hrv: { label: 'HRV Average', color: '#A2D3E8', unit: ' ms' },
    rhr: { label: 'Resting Heart Rate', color: '#FC6558', unit: ' bpm' },
  };

  const getValues = (metric: string) => mockTrendsData.map(d => (d as any)[metric]);
  const max1 = Math.max(...getValues(metric1), 100);
  const max2 = Math.max(...getValues(metric2), 100);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-enso-blue text-xs font-semibold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Trends & Bio-Signal Explorer</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight">Multi-Metric Correlation</h2>
          <p className="text-sm text-white/45 leading-relaxed">
            Explore long-term patterns and discover how your daily habits influence your physiological baselines.
          </p>
        </div>
        <div className="flex items-center gap-1 glass-tab rounded-xl p-1">
          {(['7d', '30d', '1y'] as const).map((t) => (
            <button key={t} onClick={() => setTimeframe(t)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                timeframe === t ? 'bg-white/[0.1] text-white' : 'text-white/35 hover:text-white/70'
              }`}>
              {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-4 lg:col-span-1">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Primary Metric</label>
              {(Object.keys(metricConfig) as string[]).map((key) => (
                <button key={key} onClick={() => setMetric1(key as any)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    metric1 === key ? 'glass-tab text-white border-enso-blue/30' : 'bg-white/[0.02] border-white/[0.05] text-white/35 hover:border-white/[0.1]'
                  }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metricConfig[key].color }} />
                    <span>{metricConfig[key].label}</span>
                  </div>
                  {metric1 === key && <span className="text-[10px] font-bold text-enso-blue">ACTIVE</span>}
                </button>
              ))}
            </div>
            <div className="space-y-3 pt-4 border-t border-white/[0.06]">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Secondary Metric</label>
              {(Object.keys(metricConfig) as string[]).map((key) => (
                <button key={key} onClick={() => setMetric2(key as any)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    metric2 === key ? 'glass-tab text-white border-enso-blue/30' : 'bg-white/[0.02] border-white/[0.05] text-white/35 hover:border-white/[0.1]'
                  }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metricConfig[key].color }} />
                    <span>{metricConfig[key].label}</span>
                  </div>
                  {metric2 === key && <span className="text-[10px] font-bold text-enso-blue">ACTIVE</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h3 className="font-serif text-lg text-white">Trend Explorer View</h3>
              <p className="text-xs text-white/30">{metricConfig[metric1].label} vs {metricConfig[metric2].label}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5" style={{ color: metricConfig[metric1].color }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metricConfig[metric1].color }} />{metricConfig[metric1].label}
              </div>
              <div className="flex items-center gap-1.5" style={{ color: metricConfig[metric2].color }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metricConfig[metric2].color }} />{metricConfig[metric2].label}
              </div>
            </div>
          </div>

          <div className="relative h-60 w-full bg-white/[0.02] rounded-xl border border-white/[0.05] p-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
              <path d={`M ${mockTrendsData.map((d, i) => `${(i / (mockTrendsData.length - 1)) * 600},${200 - (d[metric1] / max1) * 160}`).join(' L ')}`}
                fill="none" stroke={metricConfig[metric1].color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`M ${mockTrendsData.map((d, i) => `${(i / (mockTrendsData.length - 1)) * 600},${200 - (d[metric2] / max2) * 160}`).join(' L ')}`}
                fill="none" stroke={metricConfig[metric2].color} strokeWidth="2" strokeDasharray="6 6" strokeLinecap="round" strokeLinejoin="round" />
              {mockTrendsData.map((d, i) => {
                const x = (i / (mockTrendsData.length - 1)) * 600;
                return (
                  <g key={i}>
                    <circle cx={x} cy={200 - (d[metric1] / max1) * 160} r="4" fill={metricConfig[metric1].color} />
                    <circle cx={x} cy={200 - (d[metric2] / max2) * 160} r="4" fill={metricConfig[metric2].color} />
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/25 border-t border-white/[0.06] pt-3 px-4">
            {mockTrendsData.map(d => <span key={d.date}>{d.date}</span>)}
          </div>

          <div className="glass-tab rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-enso-blue">
              <Sparkles className="w-4 h-4" /> Oura Labs AI Correlation
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Strong positive correlation between your <strong style={{ color: metricConfig[metric1].color }}>{metricConfig[metric1].label}</strong> and <strong style={{ color: metricConfig[metric2].color }}>{metricConfig[metric2].label}</strong>. Consistent sleep timing and elevated HRV continue to drive your high readiness.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
