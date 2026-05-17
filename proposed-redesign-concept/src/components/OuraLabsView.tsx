import React, { useState } from 'react';
import { Sparkles, Send, Bot, FlaskConical, Activity, HeartPulse, Clock } from 'lucide-react';
import { mockAdvisorMessages } from '../data/mockOuraData';

export const OuraLabsView: React.FC = () => {
  const [messages, setMessages] = useState(mockAdvisorMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: messages.length + 1, sender: 'user', text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let text = "Based on your latest bio-signals, your readiness is well-supported today. I recommend maintaining your current hydration and keeping your evening wind-down routine consistent.";
      if (userMsg.text.toLowerCase().includes('workout') || userMsg.text.toLowerCase().includes('train')) {
        text = "Your resting heart rate reached its lowest point early last night (51 bpm), indicating optimal recovery. You are primed for a high strain workout today. Aim for 500-650 kcal active burn.";
      } else if (userMsg.text.toLowerCase().includes('sleep') || userMsg.text.toLowerCase().includes('tired')) {
        text = "Your sleep efficiency was excellent at 92%. A 20-minute power nap around 2:00 PM would align perfectly with your circadian dip without disrupting tonight's sleep latency.";
      } else if (userMsg.text.toLowerCase().includes('stress') || userMsg.text.toLowerCase().includes('hrv')) {
        text = "Your HRV balance is optimal (82 ms average). Taking brief 5-minute breathing breaks during work hours can help sustain this excellent balance.";
      }
      setMessages(prev => [...prev, { id: messages.length + 2, sender: 'oura', text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setIsTyping(false);
    }, 1500);
  };

  const experiments = [
    { id: 'radar', title: 'Symptom Radar', desc: 'Detects early biometric deviations before fatigue sets in.', status: 'Active', icon: Activity, metric: 'No significant deviations' },
    { id: 'cardio', title: 'Cardiovascular Age', desc: 'Estimates vascular health using PPG sensors.', status: 'Active', icon: HeartPulse, metric: 'Cardio Age: 5 years younger' },
    { id: 'chronotype', title: 'Circadian Alignment', desc: 'Maps energy peaks to optimize task scheduling.', status: 'Active', icon: Clock, metric: '94% alignment with Morning Lark' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-enso-blue text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Oura Labs & AI Advisor</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight">AI-Powered Bio-Signal Synthesis</h2>
          <p className="text-sm text-white/45 leading-relaxed">
            Oura Labs is our testing ground for cutting-edge generative AI and experimental biometric algorithms.
          </p>
        </div>
        <div className="glass-tab rounded-xl px-4 py-2.5 text-xs font-semibold text-score-green flex items-center gap-2">
          <FlaskConical className="w-4 h-4" /> 3 Experiments Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-4 lg:col-span-1">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="font-serif text-lg text-white">Active Labs Experiments</h3>
            {experiments.map((exp) => {
              const Icon = exp.icon;
              return (
                <div key={exp.id} className="glass-tab rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-white font-medium text-sm">
                      <Icon className="w-4 h-4 text-enso-blue" /> {exp.title}
                    </div>
                    <span className="text-[10px] bg-score-green/10 text-score-green border border-score-green/20 px-2 py-0.5 rounded font-semibold uppercase">{exp.status}</span>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{exp.desc}</p>
                  <div className="text-xs font-semibold text-enso-blue pt-2 border-t border-white/[0.06]">{exp.metric}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 glass-card rounded-2xl p-5 space-y-4 h-[500px] flex flex-col">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-helsinki to-enso-blue flex items-center justify-center text-white shadow-lg font-serif font-bold text-lg">Ō</div>
              <div>
                <h3 className="font-serif text-lg text-white">Oura Advisor Chat</h3>
                <p className="text-xs text-white/30">Trained on your Gen3 Horizon sensor data</p>
              </div>
            </div>
            <span className="text-xs text-score-green font-medium flex items-center gap-1.5 bg-score-green/10 px-2.5 py-1 rounded-full border border-score-green/20">
              <span className="w-1.5 h-1.5 rounded-full bg-score-green pulse-dot" /> Advisor Online
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg) => {
              const isOura = msg.sender === 'oura';
              return (
                <div key={msg.id} className={`flex items-start gap-3 ${isOura ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    isOura ? 'bg-white/[0.06] text-enso-blue border border-white/[0.08]' : 'bg-gradient-to-br from-helsinki to-enso-blue text-white font-semibold text-xs'
                  }`}>
                    {isOura ? <Bot className="w-4 h-4" /> : 'AW'}
                  </div>
                  <div className={`max-w-md rounded-2xl p-3.5 space-y-1 shadow-sm ${
                    isOura ? 'glass-tab text-white/80' : 'bg-enso-blue/15 text-white border border-enso-blue/20'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] text-white/30 mb-1">
                      <span className="font-semibold uppercase tracking-wider">{isOura ? 'Oura Advisor' : 'Alexander'}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="text-xs leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex items-start gap-3 animate-fadeIn">
                <div className="w-8 h-8 rounded-full bg-white/[0.06] text-enso-blue border border-white/[0.08] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="glass-tab rounded-2xl px-4 py-3 text-xs text-white/40 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-enso-blue animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-enso-blue animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-enso-blue animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-white/[0.06] shrink-0">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your workout readiness, sleep debt, or bio-signals..."
              className="flex-1 glass-tab rounded-xl px-4 py-3 text-xs text-white/80 placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors" />
            <button type="submit" disabled={!input.trim() || isTyping}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                !input.trim() || isTyping ? 'glass-tab text-white/20 cursor-not-allowed' : 'bg-gradient-to-r from-helsinki to-enso-blue text-white shadow-lg hover:opacity-90'
              }`}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
