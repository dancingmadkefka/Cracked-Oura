import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Parse backend datetime string "YYYY-MM-DD HH:MM:SS" as local time.
 * Using new Date("2026-05-20T09:41:12") is ambiguous — some JS runtimes
 * treat ISO strings without timezone as UTC, producing wrong relative times.
 */
export function parseLocalDate(str: string): Date {
    const [datePart, timePart] = str.split(' ');
    const [y, m, d] = datePart.split('-').map(Number);
    const [h, min, s] = (timePart || '00:00:00').split(':').map(Number);
    return new Date(y, m - 1, d, h, min, s || 0);
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function isIntradayKey(key: string): boolean {
    if (!key) return false;
    const lowerKey = key.toLowerCase();

    // Specific intraday fields
    return (
        lowerKey.includes('hr_data') ||
        lowerKey.includes('hrv_data') ||
        lowerKey.includes('movement') ||
        lowerKey.includes('sleep_phase') ||
        lowerKey.includes('hypnogram') ||
        lowerKey.includes('class_5_min') ||
        lowerKey.includes('met') ||
        (lowerKey.includes('stress') && !lowerKey.startsWith('resilience'))
    );
}
