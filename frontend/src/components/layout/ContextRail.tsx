import { ScrollArea } from '@/components/ui/scroll-area';
import { BatteryMedium, BatteryFull, BatteryLow, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineItem } from '@/lib/day-summary';

interface ContextRailProps {
  summary: any;
  battery: number | null;
  timeline: TimelineItem[];
  onAiPrompt?: (prompt: string) => void;
  className?: string;
}

const AI_PROMPTS = [
  'Summarize this day',
  'Why was my sleep score low?',
  'Compare readiness to last 30 days',
  'What should I watch this week?',
];

function BatteryIcon({ level }: { level: number }) {
  if (level >= 80) return <BatteryFull className="h-4 w-4 text-emerald-400" />;
  if (level >= 40) return <BatteryMedium className="h-4 w-4 text-amber-400" />;
  return <BatteryLow className="h-4 w-4 text-rose-400" />;
}

export function ContextRail({ battery, timeline, onAiPrompt, className }: ContextRailProps) {
  return (
    <div className={cn(
      'w-[260px] border-l border-white/[0.04] bg-[#060608]/60 backdrop-blur-xl flex flex-col',
      className
    )}>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Ring / Battery Card */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Ring Status</p>
            {battery != null ? (
              <div className="flex items-center gap-2">
                <BatteryIcon level={battery} />
                <span className="text-sm font-medium text-white/80">{Math.round(battery)}%</span>
              </div>
            ) : (
              <p className="text-xs text-white/30">No battery data</p>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Timeline</p>
            {timeline.length > 0 ? (
              <div className="space-y-2">
                {timeline.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[10px] text-white/30 w-10 pt-0.5">{item.time}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70">{item.label}</p>
                      {item.detail && (
                        <p className="text-[10px] text-white/35">{item.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/30">No events</p>
            )}
          </div>

          {/* Quick AI Prompts */}
          {onAiPrompt && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2 flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                AI Shortcuts
              </p>
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
        </div>
      </ScrollArea>
    </div>
  );
}
