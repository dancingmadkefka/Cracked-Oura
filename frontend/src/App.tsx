import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { AppShell } from "@/components/layout/AppShell";
import { useChat } from "@/hooks/useChat";
import type { AppView } from "@/components/layout/HealthSidebar";

function DashboardApp() {
  const {
    dashboards,
    activeDashboardId,
    setActiveDashboardId,
    addDashboard,
    deleteDashboard,
    renameDashboard,
    widgets,
    layout,
    isEditing,
    activePanel,
    setActivePanel,
    activeView,
    setActiveView,
    startEditingWidget,
    editingWidget,
    updateEditingWidget,
    saveEditingWidget,
    cancelEditingWidget,
    deleteWidget,
    selectedDate,
    setSelectedDate,
    data,
    syncInfo,
  } = useDashboard();

  const { messages, isLoading, sendMessage, clearHistory } = useChat();

  const syncStatus = syncInfo ? { status: syncInfo.status, lastRun: syncInfo.lastRun } : null;

  return (
    <AppShell
      activeView={activeView}
      onViewChange={(view: AppView) => setActiveView(view)}
      selectedDate={selectedDate}
      onDateChange={(date: Date) => setSelectedDate(date)}
      syncStatus={syncStatus}

      dashboards={dashboards}
      activeDashboardId={activeDashboardId}
      onDashboardSelect={(id: string) => {
        setActiveDashboardId(id);
        setActiveView('dashboards');
      }}
      onDashboardAdd={addDashboard}
      onDashboardDelete={deleteDashboard}
      onDashboardRename={renameDashboard}

      widgets={widgets}
      layout={layout}
      isEditing={isEditing}
      startEditingWidget={() => startEditingWidget()}
      deleteWidget={deleteWidget}
      updateEditingWidget={updateEditingWidget}
      editingWidget={editingWidget}
      saveEditingWidget={saveEditingWidget}
      cancelEditingWidget={cancelEditingWidget}

      activePanel={activePanel}
      setActivePanel={(p) => setActivePanel(p as 'none' | 'settings' | 'editor')}

      messages={messages}
      isLoading={isLoading}
      sendMessage={sendMessage}
      clearHistory={clearHistory}
      onNavigateToAi={() => setActiveView('ai')}

      data={data}
    />
  );
}

function App() {
  return (
    <DashboardProvider>
      <DashboardApp />
    </DashboardProvider>
  );
}

export default App;
