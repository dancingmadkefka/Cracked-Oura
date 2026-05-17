import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { TableIcon } from "lucide-react";

interface TableWidgetProps {
    data: any[];
    dataKeys: string[];
    selectedDate?: string;
}

export function TableWidget({ data, dataKeys, selectedDate }: TableWidgetProps) {
    // 1. Find the relevant row for the selected date
    const selectedRow = data.find(row => {
        if (!selectedDate) return true; // Fallback to first if no date

        // Check timestamp match
        if (row.timestamp) {
            const rowDate = row.timestamp.split('T')[0];
            return rowDate === selectedDate;
        }
        // Check date/day match
        if (row.date === selectedDate) return true;
        if (row.day === selectedDate) return true;

        return false;
    });

    if (!selectedRow) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 p-6">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center">
                    <TableIcon className="h-5 w-5 text-white/30" />
                </div>
                <div>
                    <p className="text-sm font-medium text-white/60">No data available</p>
                    <p className="text-xs text-white/30 mt-1">{selectedDate || "Select a date to view metrics"}</p>
                </div>
            </div>
        );
    }

    // 2. Determine keys to display
    // If keys provided, use them. Otherwise use all keys except meta.
    const displayKeys = dataKeys.length > 0
        ? dataKeys
        : Object.keys(selectedRow).filter(k => !['timestamp', 'date', 'day', 'id'].includes(k));

    // Helper to get nested value
    const getValue = (obj: any, path: string) => {
        if (obj[path] !== undefined) return obj[path];
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    // Helper to format key to Title Case
    const formatKey = (key: string) => {
        // Get last part if dot notation
        const str = key.split('.').pop() || key;
        // Replace underscores with spaces
        const withSpaces = str.replace(/_/g, ' ');
        // Capitalize words
        return withSpaces.replace(/\b\w/g, l => l.toUpperCase());
    };

    // Helper to format duration (seconds -> "7h 55m" or "45m")
    const formatDuration = (seconds: number) => {
        if (!seconds) return '-';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    // Helper to format time (ISO -> HH:mm)
    const formatTime = (isoString: string) => {
        if (!isoString) return '-';
        try {
            return format(parseISO(isoString), 'HH:mm');
        } catch {
            return isoString;
        }
    };

    // Helper to format value based on key context
    const formatValue = (val: any, key: string) => {
        const k = key.toLowerCase();

        if (val === null || val === undefined) return '-';

        // 1. Time / Dates
        if (typeof val === 'string' && (k.includes('start') || k.includes('end') || k.includes('timestamp') || k.includes('bedtime') || k.includes('wakeup'))) {
            // If it looks like a full ISO string, extract time
            if (val.includes('T')) return formatTime(val);
            return val;
        }

        // 2. Durations (Oura usually sends seconds)
        // Common keys: total_sleep_duration, deep_sleep_duration, latency, time_in_bed, awake_time, restless_periods
        if (typeof val === 'number' && (k.includes('duration') || k.includes('latency') || k.includes('time_in_bed') || k.includes('awake') || k.includes('restless') || k === 'total')) {
            return formatDuration(val);
        }

        // 3. Scores / Percentages (Round to int)
        if (typeof val === 'number' && (k.includes('score') || k.includes('efficiency') || k.includes('percent') || k.includes('activity_daily_target'))) {
            return Math.round(val).toString();
        }

        // 4. Specific Metrics
        if (typeof val === 'number') {
            if (k.includes('heart_rate') || k.includes('hrv') || k.includes('breath')) return Math.round(val).toString();
            if (k.includes('temperature')) return val.toFixed(2);

            // Generic decimals
            if (Number.isInteger(val)) return val.toLocaleString();
            return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
        }

        return val.toString();
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header with Date */}
            <div className="px-1 pb-3 pt-1 border-b border-white/10 mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {selectedDate ? format(parseISO(selectedDate), 'MMMM do, yyyy') : 'Latest'}
                </span>

            </div>

            <ScrollArea className="flex-1 -mr-3 pr-3">
                <div className="flex flex-col gap-0.5">
                    {displayKeys.map(key => {
                        const rawVal = getValue(selectedRow, key);
                        const displayVal = formatValue(rawVal, key);
                        const label = formatKey(key);

                        return (
                            <div
                                key={key}
                                className={cn(
                                    "flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors group",
                                    "hover:bg-white/[0.04]"
                                )}
                            >
                                <span className="text-xs font-medium text-white/45 group-hover:text-white/65 transition-colors">
                                    {label}
                                </span>
                                <span className={cn(
                                    "text-sm font-semibold text-white/90 font-['Space_Grotesk',sans-serif]",
                                    typeof rawVal === 'number' && "tabular-nums"
                                )}>
                                    {displayVal}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
