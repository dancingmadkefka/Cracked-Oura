import { useState } from 'react';
import { HealthSidebar } from './HealthSidebar';
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
import { Button } from '@/components/ui/button';
import { buildDaySummary } from '@/lib/day-summary';
import { format } from 'date-fns';
import { Check, Edit2, Plus } from 'lucide-react';
import type { Message } from '@/hooks/useChat';
import type { AppView } from '@/types/app-view';
import type { Dashboard, WidgetInstance } from '@/types';

interface AppShellProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  syncStatus: { status: string; lastRun: string | null } | null;
  data: any;

  dashboards: Dashboard[];
  activeDashboardId: string;
  onDashboardSelect: (id: string) => void;
  onDashboardAdd: () => void;
  onDashboardDelete: (id: string) => void;
  onDashboardRename: (id: string, name: string) => void;
  widgets: WidgetInstance[];
  layout: any[];
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  startEditingWidget: (widget?: WidgetInstance) => void;
  deleteWidget: (id: string) => void;
  updateEditingWidget: (w: WidgetInstance) => void;
  editingWidget: WidgetInstance | undefined;
  saveEditingWidget: () => void;
  cancelEditingWidget: () => void;
  activePanel: string;
  setActivePanel: (p: 'none' | 'settings' | 'editor') => void;
  updateActiveDashboard: (updates: Partial<Dashboard>) => void;

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
  dashboards,
  activeDashboardId,
  onDashboardSelect,
  onDashboardAdd,
  onDashboardDelete,
  onDashboardRename,
  widgets,
  layout,
  isEditing,
  setIsEditing,
  startEditingWidget,
  deleteWidget,
  updateEditingWidget,
  editingWidget,
  saveEditingWidget,
  cancelEditingWidget,
  activePanel,
  setActivePanel,
  updateActiveDashboard,
  messages,
  isLoading,
  sendMessage,
  clearHistory,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const summary = data ? buildDaySummary(data, format(selectedDate, 'yyyy-MM-dd')) : null;
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const handleAiPrompt = (prompt: string) => {
    onViewChange('ai');
    sendMessage(prompt);
  };

  const handleLayoutChange = (newLayout: any[]) => {
    updateActiveDashboard({ layout: newLayout });
  };

  const activeDashboardName = dashboards.find(d => d.id === activeDashboardId)?.name ?? 'Dashboard';

  const renderDashboardView = () => (
    <div className="p-6 md:p-8 space-y-4 max-w-7xl mx-auto animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-white tracking-wide">{activeDashboardName}</h1>
          <p className="text-sm text-white/40 mt-1">Custom dashboard workspace</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => startEditingWidget()}
              className="gap-2 border-white/[0.08] bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Widget
            </Button>
          )}
          <Button
            variant={isEditing ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (isEditing && activePanel === 'editor') {
                setActivePanel('none');
              }
              setIsEditing(!isEditing);
            }}
            className="gap-2 border-white/[0.08] bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
          >
            {isEditing ? <Check className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
            {isEditing ? 'Done Editing' : 'Edit Layout'}
          </Button>
        </div>
      </div>

      <DashboardGrid
        widgets={widgets}
        layout={layout}
        isEditing={isEditing}
        onLayoutChange={handleLayoutChange}
        onEditWidget={startEditingWidget}
        onDeleteWidget={deleteWidget}
        onWidgetChange={updateEditingWidget}
        data={data}
        selectedDate={selectedDate}
      />
    </div>
  );

  const renderView = () => {
    switch (activeView) {
      case 'today':
        return <TodayView onNavigate={onViewChange} timeOfDay={timeOfDay} />;
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
      case 'dashboard-manager':
        return renderDashboardView();
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
        return <TodayView onNavigate={onViewChange} timeOfDay={timeOfDay} />;
    }
  };

  const showContextRail = ['today', 'sleep', 'readiness', 'activity', 'resilience'].includes(activeView);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-oura-black text-foreground relative">
      {/* Atmospheric Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url('/images/oura-bg-${timeOfDay === 'morning' || timeOfDay === 'afternoon' ? 'day' : 'night'}.jpg')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-oura-black/60 via-oura-black/80 to-oura-black pointer-events-none" />

      {/* Sidebar */}
      <div className="relative z-10">
        <HealthSidebar
          activeView={activeView}
          onViewChange={onViewChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSettingsClick={() => setActivePanel(activePanel === 'settings' ? 'none' : 'settings')}
          syncStatus={syncStatus}
          onSync={() => {}}
          isSyncing={false}
          dashboards={dashboards}
          activeDashboardId={activeDashboardId}
          onDashboardSelect={onDashboardSelect}
          onDashboardAdd={onDashboardAdd}
          onDashboardDelete={onDashboardDelete}
          onDashboardRename={onDashboardRename}
        />
      </div>

      {/* Main Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <TopDateBar
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          syncStatus={syncStatus ? { status: syncStatus.status, lastRun: syncStatus.lastRun } : undefined}
        />

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-auto relative">
            {renderView()}
          </main>

          {/* Context Rail */}
          {showContextRail && summary && (
            <ContextRail
              summary={summary}
              battery={summary.battery}
              batteryTimestamp={summary.batteryTimestamp}
              timeline={summary.timeline}
              onAiPrompt={handleAiPrompt}
            />
          )}
        </div>
      </div>

      {/* Side Panels */}
      {activePanel === 'settings' && (
        <div className="relative z-20">
          <SettingsPanel onClose={() => setActivePanel('none')} />
        </div>
      )}
      {activePanel === 'editor' && (
        <div className="relative z-20">
          <WidgetEditorPanel
            onClose={cancelEditingWidget}
            onSave={saveEditingWidget}
            onChange={updateEditingWidget}
            widget={editingWidget}
          />
        </div>
      )}
    </div>
  );
}
