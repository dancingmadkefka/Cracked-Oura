import { cn } from '@/lib/utils';

interface MetricPillProps {
  label: string;
  value: string | number | null;
  unit?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricPill({ label, value, unit, icon, className }: MetricPillProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.06] px-3 py-1.5',
      className
    )}>
      {icon && <span className="text-white/40">{icon}</span>}
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-wider text-white/40">{label}</span>
        <span className="text-sm font-medium text-white/90">
          {value ?? '--'}
          {unit && <span className="ml-0.5 text-xs text-white/50">{unit}</span>}
        </span>
      </div>
    </div>
  );
}
