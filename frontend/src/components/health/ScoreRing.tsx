import { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number | null;
  label: string;
  size?: number;
  strokeWidth?: number;
  color: string;
  onClick?: () => void;
}

function getScoreLabel(score: number): string {
  if (score >= 85) return 'Optimal';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Fair';
  return 'Attention';
}

export function ScoreRing({ score, label, size = 104, strokeWidth = 7, color, onClick }: ScoreRingProps) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);
  const hasData = score != null;
  const normalizedScore = score ?? 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (normalizedScore / 100) * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [normalizedScore, circumference]);

  return (
    <div
      className={`flex flex-col items-center gap-2 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-ring"
            style={{ filter: `drop-shadow(0 0 10px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
          <span className="font-serif text-2xl font-bold text-white">{hasData ? normalizedScore : '--'}</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold mt-0.5 max-w-full truncate" style={{ color: hasData ? color : 'rgba(255,255,255,0.3)' }}>
            {hasData ? getScoreLabel(normalizedScore) : '/100'}
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-white/60 tracking-wide">{label}</span>
    </div>
  );
}
