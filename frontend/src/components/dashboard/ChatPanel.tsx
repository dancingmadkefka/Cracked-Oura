import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Loader2, Bot, User, MessageSquare, Plus, ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, ChatThread } from "@/hooks/useChat";
import { ThoughtsDisplay } from "@/components/dashboard/ThoughtsDisplay";

interface ChatPanelProps {
    onClose: () => void;
    threads: ChatThread[];
    activeThreadId: string | null;
    messages: Message[];
    isLoading: boolean;
    onSend: (message: string) => void;
    onStopGeneration: () => void;
    onCreateThread: () => Promise<string>;
    onDeleteThread: (id: string) => Promise<void>;
    onSwitchThread: (id: string) => void;
}

export function ChatPanel({
    onClose,
    threads,
    activeThreadId,
    messages,
    isLoading,
    onSend,
    onStopGeneration,
    onCreateThread,
    onDeleteThread,
    onSwitchThread,
}: ChatPanelProps) {
    const [input, setInput] = useState("");
    const [threadMenuOpen, setThreadMenuOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const activeThread = threads.find(t => t.id === activeThreadId);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Close menu on outside click
    useEffect(() => {
        if (!threadMenuOpen) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setThreadMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [threadMenuOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        onSend(input.trim());
        setInput("");
    };

    return (
        <div className="w-[400px] border-l bg-card flex flex-col h-full shadow-xl z-20">
            {/* Header */}
            <div className="p-3 border-b flex items-center gap-2 bg-muted/30">
                {/* Thread Selector */}
                <div className="flex-1 min-w-0 relative" ref={menuRef}>
                    <button
                        onClick={() => setThreadMenuOpen(!threadMenuOpen)}
                        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
                    >
                        <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-medium truncate">
                            {activeThread?.title || 'AI Assistant'}
                        </span>
                        <ChevronDown className={cn(
                            "h-3.5 w-3.5 text-white/40 ml-auto shrink-0 transition-transform",
                            threadMenuOpen && "rotate-180"
                        )} />
                    </button>

                    {threadMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-white/[0.08] bg-card shadow-2xl z-50 overflow-hidden">
                            <div className="max-h-48 overflow-y-auto py-1">
                                {threads.length === 0 && (
                                    <p className="text-xs text-white/30 px-3 py-4 text-center">
                                        No conversations yet
                                    </p>
                                )}
                                {threads.map((thread) => (
                                    <button
                                        key={thread.id}
                                        onClick={() => {
                                            onSwitchThread(thread.id);
                                            setThreadMenuOpen(false);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 w-full px-3 py-2 text-left text-sm transition-colors group",
                                            thread.id === activeThreadId
                                                ? "bg-primary/10 text-primary"
                                                : "text-white/70 hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-white/30" />
                                        <span className="truncate flex-1">{thread.title}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteThread(thread.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/[0.08] text-white/30 hover:text-red-400 transition-all shrink-0"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </button>
                                ))}
                            </div>
                            <div className="border-t border-white/[0.06] p-1">
                                <button
                                    onClick={() => {
                                        onCreateThread();
                                        setThreadMenuOpen(false);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-white/60 hover:bg-white/[0.04] hover:text-white/90 rounded transition-colors"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    New thread
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground text-sm py-8 px-4">
                            <p>👋 Hi! I can analyze your Oura Ring data.</p>
                            <p className="mt-2">Try asking:</p>
                            <ul className="mt-2 space-y-1 text-xs bg-muted/50 p-3 rounded-md text-left">
                                <li>"How is my sleep score trending?"</li>
                                <li>"What's my average HRV this month?"</li>
                                <li>"Did I meet my activity goals last week?"</li>
                                <li>"Show me my lowest heart rate during sleep"</li>
                            </ul>
                        </div>
                    )}

                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex gap-3 text-sm",
                                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}>
                                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>
                            <div className={cn(
                                "p-3 rounded-lg max-w-[80%]",
                                msg.role === 'user'
                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                    : "bg-muted rounded-tl-none"
                            )}>
                                {msg.content}

                                {msg.role === 'assistant' && msg.thoughts && msg.thoughts.length > 0 && (
                                    <ThoughtsDisplay thoughts={msg.thoughts} />
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="bg-muted p-3 rounded-lg rounded-tl-none flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span className="text-xs text-muted-foreground">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-background">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex gap-2"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={activeThread ? "Reply in thread..." : "Ask a question..."}
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={onStopGeneration} className="shrink-0" style={{ display: isLoading ? 'inline-flex' : 'none' }}>
                        <X className="h-4 w-4" />
                    </Button>
                    <Button type="submit" size="icon" disabled={!input.trim()} className="shrink-0" style={{ display: isLoading ? 'none' : 'inline-flex' }}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
