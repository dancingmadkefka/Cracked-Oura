import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { RightPanel } from './components/RightPanel';
import { Dashboard } from './components/Dashboard';
import { ReadinessView } from './components/ReadinessView';
import { SleepView } from './components/SleepView';
import { ActivityView } from './components/ActivityView';
import { StressResilienceView } from './components/StressResilienceView';
import { TrendsView } from './components/TrendsView';
import { CirclesView } from './components/CirclesView';
import { TagsJournalView } from './components/TagsJournalView';
import { OuraLabsView } from './components/OuraLabsView';
import { SettingsModal } from './components/SettingsModal';
import { mockDaysData, userProfile } from './data/mockOuraData';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>('2026-05-20');
  const [restMode, setRestMode] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [daysData, setDaysData] = useState(mockDaysData);

  // ─── Time-of-Day Awareness (from Design A) ───
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setTimeOfDay('morning');
    else if (hour >= 12 && hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);

  const bgImage = timeOfDay === 'evening'
    ? '/images/oura-bg-night.jpg'
    : '/images/oura-bg-day.jpg';

  // ─── Ring Status (Design A hardware context) ───
  const [ringConnected] = useState(true);
  const batteryLevel = userProfile.batteryLevel;

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const handleAddTag = (newTag: string) => {
    setDaysData(prev => ({
      ...prev,
      [selectedDate]: {
        ...prev[selectedDate],
        tags: [...prev[selectedDate].tags, newTag]
      }
    }));
  };

  const handleUpdateNotes = (notes: string) => {
    setDaysData(prev => ({
      ...prev,
      [selectedDate]: {
        ...prev[selectedDate],
        notes
      }
    }));
  };

  const currentDayData = daysData[selectedDate] || daysData['2026-05-20'];

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative bg-oura-black font-sans">
      {/* ─── Dynamic Atmospheric Background (Design A) ─── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fade"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-oura-black/60 via-oura-black/40 to-oura-black/80" />

      {/* ─── Content Layer ─── */}
      <div className="flex h-screen overflow-hidden relative z-10">
        {/* Sidebar Navigation (Design B architecture + Design A glass) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          restMode={restMode}
          setRestMode={setRestMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSync={handleSync}
          isSyncing={isSyncing}
        />

        {/* Main Container */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {/* Header */}
          <Header
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            restMode={restMode}
            timeOfDay={timeOfDay}
          />

          {/* Dynamic Content Body */}
          <main className="flex-1 overflow-y-auto relative">
            {activeTab === 'dashboard' && (
              <Dashboard dayData={currentDayData} onSelectTab={setActiveTab} timeOfDay={timeOfDay} />
            )}
            {activeTab === 'readiness' && (
              <ReadinessView dayData={currentDayData} />
            )}
            {activeTab === 'sleep' && (
              <SleepView dayData={currentDayData} />
            )}
            {activeTab === 'activity' && (
              <ActivityView dayData={currentDayData} />
            )}
            {activeTab === 'resilience' && (
              <StressResilienceView dayData={currentDayData} />
            )}
            {activeTab === 'trends' && (
              <TrendsView />
            )}
            {activeTab === 'circles' && (
              <CirclesView />
            )}
            {activeTab === 'tags' && (
              <TagsJournalView
                dayData={currentDayData}
                onAddTag={handleAddTag}
                onUpdateNotes={handleUpdateNotes}
              />
            )}
            {activeTab === 'labs' && (
              <OuraLabsView />
            )}
          </main>
        </div>

        {/* Right Contextual Panel (Design A) — Ring Status + Timeline */}
        <RightPanel
          ringConnected={ringConnected}
          batteryLevel={batteryLevel}
          timeOfDay={timeOfDay}
        />
      </div>

      {/* ─── Bottom Tab Dock (Design A — responsive) ─── */}
      <div className="relative z-10 flex justify-center pb-3 flex-shrink-0 xl:hidden">
        <div className="glass-card rounded-2xl px-2 py-1.5 flex items-center gap-1">
          {[
            { id: 'dashboard', label: 'Today' },
            { id: 'readiness', label: 'Readiness' },
            { id: 'sleep', label: 'Sleep' },
            { id: 'activity', label: 'Activity' },
            { id: 'resilience', label: 'Stress' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default App;
