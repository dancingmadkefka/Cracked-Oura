import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Trash2, Sparkles, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/hooks/useChat';
import { ThoughtsDisplay } from '@/components/dashboard/ThoughtsDisplay';
import { useDashboard } from '@/contexts/DashboardContext';
import { format } from 'date-fns';

interface AIAnalystViewProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (message: string) => void;
  onClear: () => void;
}

const SUGGESTION_PROMPTS = [
  { icon: CalendarDays, text: 'Summarize this day', prompt: 'Summarize my health data for {date}' },
  { icon: Sparkles, text: 'Why was my sleep low?', prompt: 'Why was my sleep score low on {date}?' },
  { icon: Sparkles, text: 'Compare readiness to 30 days', prompt: 'Compare my readiness score to the last 30 days' },
  { icon: Sparkles, text: 'What to watch this week?', prompt: 'What health patterns should I watch this week?' },
];

export function AIAnalystView({ messages, isLoading, onSend, onClear }: AIAnalystViewProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { selectedDate } = useDashboard();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  const handleSuggestion = (promptTemplate: string) => {
    const prompt = promptTemplate.replace('{date}', format(selectedDate, 'MMMM d, yyyy'));
    onSend(prompt);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-['Space_Grotesk',sans-serif] text-xl font-semibold text-white/95">AI Analyst</h1>
            <p className="text-xs text-white/40">Your local health data analyst</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="gap-2 border-white/[0.08] bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/80"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="py-8 space-y-6">
                <div className="max-w-lg mx-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-white/30">Quick setup</p>
                  <p className="text-xs text-white/40">
                    Configure your AI endpoint in Settings to enable local LLM analysis.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {SUGGESTION_PROMPTS.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSuggestion(s.prompt)}
                        className="flex items-center gap-2.5 p-3 text-left text-xs text-white/60 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:text-white/90 transition-all"
                      >
                        <Icon className="h-3.5 w-3.5 text-white/30 shrink-0" />
                        {s.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-violet-500 to-indigo-600'
                    : 'bg-white/[0.06] border border-white/[0.08]'
                )}>
                  {msg.role === 'user' ? <User className="h-3.5 w-3.5 text-white" /> : <Bot className="h-3.5 w-3.5 text-violet-400" />}
                </div>
                <div className={cn('max-w-[80%] space-y-2', msg.role === 'user' ? 'items-end flex flex-col' : 'items-start')}>
                  <div className={cn(
                    'p-3 rounded-xl text-sm',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
                      : 'bg-white/[0.04] border border-white/[0.06] text-white/80'
                  )}>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  </div>
                  {msg.role === 'assistant' && msg.thoughts && msg.thoughts.length > 0 && (
                    <ThoughtsDisplay thoughts={msg.thoughts} />
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-violet-400" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.06] p-3 rounded-xl flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="text-xs text-white/30">Analyzing...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/[0.06]">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your health data..."
              disabled={isLoading}
              className="flex-1 h-10 text-sm rounded-xl border-white/[0.08] bg-white/[0.04] text-white/80 placeholder:text-white/25"
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 hover:opacity-90"
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
