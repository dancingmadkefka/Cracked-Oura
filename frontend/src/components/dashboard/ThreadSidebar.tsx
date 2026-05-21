import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatThread } from "@/hooks/useChat";

interface ThreadSidebarProps {
    threads: ChatThread[];
    activeThreadId: string | null;
    onSwitch: (id: string) => void;
    onCreate: () => Promise<string>;
    onDelete: (id: string) => Promise<void>;
    onRename?: (id: string, title: string) => void;
}

export function ThreadSidebar({
    threads,
    activeThreadId,
    onSwitch,
    onCreate,
    onDelete,
}: ThreadSidebarProps) {
    return (
        <div className="w-56 shrink-0 border-r border-white/[0.06] flex flex-col h-full">
            {/* Header */}
            <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
                    Threads
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCreate}
                    className="h-7 w-7 text-white/40 hover:text-white/80 hover:bg-white/[0.06]"
                    title="New thread"
                >
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Thread List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                    {threads.length === 0 && (
                        <p className="text-xs text-white/20 text-center py-8 px-3">
                            No conversations yet.
                            Start one to analyze your data.
                        </p>
                    )}
                    {threads.map((thread) => (
                        <div
                            key={thread.id}
                            className={cn(
                                "group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all",
                                thread.id === activeThreadId
                                    ? "bg-white/[0.08] text-white/90"
                                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/70"
                            )}
                            onClick={() => onSwitch(thread.id)}
                        >
                            <MessageSquare className="h-3.5 w-3.5 shrink-0 text-white/30 group-hover:text-white/50" />
                            <span className="text-xs truncate flex-1 leading-tight">
                                {thread.title}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(thread.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/[0.08] text-white/30 hover:text-red-400 transition-all"
                                title="Delete thread"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
