import React from 'react';
import { Flame, Footprints, Zap, Clock, Info, Activity } from 'lucide-react';
import { DayData } from '../data/mockOuraData';

interface ActivityViewProps {
  dayData: DayData;
}

export const ActivityView: React.FC<ActivityViewProps> = ({ dayData }) => {
  const { activityDetails } = dayData;

  const metrics = [
    { label: 'Active Calorie Burn', value: `${activityDetails.activeCalories} kcal`, icon: Zap, target: '500 kcal goal', color: '#FFD166' },
    { label: 'Total Calorie Burn', value: `${activityDetails.totalBurn} kcal`, icon: Flame, target: 'BMR + Active', color: '#FC6558' },
    { label: 'Daily Step Count', value: activityDetails.stepCount.toLocaleString(), icon: Footprints, target: '10,000 steps', color: '#4ECDC4' },
    { label: 'Daily Movement', value: activityDetails.dailyMovement, icon: Activity, target: '5.0 mi equivalent', color: '#A2D3E8' },
    { label: 'Inactive Time', value: activityDetails.inactiveTime, icon: Clock, target: 'Under 6h optimal', color: '#2F4A73' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Score Banner */}
      <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-score-yellow text-xs font-semibold uppercase tracking-wider">
            <Flame className="w-4 h-4" />
            <span>Activity & Strain</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight">
            Activity Score: <span className="text-score-yellow">{dayData.activityScore}</span>
          </h2>
          <p className="text-sm text-white/45 leading-relaxed">
            You achieved {activityDetails.goalProgress}% of your daily activity goal. Your training frequency is perfectly balanced with recovery time.
          </p>
        </div>

        <div className="relative w-32 h-32 flex items-center justify-center shrink-0 mx-auto md:mx-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="54" stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="transparent" />
            <circle cx="64" cy="64" r="54" stroke="#FFD166" strokeWidth="10" fill="transparent"
              strokeDasharray={339.3} strokeLinecap="round"
              strokeDashoffset={339.3 - (dayData.activityScore / 100) * 339.3}
              className="score-ring" style={{ filter: 'drop-shadow(0 0 10px rgba(255,209,102,0.3))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-3xl font-bold text-white">{dayData.activityScore}</span>
            <span className="text-[10px] text-score-yellow font-semibold uppercase tracking-wider">Optimal</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-3 lg:col-span-1">
          <h3 className="font-serif text-lg font-medium text-white">Movement Breakdown</h3>
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 truncate pr-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${m.color}18` }}>
                    <Icon className="w-4 h-4" style={{ color: m.color }} />
                  </div>
                  <div className="truncate">
                    <div className="text-xs text-white/35 font-medium">{m.label}</div>
                    <div className="text-[11px] text-white/25">{m.target}</div>
                  </div>
                </div>
                <div className="text-base font-serif font-bold text-white shrink-0">{m.value}</div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-2 glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h3 className="font-serif text-lg text-white">Hourly Movement & Intensity</h3>
              <p className="text-xs text-white/30">Tracked via 3D accelerometer & temperature sensors</p>
            </div>
            <Info className="w-4 h-4 text-white/25" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-tab rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-white/45">Activity Goal Progress</span>
                <span className="text-score-yellow font-bold">{activityDetails.goalProgress}%</span>
              </div>
              <div className="w-full bg-white/[0.06] h-3 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-score-yellow to-living-coral"
                  style={{ width: `${Math.min(activityDetails.goalProgress, 100)}%` }} />
              </div>
              <p className="text-[11px] text-white/30">Excellent job hitting your baseline calorie burn early.</p>
            </div>
            <div className="glass-tab rounded-xl p-4 space-y-3 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/35">Training Frequency</span>
                <span className="text-score-green font-semibold bg-score-green/10 px-2 py-0.5 rounded border border-score-green/20">{activityDetails.trainingFrequencyStatus}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-white/[0.06] pt-3">
                <span className="text-white/35">Recovery Time</span>
                <span className="text-score-green font-semibold bg-score-green/10 px-2 py-0.5 rounded border border-score-green/20">{activityDetails.recoveryTimeStatus}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-white/60">Activity Intensity Distribution</div>
            <div className="h-24 w-full bg-white/[0.02] rounded-xl border border-white/[0.05] p-3 flex items-end justify-between gap-1">
              {[20, 10, 5, 5, 10, 30, 85, 95, 40, 20, 15, 60, 70, 45, 30, 80, 90, 40, 20, 15, 25, 10, 5, 5].map((val, idx) => (
                <div key={idx} className="flex-1 rounded-t-sm transition-all hover:opacity-80 cursor-pointer"
                  style={{ height: `${val}%`, backgroundColor: val > 70 ? '#FFD166' : val > 40 ? '#FFD16680' : 'rgba(255,255,255,0.08)' }}
                  title={`Hour ${idx}: ${val}% intensity`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/25 px-1">
              <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
            </div>
          </div>

          <div className="glass-tab rounded-xl p-4 flex items-start gap-3">
            <Flame className="w-4 h-4 text-score-yellow shrink-0 mt-0.5" />
            <div className="text-xs text-white/45 space-y-1">
              <span className="font-semibold text-white/70 block">Pacing & Restorative Balance</span>
              <p>Your activity was nicely distributed throughout the day rather than condensed into a single exhausting session, preventing excessive cortisol spikes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
