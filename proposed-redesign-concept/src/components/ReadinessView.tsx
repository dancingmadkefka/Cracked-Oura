import React from 'react';
import { HeartPulse, TrendingUp, Thermometer, Activity, Info, Clock } from 'lucide-react';
import { DayData } from '../data/mockOuraData';

interface ReadinessViewProps {
  dayData: DayData;
}

export const ReadinessView: React.FC<ReadinessViewProps> = ({ dayData }) => {
  const contributors = [
    { id: 'rhr', label: 'Resting Heart Rate', value: `${dayData.readinessContributors.restingHeartRate.value} bpm`, status: dayData.readinessContributors.restingHeartRate.status, desc: dayData.readinessContributors.restingHeartRate.text, icon: HeartPulse, color: '#FC6558' },
    { id: 'hrv', label: 'HRV Balance', value: `${dayData.readinessContributors.hrvBalance.value} ms`, status: dayData.readinessContributors.hrvBalance.status, desc: dayData.readinessContributors.hrvBalance.text, icon: TrendingUp, color: '#4ECDC4' },
    { id: 'temp', label: 'Body Temperature', value: dayData.readinessContributors.bodyTemperature.value, status: dayData.readinessContributors.bodyTemperature.status, desc: dayData.readinessContributors.bodyTemperature.text, icon: Thermometer, color: '#FFD166' },
    { id: 'recovery', label: 'Recovery Index', value: `${dayData.readinessContributors.recoveryIndex.value}%`, status: dayData.readinessContributors.recoveryIndex.status, desc: dayData.readinessContributors.recoveryIndex.text, icon: Activity, color: '#A2D3E8' },
    { id: 'sleep', label: 'Sleep Balance', value: `${dayData.readinessContributors.sleepBalance.value}%`, status: dayData.readinessContributors.sleepBalance.status, desc: dayData.readinessContributors.sleepBalance.text, icon: Clock, color: '#A2D3E8' },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'Optimal') return { bg: 'bg-score-green/15', text: 'text-score-green', border: 'border-score-green/30' };
    if (status === 'Good') return { bg: 'bg-enso-blue/15', text: 'text-enso-blue', border: 'border-enso-blue/30' };
    return { bg: 'bg-living-coral/15', text: 'text-living-coral', border: 'border-living-coral/30' };
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Title & Score Banner */}
      <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-score-green text-xs font-semibold uppercase tracking-wider">
            <HeartPulse className="w-4 h-4" />
            <span>Readiness Insight</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight">
            Readiness Score: <span className="text-score-green">{dayData.readinessScore}</span>
          </h2>
          <p className="text-sm text-white/45 leading-relaxed">
            Your Readiness Score indicates how well your body has recovered from yesterday&apos;s strain. Today, your nervous system is in an optimal state.
          </p>
        </div>

        <div className="relative w-32 h-32 flex items-center justify-center shrink-0 mx-auto md:mx-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="54" stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="transparent" />
            <circle cx="64" cy="64" r="54" stroke="#4ECDC4" strokeWidth="10" fill="transparent"
              strokeDasharray={339.3} strokeLinecap="round"
              strokeDashoffset={339.3 - (dayData.readinessScore / 100) * 339.3}
              className="score-ring" style={{ filter: 'drop-shadow(0 0 10px rgba(78,205,196,0.3))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-3xl font-bold text-white">{dayData.readinessScore}</span>
            <span className="text-[10px] text-score-green font-semibold uppercase tracking-wider">Optimal</span>
          </div>
        </div>
      </div>

      {/* Contributors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-3 lg:col-span-1">
          <h3 className="font-serif text-lg font-medium text-white flex items-center gap-2">
            Contributors <Info className="w-3.5 h-3.5 text-white/25" />
          </h3>
          {contributors.map((c) => {
            const Icon = c.icon;
            const statusStyle = getStatusColor(c.status);
            return (
              <div key={c.id} className="glass-card rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.06] transition-colors">
                <div className="flex items-center gap-3 truncate pr-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${c.color}18` }}>
                    <Icon className="w-4 h-4" style={{ color: c.color }} />
                  </div>
                  <div className="truncate">
                    <div className="text-xs text-white/35 font-medium">{c.label}</div>
                    <div className="text-sm font-semibold text-white truncate">{c.desc}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-serif font-bold text-white">{c.value}</span>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                    {c.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* HR & HRV Graph */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h3 className="font-serif text-lg text-white">Resting Heart Rate Curve</h3>
              <p className="text-xs text-white/30">Lowest: {dayData.readinessContributors.restingHeartRate.value} bpm · Average: {dayData.readinessContributors.restingHeartRate.value + 4} bpm</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-enso-blue"><span className="w-2.5 h-2.5 rounded-full bg-enso-blue" />Heart Rate</div>
              <div className="flex items-center gap-1.5 text-score-green"><span className="w-2.5 h-2.5 rounded-full bg-score-green" />HRV</div>
            </div>
          </div>

          <div className="relative h-56 w-full bg-white/[0.02] rounded-xl border border-white/[0.05] p-4">
            <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A2D3E8" />
                  <stop offset="100%" stopColor="#151619" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0,90 Q 50,110 100,140 T 200,160 T 300,150 T 400,120 T 500,100" fill="none" stroke="#A2D3E8" strokeWidth="3" />
              <path d="M 0,90 Q 50,110 100,140 T 200,160 T 300,150 T 400,120 T 500,100 L 500,200 L 0,200 Z" fill="url(#hrGradient)" opacity="0.15" />
              <path d="M 0,150 Q 70,130 150,90 T 250,50 T 350,60 T 450,80 T 500,90" fill="none" stroke="#4ECDC4" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
            <div className="absolute left-4 top-4 text-[10px] text-white/25 flex flex-col justify-between h-40">
              <span>80 bpm</span><span>65 bpm</span><span>50 bpm</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/25 border-t border-white/[0.06] pt-3">
            <span>10:00 PM</span><span>1:00 AM</span><span>4:00 AM</span><span>7:00 AM</span>
          </div>

          <div className="glass-tab rounded-xl p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-enso-blue shrink-0 mt-0.5" />
            <div className="text-xs text-white/45 space-y-1">
              <span className="font-semibold text-white/70 block">Recovery Timing Analysis</span>
              <p>Your heart rate reached its lowest point (51 bpm) at 3:15 AM, giving your body ample time to repair and replenish energy stores.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
