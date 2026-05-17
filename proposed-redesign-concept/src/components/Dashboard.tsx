import React, { useEffect, useState } from 'react';
import { HeartPulse, Moon, Flame, Sparkles, Clock, ArrowUpRight, ChevronRight, Activity } from 'lucide-react';
import { DayData } from '../data/mockOuraData';

interface DashboardProps {
  dayData: DayData;
  onSelectTab: (tab: string) => void;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}

export const Dashboard: React.FC<DashboardProps> = ({ dayData, onSelectTab, timeOfDay }) => {
  const greeting = timeOfDay === 'morning' ? 'Good morning' : timeOfDay === 'afternoon' ? 'Good afternoon' : 'Good evening';

  const getScoreColor = (score: number, type: 'readiness' | 'sleep' | 'activity') => {
    if (score >= 85) return type === 'readiness' ? '#4ECDC4' : type === 'sleep' ? '#A2D3E8' : '#FFD166';
    if (score >= 70) return '#FFD166';
    return '#FC6558';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Optimal';
    if (score >= 70) return 'Good';
    return 'Pay Attention';
  };

  const scores = [
    { id: 'readiness', title: 'Readiness', score: dayData.readinessScore, icon: HeartPulse, desc: 'Resting HR & HRV balance are optimal', metric: `${dayData.readinessContributors.restingHeartRate.value} bpm lowest` },
    { id: 'sleep', title: 'Sleep', score: dayData.sleepScore, icon: Moon, desc: '7h 42m total sleep time', metric: `${dayData.sleepDetails.efficiency}% efficiency` },
    { id: 'activity', title: 'Activity', score: dayData.activityScore, icon: Flame, desc: 'Goal completed with optimal recovery', metric: `${dayData.activityDetails.activeCalories} kcal burn` },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* ─── Atmospheric Greeting Banner ─── */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-8 shadow-2xl">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] px-3 py-1 rounded-full text-xs text-enso-blue font-medium backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Daily Health Summary</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white leading-tight tracking-wide">
            {greeting}, <span className="text-enso-blue">Alexander</span>
          </h2>
          <p className="text-sm text-white/50 leading-relaxed max-w-2xl">
            {timeOfDay === 'morning'
              ? 'Your readiness is optimal today. A great day to be active.'
              : timeOfDay === 'afternoon'
              ? 'Your body is in a restored state. Steady energy levels throughout the day.'
              : 'Time to wind down. Your body is preparing for rest.'}
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-white/40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-score-green" />
              <span>Resilience: <strong className="text-white/70">{dayData.resilienceLevel}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-enso-blue" />
              <span>Stress: <strong className="text-white/70">{dayData.stressSummary.split(' ')[0]}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-score-yellow" />
              <span>Goal: <strong className="text-white/70">{dayData.activityDetails.goalProgress}%</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Three Core Score Cards (Animated Rings from Design A) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {scores.map((s) => {
          const Icon = s.icon;
          const strokeColor = getScoreColor(s.score, s.id as any);
          const radius = 44;
          const circumference = 2 * Math.PI * radius;

          return (
            <ScoreRingCard
              key={s.id}
              icon={Icon}
              title={s.title}
              score={s.score}
              strokeColor={strokeColor}
              label={getScoreLabel(s.score)}
              desc={s.desc}
              metric={s.metric}
              onClick={() => onSelectTab(s.id)}
              circumference={circumference}
              radius={radius}
            />
          );
        })}
      </div>

      {/* ─── AI Insight + Body Clock Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Oura Advisor AI Insight */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 flex flex-col justify-between space-y-4"
          style={{ borderColor: 'rgba(162, 211, 232, 0.2)' }}>
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(162, 211, 232, 0.15)' }}>
                <Sparkles className="w-4 h-4 text-enso-blue" />
              </div>
              <div>
                <h3 className="text-sm uppercase tracking-widest text-enso-blue font-medium">Oura Advisor</h3>
                <p className="text-xs text-white/35">Personalized AI synthesis</p>
              </div>
            </div>
            <button onClick={() => onSelectTab('labs')} className="text-xs text-enso-blue hover:text-white transition-colors flex items-center gap-1">
              Open Chat <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
            <p className="text-sm text-white/75 leading-relaxed">
              Your nervous system is exhibiting excellent adaptability today. Notice how your HRV climbed to an average of <strong className="text-score-green">82 ms</strong> following your magnesium supplementation and sauna session. You have accumulated enough restorative time to support an intense training load today.
            </p>
            <div className="flex flex-wrap gap-2 pt-3">
              {dayData.tags.map((tag) => (
                <span key={tag} className="text-xs bg-white/[0.06] text-white/60 px-2.5 py-1 rounded-md border border-white/[0.08]">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>Generated from Gen3 Horizon sensors</span>
            <span className="flex items-center gap-1 text-score-green">
              <span className="w-1.5 h-1.5 rounded-full bg-score-green pulse-dot" />
              High Confidence
            </span>
          </div>
        </div>

        {/* Body Clock & Chronotype */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(162, 211, 232, 0.15)' }}>
              <Clock className="w-4 h-4 text-enso-blue" />
            </div>
            <div>
              <h3 className="text-sm text-white font-medium">Body Clock</h3>
              <p className="text-xs text-white/35">Chronotype: Morning Lark</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-2 space-y-3">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-white/[0.08]" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-enso-blue border-r-enso-blue transform -rotate-45" />
              <div className="absolute inset-3 rounded-full bg-oura-black/80 flex flex-col items-center justify-center text-center p-2 border border-white/[0.08]">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Optimal Sleep</span>
                <span className="text-sm font-serif font-medium text-white">10:15 PM</span>
                <span className="text-[10px] text-white/35">to 6:30 AM</span>
              </div>
            </div>
            <p className="text-xs text-white/35 text-center">Your sleep rhythm is perfectly aligned with natural sunlight exposure.</p>
          </div>
          <div className="glass-tab rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-white/40">Sleep Regularity</span>
            <span className="text-score-green font-medium">94% (Optimal)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Score Ring Card (Design A's signature component) ───
function ScoreRingCard({
  icon: Icon, title, score, strokeColor, label, desc, metric, onClick,
  circumference, radius,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  score: number;
  strokeColor: string;
  label: string;
  desc: string;
  metric: string;
  onClick: () => void;
  circumference: number;
  radius: number;
}) {
  const [offset, setOffset] = useState(circumference);
  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  const size = 104;

  return (
    <div onClick={onClick} className="glass-card rounded-2xl p-5 hover:bg-white/[0.07] transition-all cursor-pointer group flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/50 group-hover:text-white/80 transition-colors">
          <Icon className="w-4.5 h-4.5" />
          <span className="font-serif text-base tracking-wide">{title}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" />
      </div>

      <div className="flex items-center gap-5">
        {/* Animated Score Ring */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
            <circle
              cx={size / 2} cy={size / 2} r={radius} fill="none"
              stroke={strokeColor} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              className="score-ring"
              style={{ filter: `drop-shadow(0 0 10px ${strokeColor}40)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-2xl font-bold text-white">{score}</span>
            <span className="text-[10px] uppercase tracking-widest font-medium mt-0.5" style={{ color: strokeColor }}>
              {label}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-white/35 leading-relaxed">{desc}</p>
          <p className="text-[11px] text-white/50 font-medium">{metric}</p>
        </div>
      </div>

      <div className="flex items-center text-xs text-enso-blue font-medium group-hover:underline">
        View Details <ArrowUpRight className="w-3 h-3 ml-1" />
      </div>
    </div>
  );
};
