import { Lightbulb } from 'lucide-react';

interface DailyInsightCardProps {
  insight: string;
  className?: string;
}

export function DailyInsightCard({ insight, className }: DailyInsightCardProps) {
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 ${className ?? ''}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-amber-500/10 p-1.5">
          <Lightbulb className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Daily Insight</p>
          <p className="text-sm text-white/80 leading-relaxed">{insight}</p>
        </div>
      </div>
    </div>
  );
}
