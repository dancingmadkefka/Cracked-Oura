import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Trash2, TrendingUp, Database, Zap, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/hooks/useChat";
import { ThoughtsDisplay } from "@/components/dashboard/ThoughtsDisplay";

interface ChatPageProps {
    messages: Message[];
    isLoading: boolean;
    onSend: (message: string) => void;
    onClear: () => void;
}

const SUGGESTION_CATEGORIES = [
    {
        label: "Trends",
        icon: TrendingUp,
        questions: [
            "How is my sleep score trending over the last 90 days?",
            "Which month had the highest average activity score in 2024?",
            "What is my average HRV on weekends vs weekdays?",
        ]
    },
    {
        label: "Insights",
        icon: Zap,
        questions: [
            "Is there a correlation between my total calories and deep sleep?",
            "What is my average sleep efficiency on days with high activity?",
            "Do I sleep longer on weekends?",
        ]
    },
    {
        label: "Data",
        icon: Database,
        questions: [
            "Show me my lowest heart rate during sleep for the last 30 days",
            "What was my best sleep score in 2024?",
            "Compare my deep sleep in winter vs summer",
        ]
    },
    {
        label: "Advanced",
        icon: Search,
        questions: [
            "Show me the distribution of my sleep scores",
            "What is my average vascular age trend?",
            "How often does my ring battery drop below 20%?",
        ]
    }
];

export function ChatPage({ messages, isLoading, onSend, onClear }: ChatPageProps) {
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        onSend(input.trim());
        setInput("");
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(213,80%,50%)] flex items-center justify-center shadow-[0_8px_24px_rgba(115,167,255,0.25)]">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-['Space_Grotesk',sans-serif] text-xl font-semibold tracking-tight text-white">AI Data Analyst</h1>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Natural-language queries over your Oura data</p>
                        </div>
                    </div>
                </div>
                {messages.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClear}
                        className="gap-2 border-white/10 bg-white/5 text-red-300 hover:bg-red-500/10 hover:text-red-200 hover:border-red-500/20"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear
                    </Button>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,20,29,0.96),rgba(10,12,18,0.94))] shadow-[0_18px_60px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                        {messages.length === 0 && (
                            <div className="py-12 space-y-8 animate-in fade-in duration-500">
                                {/* Setup hint */}
                                <div className="max-w-lg mx-auto rounded-2xl border border-white/8 bg-white/[0.03] p-5 space-y-3">
                                    <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">Quick setup</p>
                                    <ol className="list-decimal list-inside space-y-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                                        <li>Start an OpenAI-compatible server (LM Studio, llama.cpp, etc.)</li>
                                        <li>Default endpoint: <code className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono">http://localhost:1234/v1</code></li>
                                        <li>Change the model and endpoint in Settings → AI Advisor</li>
                                    </ol>
                                </div>

                                {/* Suggestion categories */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                                    {SUGGESTION_CATEGORIES.map((cat) => {
                                        const Icon = cat.icon;
                                        return (
                                            <div key={cat.label} className="space-y-2">
                                                <div className="flex items-center gap-2 px-1">
                                                    <Icon className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                                                    <span className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] font-medium">{cat.label}</span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    {cat.questions.map((q, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => onSend(q)}
                                                            className="w-full text-left p-3 text-xs text-white/70 rounded-xl border border-white/6 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/12 hover:text-white transition-all duration-200"
                                                        >
                                                            {q}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex gap-3 animate-in slide-in-from-bottom-2 duration-300",
                                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md",
                                    msg.role === 'user'
                                        ? "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(213,80%,50%)]"
                                        : "bg-white/8 border border-white/10"
                                )}>
                                    {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-[hsl(var(--primary))]" />}
                                </div>
                                <div className={cn(
                                    "max-w-[80%] space-y-2",
                                    msg.role === 'user' ? "items-end flex flex-col" : "items-start"
                                )}>
                                    <div className={cn(
                                        "p-4 rounded-2xl shadow-md",
                                        msg.role === 'user'
                                            ? "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(213,80%,50%)] text-white rounded-tr-md"
                                            : "bg-white/[0.06] border border-white/8 rounded-tl-md"
                                    )}>
                                        <div className="whitespace-pre-wrap leading-relaxed text-sm">
                                            {msg.content}
                                        </div>
                                    </div>

                                    {msg.role === 'assistant' && msg.thoughts && msg.thoughts.length > 0 && (
                                        <ThoughtsDisplay thoughts={msg.thoughts} />
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3 animate-in fade-in duration-300">
                                <div className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4 text-[hsl(var(--primary))]" />
                                </div>
                                <div className="bg-white/[0.06] border border-white/8 p-4 rounded-2xl rounded-tl-md flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-bounce [animation-delay:0ms]" />
                                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-bounce [animation-delay:150ms]" />
                                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-bounce [animation-delay:300ms]" />
                                    </div>
                                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Analyzing your data…</span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-white/8 bg-black/20 backdrop-blur-xl">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-2 max-w-4xl mx-auto"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your health data…"
                            disabled={isLoading}
                            className="flex-1 h-12 text-sm rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-[hsl(var(--primary))]/30"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="h-12 w-12 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(213,80%,50%)] hover:opacity-90 shadow-[0_8px_24px_rgba(115,167,255,0.2)] transition-opacity"
                            disabled={isLoading || !input.trim()}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
