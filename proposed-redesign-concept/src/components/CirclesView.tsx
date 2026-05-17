import React, { useState } from 'react';
import { Users, HeartPulse, Moon, Plus, ShieldCheck } from 'lucide-react';
import { mockCirclesData } from '../data/mockOuraData';

export const CirclesView: React.FC = () => {
  const [reactionSent, setReactionSent] = useState<string | null>(null);

  const handleSendReaction = (name: string, emoji: string) => {
    setReactionSent(`Sent ${emoji} to ${name}!`);
    setTimeout(() => setReactionSent(null), 3000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-enso-blue text-xs font-semibold uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Oura Circles Sharing</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight">Connect & Support Your Circle</h2>
          <p className="text-sm text-white/45 leading-relaxed">
            Share high-level readiness and sleep scores with family, close friends, or your coach. Celebrate peak days and offer support during recovery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="glass-tab px-4 py-2.5 rounded-xl text-xs font-semibold text-white hover:bg-white/[0.1] transition-colors cursor-pointer flex items-center gap-2">
            <Plus className="w-4 h-4 text-enso-blue" /> Invite Member
          </button>
          <button className="glass-tab px-4 py-2.5 rounded-xl text-xs font-semibold text-white/50 hover:text-white/80 transition-colors cursor-pointer flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-score-green" /> Privacy
          </button>
        </div>
      </div>

      {reactionSent && (
        <div className="glass-card rounded-xl p-4 flex items-center justify-between border-enso-blue/20">
          <span className="font-medium text-sm text-white/80">{reactionSent}</span>
          <span className="text-xs text-white/30">Delivered via Oura Cloud</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {mockCirclesData.map((member) => (
          <div key={member.id} className="glass-card rounded-2xl p-5 hover:bg-white/[0.06] transition-all space-y-4">
            <div className="flex items-start justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-3">
                <img src={member.avatar} alt={member.name} className="w-11 h-11 rounded-full object-cover border-2 border-white/[0.1]" />
                <div>
                  <h3 className="font-serif text-base text-white">{member.name}</h3>
                  <span className="text-xs text-white/30 uppercase tracking-wider">{member.relation}</span>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full mt-1.5" style={{ backgroundColor: member.ringColor }} />
            </div>

            <div className="glass-tab rounded-xl p-3 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-white/35">
                  <HeartPulse className="w-3.5 h-3.5 text-score-green" /> Readiness
                </div>
                <div className="text-xl font-serif font-semibold text-white">{member.readiness}</div>
              </div>
              <div className="space-y-1 border-l border-white/[0.06] pl-3">
                <div className="flex items-center gap-1.5 text-xs text-white/35">
                  <Moon className="w-3.5 h-3.5 text-enso-blue" /> Sleep
                </div>
                <div className="text-xl font-serif font-semibold text-white">{member.sleep}</div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="text-xs text-white/25 font-medium">Quick Reaction</div>
              <div className="flex items-center gap-2">
                {[{ emoji: '👑', label: 'Crown' }, { emoji: '💤', label: 'Sleep' }, { emoji: '⚡', label: 'Energy' }, { emoji: '🔥', label: 'Fire' }].map((r) => (
                  <button key={r.label} onClick={() => handleSendReaction(member.name, r.emoji)}
                    className="flex-1 py-2 glass-tab hover:bg-white/[0.08] rounded-xl text-lg transition-all hover:scale-105 cursor-pointer flex items-center justify-center">
                    {r.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1 max-w-xl">
          <h4 className="font-serif text-base text-white">Custom Privacy Controls</h4>
          <p className="text-xs text-white/35">You control what you share. Toggle full scores, status only, or pause sharing during private rest periods.</p>
        </div>
        <button className="glass-tab px-4 py-2 rounded-xl text-xs font-semibold text-enso-blue hover:text-white transition-colors cursor-pointer">Manage Settings</button>
      </div>
    </div>
  );
};
