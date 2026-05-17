import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    type ChartOptions
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ScoreGaugeCanvasProps {
    score: number;
    title?: string;
    color?: string;
    className?: string;
}

export function ScoreGaugeCanvas({ score, title, color, className }: ScoreGaugeCanvasProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const getScoreColor = (s: number) => {
        if (s >= 85) return "#4ade80";
        if (s >= 70) return "#facc15";
        return "#f87171";
    };

    const finalColor = color || getScoreColor(score);
    const trackColor = isDark ? '#374151' : '#e5e7eb';

    const chartData = {
        labels: ['Score', 'Remaining'],
        datasets: [{
            data: [score, 100 - score],
            backgroundColor: [finalColor, trackColor],
            borderWidth: 0,
            borderRadius: 20,
            cutout: '85%',
        }],
    };

    const options: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
        rotation: -90,
        circumference: 360,
    };

    return (
        <div className={cn("h-full w-full flex flex-col items-center justify-center relative", className)}>
            <div className="w-full h-full p-4">
                <Doughnut data={chartData} options={options} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {/* Subtle glow */}
                <div
                    className="absolute w-24 h-24 rounded-full opacity-[0.12] blur-xl"
                    style={{ backgroundColor: finalColor }}
                />
                <span
                    className="text-4xl font-bold font-['Space_Grotesk',sans-serif] tabular-nums relative z-10"
                    style={{ color: finalColor }}
                >
                    {score}
                </span>
                {title && (
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 mt-1 relative z-10">
                        {title.split('.').pop()?.replace(/_/g, ' ')}
                    </span>
                )}
            </div>
        </div>
    );
}

