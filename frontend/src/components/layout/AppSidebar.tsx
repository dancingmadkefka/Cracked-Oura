import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Settings,
    ChevronLeft,
    ChevronRight,
    Plus,
    MoreVertical,
    Trash2,
    Edit2,
    Sparkles,
    ActivitySquare,
    Waves,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { Dashboard } from "@/types";

interface AppSidebarProps {
    className?: string;
    dashboards: Dashboard[];
    activeDashboardId: string;
    onDashboardSelect: (id: string) => void;
    onDashboardAdd: () => void;
    onDashboardDelete: (id: string) => void;
    onDashboardRename: (id: string, newName: string) => void;
    onSettingsClick?: () => void;
    onChatPageSelect?: () => void;
    activeView?: 'dashboard' | 'chat-page';
}

export function AppSidebar({
    className,
    dashboards,
    activeDashboardId,
    onDashboardSelect,
    onDashboardAdd,
    onDashboardDelete,
    onDashboardRename,
    onSettingsClick,
    onChatPageSelect,
    activeView = 'dashboard'
}: AppSidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    const handleStartEdit = (dashboard: Dashboard) => {
        setEditingId(dashboard.id);
        setEditName(dashboard.name);
    };

    const handleSaveEdit = () => {
        if (editingId && editName.trim()) {
            onDashboardRename(editingId, editName.trim());
        }
        setEditingId(null);
    };

    return (
        <div className={cn(
            "flex flex-col border-r border-white/8 bg-[linear-gradient(180deg,rgba(10,11,16,0.96),rgba(15,18,28,0.94))] text-white",
            collapsed ? "w-20" : "w-80",
            className
        )}>
            {/* Header */}
            <div className="border-b border-white/8 px-5 py-5">
                <div className={cn("flex items-center gap-3 overflow-hidden", collapsed && "justify-center w-full")}>
                    <div className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
                        <img src="icon.png" alt="Logo" className="h-full w-full object-cover" />
                    </div>
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="truncate font-['Space_Grotesk',sans-serif] text-lg font-semibold tracking-tight">Cracked Oura</p>
                            <p className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Recovery cockpit</p>
                        </div>
                    )}
                </div>
            </div>

            {!collapsed && (
                <div className="px-4 pt-4">
                    <div className="rounded-3xl border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">Workspace</p>
                                <p className="mt-2 font-['Space_Grotesk',sans-serif] text-xl font-semibold">Daily intelligence</p>
                                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                                    Switch between dashboards, shape your layout, and keep the desktop sync server under control.
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-3 text-white">
                                <Waves className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4">
                <div className="px-3 space-y-6">
                    {!collapsed && (
                        <div className="px-2">
                            <p className="text-[11px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                                Dashboards
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                    {dashboards.map(dashboard => (
                        <div key={dashboard.id} className="group relative flex items-center">
                            {editingId === dashboard.id && !collapsed ? (
                                <div className="flex items-center w-full px-2">
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={handleSaveEdit}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                        autoFocus
                                        className="h-8 text-sm"
                                    />
                                </div>
                            ) : (
                                <Button
                                    variant={activeDashboardId === dashboard.id ? "secondary" : "ghost"}
                                    className={cn(
                                        "h-12 w-full rounded-2xl justify-start gap-3 border border-transparent transition-all",
                                        collapsed ? "px-2 justify-center" : "px-4",
                                        activeDashboardId === dashboard.id
                                            ? "border-white/10 bg-white text-black shadow-[0_14px_28px_rgba(255,255,255,0.08)] hover:bg-white/95"
                                            : "bg-transparent text-white/80 hover:border-white/10 hover:bg-white/6 hover:text-white"
                                    )}
                                    onClick={() => onDashboardSelect(dashboard.id)}
                                    title={collapsed ? dashboard.name : undefined}
                                >
                                    <LayoutDashboard className="h-5 w-5 shrink-0" />
                                    {!collapsed && <span className="truncate flex-1 text-left">{dashboard.name}</span>}
                                </Button>
                            )}

                            {!collapsed && !editingId && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 h-8 w-8 rounded-xl text-white/50 hover:bg-white/8 hover:text-white"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleStartEdit(dashboard)}>
                                            <Edit2 className="h-4 w-4 mr-2" />
                                            Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => onDashboardDelete(dashboard.id)}
                                            disabled={dashboards.length <= 1}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    ))}
                    </div>

                    {!collapsed && (
                        <Button
                            variant="ghost"
                            className="h-12 w-full justify-start gap-3 rounded-2xl border border-dashed border-white/12 px-4 text-white/75 hover:bg-white/6 hover:text-white"
                            onClick={onDashboardAdd}
                        >
                            <Plus className="h-5 w-5 shrink-0" />
                            <span>Add Dashboard</span>
                        </Button>
                    )}
                    {collapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-12 w-full justify-center rounded-2xl border border-dashed border-white/12 text-white/75 hover:bg-white/6 hover:text-white"
                            onClick={onDashboardAdd}
                            title="Add Dashboard"
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {/* Chat Page Link */}
                <div className="border-t border-white/8 px-3 pt-5">
                    {!collapsed && (
                        <div className="px-2 pb-2">
                            <p className="text-[11px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                                Tools
                            </p>
                        </div>
                    )}
                    <Button
                        variant={activeView === 'chat-page' ? "secondary" : "ghost"}
                        className={cn(
                            "h-12 w-full rounded-2xl justify-start gap-3 border border-transparent",
                            collapsed ? "px-2 justify-center" : "px-4",
                            activeView === 'chat-page'
                                ? "border-white/10 bg-white text-black"
                                : "text-white/80 hover:border-white/10 hover:bg-white/6 hover:text-white"
                        )}
                        onClick={onChatPageSelect}
                        title={collapsed ? "AI Chat" : undefined}
                    >
                        <Sparkles className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="truncate flex-1 text-left">AI Chat</span>}
                    </Button>
                    {!collapsed && (
                        <div className="mt-4 rounded-2xl border border-white/8 bg-white/4 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">Editing</p>
                                    <p className="mt-1 text-sm text-white/90">Layout tools live here.</p>
                                </div>
                                <ActivitySquare className="h-5 w-5 text-white/60" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="space-y-2 border-t border-white/8 p-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-full rounded-2xl text-white/75 hover:bg-white/6 hover:text-white"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-full rounded-2xl text-white/75 hover:bg-white/6 hover:text-white"
                    onClick={onSettingsClick}
                >
                    <Settings className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
