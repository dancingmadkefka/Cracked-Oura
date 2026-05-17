import { useState } from 'react';
import { HealthSidebar, type AppView } from './HealthSidebar';
import { TopDateBar } from './TopDateBar';
import { ContextRail } from './ContextRail';
import { SettingsPanel } from '@/components/dashboard/SettingsPanel';
import { WidgetEditorPanel } from '@/components/dashboard/WidgetEditorPanel';
import { TodayView } from '@/components/views/TodayView';
import { SleepView } from '@/components/views/SleepView';
import { ReadinessView } from '@/components/views/ReadinessView';
import { ActivityView } from '@/components/views/ActivityView';
import { ResilienceView } from '@/components/views/ResilienceView';
import { TrendsView } from '@/components/views/TrendsView';
import { JournalView } from '@/components/views/JournalView';
import { AIAnalystView } from '@/components/views/AIAnalystView';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { buildDaySummary } from '@/lib/day-summary';
import { format } from 'date-fns';
import type { Message } from '@/hooks/useChat';

interface AppShellProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  syncStatus: { status: string; lastRun: string | null } | null;
  data: any;

  dashboards: any[];
  activeDashboardId: string;
  onDashboardSelect: (id: string) => void;
  onDashboardAdd: () => void;
  onDashboardDelete: (id: string) => void;
  onDashboardRename: (id: string, name: string) => void;
  widgets: any[];
  layout: any[];
  isEditing: boolean;
  startEditingWidget: () => void;
  deleteWidget: (id: string) => void;
  updateEditingWidget: (w: any) => void;
  editingWidget: any;
  saveEditingWidget: () => void;
  cancelEditingWidget: () => void;
  activePanel: string;
  setActivePanel: (p: 'none' | 'settings' | 'editor') => void;

  messages: Message[];
  isLoading: boolean;
  sendMessage: (msg: string) => void;
  clearHistory: () => void;
  onNavigateToAi: () => void;
}

export function AppShell({
  activeView,
  onViewChange,
  selectedDate,
  onDateChange,
  syncStatus,
  data,
  widgets,
  layout,
  isEditing,
  startEditingWidget,
  deleteWidget,
  updateEditingWidget,
  editingWidget,
  saveEditingWidget,
  cancelEditingWidget,
  activePanel,
  setActivePanel,
  messages,
  isLoading,
  sendMessage,
  clearHistory,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const summary = data ? buildDaySummary(data, format(selectedDate, 'yyyy-MM-dd')) : null;

  const handleAiPrompt = (prompt: string) => {
    onViewChange('ai');
    sendMessage(prompt);
  };

  const renderView = () => {
    switch (activeView) {
      case 'today':
        return <TodayView onNavigate={onViewChange} />;
      case 'sleep':
        return <SleepView />;
      case 'readiness':
        return <ReadinessView />;
      case 'activity':
        return <ActivityView />;
      case 'resilience':
        return <ResilienceView />;
      case 'trends':
        return <TrendsView />;
      case 'journal':
        return <JournalView />;
      case 'dashboards':
        return (
          <DashboardGrid
            widgets={widgets}
            layout={layout}
            isEditing={isEditing}
            onLayoutChange={() => {}}
            onEditWidget={startEditingWidget}
            onDeleteWidget={deleteWidget}
            onWidgetChange={updateEditingWidget}
            data={data}
            selectedDate={selectedDate}
          />
        );
      case 'ai':
        return (
          <AIAnalystView
            messages={messages}
            isLoading={isLoading}
            onSend={sendMessage}
            onClear={clearHistory}
          />
        );
      default:
        return <TodayView onNavigate={onViewChange} />;
    }
  };

  const showContextRail = ['today', 'sleep', 'readiness', 'activity', 'resilience'].includes(activeView);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#08080a] text-foreground">
      <HealthSidebar
        activeView={activeView}
        onViewChange={onViewChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSettingsClick={() => setActivePanel(activePanel === 'settings' ? 'none' : 'settings')}
        className="hidden md:flex"
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopDateBar
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          syncStatus={syncStatus ? { status: syncStatus.status, lastRun: syncStatus.lastRun } : undefined}
        />

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-auto relative">
            {renderView()}
          </main>

          {showContextRail && summary && (
            <ContextRail
              summary={summary}
              battery={summary.battery}
              timeline={summary.timeline}
              onAiPrompt={handleAiPrompt}
              className="hidden xl:flex"
            />
          )}
        </div>
      </div>

      {activePanel === 'settings' && (
        <SettingsPanel onClose={() => setActivePanel('none')} />
      )}
      {activePanel === 'editor' && (
        <WidgetEditorPanel
          onClose={cancelEditingWidget}
          onSave={saveEditingWidget}
          onChange={updateEditingWidget}
          widget={editingWidget}
        />
      )}
    </div>
  );
}
