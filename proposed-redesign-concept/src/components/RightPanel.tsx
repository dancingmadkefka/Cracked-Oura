import React from 'react';
import { BatteryMedium, Bluetooth, Sun, Activity, Moon, Brain, Droplets } from 'lucide-react';
import { userProfile } from '../data/mockOuraData';
import { cn } from '../utils/cn';

interface RightPanelProps {
  ringConnected: boolean;
  batteryLevel: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}

export const RightPanel: React.FC<RightPanelProps> = ({ ringConnected, batteryLevel, timeOfDay }) => {
  const timeline = [
    { time: '7:14 AM', event: 'Woke up', detail: 'Sleep score: 85', icon: Sun, color: '#FFD166' },
    { time: '8:30 AM', event: 'Morning walk', detail: '2,340 steps · 18 min', icon: Activity, color: '#4ECDC4' },
    { time: '12:00 PM', event: 'Lunch detected', detail: 'Medium meal · 650 cal', icon: Droplets, color: '#A2D3E8' },
    { time: '4:15 PM', event: 'Stress spike', detail: '45 min elevated stress', icon: Brain, color: '#FC6558' },
    { time: '6:00 PM', event: 'Gym workout', detail: 'Strength · 385 cal', icon: Activity, color: '#FFD166' },
  ];

  return (
    <aside className="w-[300px] flex-shrink-0 glass-panel p-4 space-y-4 overflow-y-auto hidden xl:block">
      {/* Ring Status (Design A) */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-widest text-white/50 font-medium">Ring Status</h3>
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            ringConnected ? 'bg-score-green pulse-dot' : 'bg-living-coral'
          )} />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-oura-black to-neutral-800 border-2 border-white/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-8 h-8 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{userProfile.ringModel}</p>
            <p className="text-white/40 text-xs">{userProfile.ringFinish} · Size 10</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <BatteryMedium className="w-3 h-3 text-score-green" />
              <span className="text-xs text-score-green font-medium">{batteryLevel}%</span>
              <span className="text-[10px] text-white/25 ml-1">~3 days left</span>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Firmware</span>
            <span className="text-white/60 font-mono">{userProfile.firmwareVersion.split(' ')[0]}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-white/40">Last sync</span>
            <span className="text-white/60 flex items-center gap-1">
              <Bluetooth className="w-3 h-3 text-score-green" />
              Just now
            </span>
          </div>
        </div>
      </div>

      {/* Today's Timeline (Design A) */}
      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-xs uppercase tracking-widest text-white/50 font-medium mb-3">Today&apos;s Timeline</h3>
        <div className="space-y-3">
          {timeline.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: item.color }} />
                {i < timeline.length - 1 && (
                  <div className="w-px flex-1 bg-white/[0.06] mt-1" style={{ minHeight: '16px' }} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white/60 font-medium">{item.time}</p>
                <p className="text-sm text-white/80">{item.event}</p>
                <p className="text-xs text-white/35">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Glance — Connection */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
        <Bluetooth className="w-4 h-4 text-score-green" />
        <div>
          <p className="text-white/70 text-sm font-medium">
            {ringConnected ? 'Ring Connected' : 'Searching...'}
          </p>
          <p className="text-white/35 text-xs">Oura Ring 4 · Stealth</p>
        </div>
      </div>
    </aside>
  );
};
