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
            "flex flex-col border-r border-white/[0.04] bg-[#030303] text-white/70",
            collapsed ? "w-16" : "w-64",
            className
        )}>
            {/* Header */}
            <div className="border-b border-white/[0.04] px-4 py-4">
                <div className={cn("flex items-center gap-3 overflow-hidden", collapsed && "justify-center w-full")}>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-xl ring-1 ring-white/10">
                        <img src="icon.png" alt="Logo" className="h-full w-full object-cover" />
                    </div>
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="truncate font-['Space_Grotesk',sans-serif] text-[15px] font-medium tracking-tight text-white/95">Cracked Oura</p>
                        </div>
                    )}
                </div>
            </div>



            {/* Navigation */}
            <ScrollArea className="flex-1 py-4">
                <div className="px-3 space-y-4">
                    {!collapsed && (
                        <div className="px-3">
                            <p className="text-[10px] font-semibold tracking-widest text-white/30 uppercase">
                                Dashboards
                            </p>
                        </div>
                    )}

                    <div className="space-y-0.5">
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
                                        className="h-8 text-sm bg-white/5 border-white/10 text-white rounded-md"
                                    />
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "h-9 w-full rounded-md justify-start gap-2.5 transition-all text-sm font-medium",
                                        collapsed ? "px-2 justify-center" : "px-3",
                                        activeDashboardId === dashboard.id
                                            ? "bg-white/[0.06] text-white/95"
                                            : "text-white/50 hover:bg-white/[0.03] hover:text-white/80"
                                    )}
                                    onClick={() => onDashboardSelect(dashboard.id)}
                                    title={collapsed ? dashboard.name : undefined}
                                >
                                    <LayoutDashboard className="h-4 w-4 shrink-0" />
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
                            className="h-9 w-full justify-start gap-2.5 rounded-md px-3 text-sm font-medium text-white/40 hover:bg-white/[0.03] hover:text-white/70"
                            onClick={onDashboardAdd}
                        >
                            <Plus className="h-4 w-4 shrink-0" />
                            <span>Add Dashboard</span>
                        </Button>
                    )}
                    {collapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-full justify-center rounded-md text-white/40 hover:bg-white/[0.03] hover:text-white/70"
                            onClick={onDashboardAdd}
                            title="Add Dashboard"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Chat Page Link */}
                <div className="mt-6 px-3">
                    {!collapsed && (
                        <div className="px-3 pb-2">
                            <p className="text-[10px] font-semibold tracking-widest text-white/30 uppercase">
                                Tools
                            </p>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        className={cn(
                            "h-9 w-full rounded-md justify-start gap-2.5 transition-all text-sm font-medium",
                            collapsed ? "px-2 justify-center" : "px-3",
                            activeView === 'chat-page'
                                ? "bg-white/[0.06] text-white/95"
                                : "text-white/50 hover:bg-white/[0.03] hover:text-white/80"
                        )}
                        onClick={onChatPageSelect}
                        title={collapsed ? "AI Chat" : undefined}
                    >
                        <Sparkles className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate flex-1 text-left">AI Chat</span>}
                    </Button>

                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="space-y-1 p-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-full rounded-md text-white/40 hover:bg-white/[0.03] hover:text-white/70"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-full rounded-md text-white/40 hover:bg-white/[0.03] hover:text-white/70"
                    onClick={onSettingsClick}
                >
                    <Settings className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
