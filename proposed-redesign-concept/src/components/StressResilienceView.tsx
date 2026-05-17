import React from 'react';
import { ShieldAlert, BatteryCharging, Info, TrendingDown } from 'lucide-react';
import { DayData } from '../data/mockOuraData';

interface StressResilienceViewProps {
  dayData: DayData;
}

export const StressResilienceView: React.FC<StressResilienceViewProps> = ({ dayData }) => {
  const { stressTimeline } = dayData;

  const stressCategories = [
    { id: 'restorative', label: 'Restorative Time', color: '#10B981', desc: 'Parasympathetic recovery' },
    { id: 'relaxed', label: 'Relaxed', color: '#3B82F6', desc: 'Calm, low physiological load' },
    { id: 'engaged', label: 'Engaged', color: '#F59E0B', desc: 'Active focus or light movement' },
    { id: 'stressed', label: 'Stressed', color: '#EF4444', desc: 'High physiological arousal' },
  ];

  const colorMap: Record<string, string> = {
    restorative: '#10B981', relaxed: '#3B82F6', engaged: '#F59E0B', stressed: '#EF4444'
  };

  const heightMap: Record<string, string> = {
    restorative: '25%', relaxed: '50%', engaged: '75%', stressed: '100%'
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-living-coral text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Stress & Resilience OS</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight">
            Resilience: <span className="text-score-green font-bold">{dayData.resilienceLevel}</span>
          </h2>
          <p className="text-sm text-white/45 leading-relaxed">
            Your Resilience level is based on your 14-day cumulative stress load. An <strong className="text-white/70">{dayData.resilienceLevel}</strong> rating means your body is exceptionally capable of absorbing high strain.
          </p>
        </div>

        <div className="relative w-32 h-32 flex items-center justify-center shrink-0 mx-auto md:mx-0">
          <div className="absolute inset-0 rounded-full border border-score-green/30 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-oura-black to-helsinki border border-white/[0.1] flex flex-col items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-score-green mb-1" />
            <span className="font-serif text-lg font-bold text-white">{dayData.resilienceLevel}</span>
            <span className="text-[9px] text-white/30 uppercase tracking-wider">Capacity</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-4 lg:col-span-1">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="font-serif text-lg text-white">Stress Summary</h3>
            <p className="text-sm text-white/60 leading-relaxed">{dayData.stressSummary}</p>
            <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
              {stressCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-medium text-white/70">{cat.label}</span>
                  </div>
                  <span className="text-white/30">{cat.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/70 uppercase tracking-wider">
              <BatteryCharging className="w-4 h-4 text-score-green" />
              <span>Restorative Time</span>
            </div>
            <div className="text-3xl font-serif text-white">2h 15m</div>
            <p className="text-xs text-white/35 leading-relaxed">
              Restorative time occurs when your body enters a state of deep relaxation during the day, allowing your nervous system to recharge.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h3 className="font-serif text-lg text-white">Daytime Stress Timeline</h3>
              <p className="text-xs text-white/30">Continuous physiological monitoring via heart rate & HRV</p>
            </div>
            <Info className="w-4 h-4 text-white/25" />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-white/60">Physiological State Distribution</div>
            <div className="h-36 w-full bg-white/[0.02] rounded-xl border border-white/[0.05] p-3 flex items-end gap-1.5">
              {stressTimeline.map((item, idx) => (
                <div key={idx} className="flex-1 rounded-t transition-all hover:opacity-80 cursor-pointer"
                  style={{ height: heightMap[item.level], backgroundColor: colorMap[item.level] }}
                  title={`${item.hour}: ${item.level.toUpperCase()}`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/25 px-1">
              <span>8 AM</span><span>11 AM</span><span>2 PM</span><span>5 PM</span><span>7 PM</span>
            </div>
          </div>

          <div className="glass-tab rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-white/70">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-score-green" />
                <span>14-Day Cumulative Stress Load</span>
              </div>
              <span className="text-score-green font-medium bg-score-green/10 px-2 py-0.5 rounded border border-score-green/20">Optimal Balance</span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              Your cumulative stress load has decreased by 12% over the past two weeks. Regular sauna sessions have successfully mitigated daytime work strain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
