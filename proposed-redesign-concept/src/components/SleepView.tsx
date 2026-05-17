import React from 'react';
import { Moon, Clock, Activity, Info } from 'lucide-react';
import { DayData } from '../data/mockOuraData';

interface SleepViewProps {
  dayData: DayData;
}

export const SleepView: React.FC<SleepViewProps> = ({ dayData }) => {
  const { sleepDetails } = dayData;

  const metrics = [
    { label: 'Total Sleep', value: sleepDetails.totalSleep, optimal: '7h - 9h' },
    { label: 'Time in Bed', value: sleepDetails.timeInBed, optimal: '8h - 9.5h' },
    { label: 'Sleep Efficiency', value: `${sleepDetails.efficiency}%`, optimal: '85%+' },
    { label: 'Resting Heart Rate', value: `${sleepDetails.restingHeartRate} bpm`, optimal: '50 - 60 bpm' },
    { label: 'Sleep Latency', value: sleepDetails.latency, optimal: '15 - 20 min' },
  ];

  const stages = [
    { id: 'deep', label: 'Deep Sleep', duration: sleepDetails.stages.deep, percent: sleepDetails.stages.deepPercent, color: '#4ECDC4' },
    { id: 'rem', label: 'REM Sleep', duration: sleepDetails.stages.rem, percent: sleepDetails.stages.remPercent, color: '#A2D3E8' },
    { id: 'light', label: 'Light Sleep', duration: sleepDetails.stages.light, percent: sleepDetails.stages.lightPercent, color: '#2F4A73' },
    { id: 'awake', label: 'Awake', duration: sleepDetails.stages.awake, percent: sleepDetails.stages.awakePercent, color: '#FC6558' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Score Banner */}
      <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-enso-blue text-xs font-semibold uppercase tracking-wider">
            <Moon className="w-4 h-4" />
            <span>Sleep Analysis</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight">
            Sleep Score: <span className="text-enso-blue">{dayData.sleepScore}</span>
          </h2>
          <p className="text-sm text-white/45 leading-relaxed">
            Your sleep efficiency was excellent at {sleepDetails.efficiency}%. You spent an optimal amount of time in restorative Deep and REM sleep stages.
          </p>
        </div>

        <div className="relative w-32 h-32 flex items-center justify-center shrink-0 mx-auto md:mx-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="54" stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="transparent" />
            <circle cx="64" cy="64" r="54" stroke="#A2D3E8" strokeWidth="10" fill="transparent"
              strokeDasharray={339.3} strokeLinecap="round"
              strokeDashoffset={339.3 - (dayData.sleepScore / 100) * 339.3}
              className="score-ring" style={{ filter: 'drop-shadow(0 0 10px rgba(162,211,232,0.3))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-3xl font-bold text-white">{dayData.sleepScore}</span>
            <span className="text-[10px] text-enso-blue font-semibold uppercase tracking-wider">Optimal</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sleep Metrics */}
        <div className="space-y-3 lg:col-span-1">
          <h3 className="font-serif text-lg font-medium text-white">Sleep Metrics</h3>
          {metrics.map((m) => (
            <div key={m.label} className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-white/35 font-medium">{m.label}</div>
                <div className="text-[11px] text-white/25">Target: {m.optimal}</div>
              </div>
              <div className="text-base font-serif font-bold text-white">{m.value}</div>
            </div>
          ))}
          <div className="glass-tab rounded-xl p-3 text-xs text-white/40 space-y-1">
            <div className="flex items-center gap-2 text-white/60 font-semibold">
              <Activity className="w-4 h-4 text-enso-blue" /> Restfulness Indicator
            </div>
            <p>Few wake-ups detected. Your sleep was highly continuous.</p>
          </div>
        </div>

        {/* Hypnogram */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h3 className="font-serif text-lg text-white">Sleep Staging (Hypnogram)</h3>
              <p className="text-xs text-white/30">Visual breakdown of your sleep architecture</p>
            </div>
            <Info className="w-4 h-4 text-white/25" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stages.map((stage) => (
              <div key={stage.id} className="glass-tab rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-white/45">{stage.label}</span>
                  <span className="font-bold" style={{ color: stage.color }}>{stage.percent}%</span>
                </div>
                <div className="text-lg font-serif font-semibold text-white">{stage.duration}</div>
                <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${stage.percent}%`, backgroundColor: stage.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Hypnogram Timeline */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-white/60">Sleep Cycle Progression</div>
            <div className="h-16 w-full bg-white/[0.02] rounded-xl border border-white/[0.05] p-3 flex items-end gap-0.5">
              {sleepDetails.stageTimeline.map((block, idx) => {
                const colorMap: Record<string, string> = { deep: '#4ECDC4', rem: '#A2D3E8', light: '#2F4A73', awake: '#FC6558' };
                return (
                  <div key={idx} className="flex-1 rounded-t-sm transition-all hover:opacity-80 cursor-pointer"
                    style={{ height: block.stage === 'deep' ? '100%' : block.stage === 'rem' ? '70%' : block.stage === 'light' ? '45%' : '20%', backgroundColor: colorMap[block.stage] }}
                    title={`${block.stage.toUpperCase()}: ${block.durationMinutes} mins`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/25 px-1">
              <span>10:15 PM</span><span>Deep sleep dominant</span><span>REM dominant</span><span>6:39 AM</span>
            </div>
          </div>

          <div className="glass-tab rounded-xl p-4 flex items-start gap-3">
            <Clock className="w-4 h-4 text-enso-blue shrink-0 mt-0.5" />
            <div className="text-xs text-white/45 space-y-1">
              <span className="font-semibold text-white/70 block">Optimal REM & Deep Balance</span>
              <p>Your Deep sleep (1h 52m) helped restore physical muscles and clear metabolic waste, while REM sleep (2h 05m) supported memory consolidation and emotional processing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
