import { cn } from "@/lib/utils";

interface MetricWidgetProps {
    value: string | number;
    label?: string;
    unit?: string;
    color?: string;
    className?: string;
}

export function MetricWidget({ value, label, unit, color = "#8AB4F8", className }: MetricWidgetProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center h-full relative overflow-hidden group",
            className
        )}>
            {/* Subtle radial glow behind the value */}
            <div
                className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.14] transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at 50% 50%, ${color}, transparent 70%)`,
                }}
            />

            {/* Value */}
            <div className="relative z-10 flex items-baseline gap-1.5">
                <span
                    className="text-5xl font-bold tracking-tight font-['Space_Grotesk',sans-serif] tabular-nums"
                    style={{ color }}
                >
                    {value}
                </span>
                {unit && (
                    <span className="text-lg font-medium text-white/40 ml-0.5">
                        {unit}
                    </span>
                )}
            </div>

            {/* Label */}
            {label && (
                <div className="relative z-10 mt-2 text-xs font-medium text-white/50 uppercase tracking-[0.2em]">
                    {label.split('.').pop()?.replace(/_/g, ' ')}
                </div>
            )}

            {/* Bottom accent line */}
            <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-12 rounded-full opacity-40"
                style={{ backgroundColor: color }}
            />
        </div>
    );
}

