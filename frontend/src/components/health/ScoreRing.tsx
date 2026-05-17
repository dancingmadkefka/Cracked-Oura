interface ScoreRingProps {
  score: number | null;
  label: string;
  size?: number;
  strokeWidth?: number;
  color: string;
  onClick?: () => void;
}

const circumference = 2 * Math.PI * 54;

export function ScoreRing({ score, label, size = 120, strokeWidth = 8, color, onClick }: ScoreRingProps) {
  const radius = 54;
  const normalizedScore = score ?? 0;
  const offset = circumference - (normalizedScore / 100) * circumference;
  const hasData = score != null;

  return (
    <div
      className={`flex flex-col items-center gap-2 ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
      onClick={onClick}
    >
      <svg width={size} height={size} viewBox="0 0 120 120" className="drop-shadow-lg">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          className="transition-all duration-700 ease-out"
        />
        <text
          x="60"
          y="56"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-['Space_Grotesk',sans-serif]"
          fontSize="28"
          fontWeight="600"
          fill="white"
        >
          {hasData ? normalizedScore : '--'}
        </text>
        <text
          x="60"
          y="76"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="9"
          fill="rgba(255,255,255,0.4)"
          letterSpacing="0.1em"
        >
          /100
        </text>
      </svg>
      <span className="text-xs font-medium text-white/60 tracking-wide">{label}</span>
    </div>
  );
}
