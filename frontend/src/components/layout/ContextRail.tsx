import { BatteryMedium, Bluetooth, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineItem } from '@/lib/day-summary';

interface ContextRailProps {
  summary: any;
  battery: number | null;
  timeline: TimelineItem[];
  onAiPrompt?: (prompt: string) => void;
  className?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

const AI_PROMPTS = [
  'Summarize this day',
  'Why was my sleep score low?',
  'Compare readiness to last 30 days',
  'What should I watch this week?',
];

const timelineColors: Record<string, string> = {
  sleep: '#FFD166',
  workout: '#4ECDC4',
  meditation: '#A2D3E8',
  battery: '#FC6558',
  tag: '#FFD166',
};

export function ContextRail({ battery, timeline, onAiPrompt, className }: ContextRailProps) {
  return (
    <aside className={cn(
      'w-[300px] flex-shrink-0 glass-panel p-4 space-y-4 overflow-y-auto hidden xl:block',
      className
    )}>
      {/* Ring Status */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-widest text-white/50 font-medium">Ring Status</h3>
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            battery != null ? 'bg-score-green pulse-dot' : 'bg-living-coral'
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
            <p className="text-white text-sm font-semibold">Oura Ring</p>
            <p className="text-white/40 text-xs">Gen3 · Connected</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <BatteryMedium className="w-3 h-3 text-score-green" />
              <span className="text-xs text-score-green font-medium">{battery != null ? Math.round(battery) : '--'}%</span>
              <span className="text-[10px] text-white/25 ml-1">~3 days left</span>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Firmware</span>
            <span className="text-white/60 font-mono">--</span>
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

      {/* Today's Timeline */}
      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-xs uppercase tracking-widest text-white/50 font-medium mb-3">Today&apos;s Timeline</h3>
        {timeline.length > 0 ? (
          <div className="space-y-3">
            {timeline.map((item, i) => {
              const color = timelineColors[item.type] ?? '#A2D3E8';
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: color }} />
                    {i < timeline.length - 1 && (
                      <div className="w-px flex-1 bg-white/[0.06] mt-1" style={{ minHeight: '16px' }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white/60 font-medium">{item.time}</p>
                    <p className="text-sm text-white/80">{item.label}</p>
                    {item.detail && (
                      <p className="text-xs text-white/35">{item.detail}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-white/30">No events for this day</p>
        )}
      </div>

      {/* Quick AI Prompts */}
      {onAiPrompt && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-white/50 font-medium mb-3 flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-enso-blue" />
            AI Shortcuts
          </h3>
          <div className="space-y-1">
            {AI_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => onAiPrompt(prompt)}
                className="w-full text-left px-2.5 py-1.5 text-[11px] text-white/50 rounded-lg hover:bg-white/[0.06] hover:text-white/80 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
