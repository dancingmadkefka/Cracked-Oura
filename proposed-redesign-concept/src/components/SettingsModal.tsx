import React, { useState } from 'react';
import { X, Sliders, User, Smartphone, ShieldCheck, Check } from 'lucide-react';
import { userProfile } from '../data/mockOuraData';
import { cn } from '../utils/cn';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'ring' | 'preferences' | 'privacy'>('ring');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-2xl bg-oura-black/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[500px]">
        <div className="w-full md:w-52 bg-white/[0.02] border-b md:border-b-0 md:border-r border-white/[0.06] p-5 space-y-3 shrink-0 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-medium text-white">Settings</h3>
            <button onClick={onClose} className="md:hidden text-white/30 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-1 flex-1">
            {[
              { id: 'ring', label: 'Ring Hardware', icon: Smartphone },
              { id: 'profile', label: 'Account Profile', icon: User },
              { id: 'preferences', label: 'Preferences', icon: Sliders },
              { id: 'privacy', label: 'Data & Privacy', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer',
                    isActive ? 'glass-tab text-white border-enso-blue/30' : 'text-white/35 hover:bg-white/[0.03] hover:text-white/60'
                  )}>
                  <Icon className={cn('w-4 h-4', isActive && 'text-enso-blue')} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div className="pt-3 border-t border-white/[0.06] text-[11px] text-white/25">Oura Desktop OS v2.4</div>
        </div>

        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 hidden md:flex">
            <h4 className="font-serif text-lg text-white capitalize">{activeTab} Configuration</h4>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {activeTab === 'ring' && (
            <div className="space-y-5">
              <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-white">{userProfile.ringModel}</div>
                  <div className="text-xs text-white/30">Finish: {userProfile.ringFinish} · Size 10</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-xs font-bold text-score-green bg-score-green/10 px-2.5 py-1 rounded-lg border border-score-green/20">
                    Battery: {userProfile.batteryLevel}%
                  </div>
                  <div className="text-[11px] text-white/25">Bluetooth LE</div>
                </div>
              </div>
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Firmware & Sensors</h5>
                <div className="glass-tab rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <span className="text-white/35">Firmware Version</span>
                  <span className="text-white/70 font-medium">{userProfile.firmwareVersion}</span>
                </div>
                <div className="glass-tab rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <span className="text-white/35">Auto Background Sync</span>
                  <span className="text-score-green font-medium">Enabled (Every 15 min)</span>
                </div>
                <div className="glass-tab rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <span className="text-white/35">LED Sensor Diagnostics</span>
                  <button className="text-enso-blue hover:underline font-medium cursor-pointer">Run Test</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-helsinki to-enso-blue flex items-center justify-center font-serif text-xl text-white font-bold shrink-0 shadow-lg">AW</div>
                <div>
                  <div className="text-base font-medium text-white">{userProfile.name}</div>
                  <div className="text-xs text-white/30">{userProfile.email}</div>
                  <div className="text-[11px] text-enso-blue mt-1 font-medium">Member since {userProfile.memberSince}</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Biometrics Baseline</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-tab rounded-xl p-3.5 space-y-1">
                    <span className="text-[11px] text-white/30 uppercase">Height</span>
                    <span className="text-sm font-medium text-white">6&apos;1&quot; (185 cm)</span>
                  </div>
                  <div className="glass-tab rounded-xl p-3.5 space-y-1">
                    <span className="text-[11px] text-white/30 uppercase">Weight</span>
                    <span className="text-sm font-medium text-white">178 lbs (80.7 kg)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Display & Units</label>
              {[
                { label: 'Temperature Unit', value: 'Celsius (°C)' },
                { label: 'Distance Unit', value: 'Miles (mi)' },
                { label: 'First Day of Week', value: 'Monday' },
              ].map((item) => (
                <div key={item.label} className="glass-tab rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <span className="text-white/35">{item.label}</span>
                  <span className="text-white/70 font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Data Sharing & Encryption</label>
              {[
                { label: 'End-to-End Encryption', value: 'Active (AES-256)', color: 'text-score-green' },
                { label: 'Oura Circles Sharing', value: 'Custom (3 Members)', color: 'text-enso-blue' },
                { label: 'Research Contributions', value: 'Anonymized Opt-In', color: 'text-score-green' },
              ].map((item) => (
                <div key={item.label} className="glass-tab rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <span className="text-white/35">{item.label}</span>
                  <span className={`font-medium ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end gap-3 mt-auto shrink-0">
            <button onClick={onClose} className="px-4 py-2 glass-tab text-white/40 hover:text-white/80 rounded-xl text-xs font-semibold transition-colors cursor-pointer">Cancel</button>
            <button onClick={handleSave} disabled={saved}
              className="px-6 py-2 bg-gradient-to-r from-helsinki to-enso-blue hover:opacity-90 text-white rounded-xl text-xs font-semibold transition-all shadow-lg cursor-pointer flex items-center gap-1">
              {saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
