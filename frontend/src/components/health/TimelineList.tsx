import type { TimelineItem } from '@/lib/day-summary';
import { Moon, Dumbbell, Brain, Battery, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineListProps {
  items: TimelineItem[];
  className?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  sleep: Moon,
  workout: Dumbbell,
  meditation: Brain,
  battery: Battery,
  tag: Tag,
};

const typeColors: Record<string, string> = {
  sleep: 'text-blue-400 bg-blue-400/10',
  workout: 'text-amber-400 bg-amber-400/10',
  meditation: 'text-violet-400 bg-violet-400/10',
  battery: 'text-emerald-400 bg-emerald-400/10',
  tag: 'text-pink-400 bg-pink-400/10',
};

export function TimelineList({ items, className }: TimelineListProps) {
  if (items.length === 0) {
    return (
      <div className={cn('text-sm text-white/30 text-center py-4', className)}>
        No events for this day
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item, i) => {
        const Icon = typeIcons[item.type] ?? Tag;
        const colorClass = typeColors[item.type] ?? 'text-white/40 bg-white/5';

        return (
          <div key={i} className="flex items-center gap-3">
            <div className={cn('rounded-lg p-1.5', colorClass)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] text-white/30 w-10 shrink-0">{item.time}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70">{item.label}</p>
              {item.detail && (
                <p className="text-[10px] text-white/35">{item.detail}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
