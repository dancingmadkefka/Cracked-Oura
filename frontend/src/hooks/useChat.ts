import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    thoughts?: any[];
}

export interface ChatThread {
    id: string;
    title: string;
    messages: Message[];
    createdAt: string;
}

const STORAGE_KEY = 'oura_chat_threads';

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function generateTitle(content: string): string {
    // Take first 40 chars of first message
    const cleaned = content.replace(/\n/g, ' ').trim();
    return cleaned.length > 40 ? cleaned.slice(0, 37) + '…' : cleaned;
}

export function useChat() {
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const threadsRef = useRef(threads);
    const activeIdRef = useRef(activeThreadId);

    // Keep refs in sync
    useEffect(() => { threadsRef.current = threads; }, [threads]);
    useEffect(() => { activeIdRef.current = activeThreadId; }, [activeThreadId]);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as ChatThread[];
                setThreads(parsed);
                if (parsed.length > 0) {
                    setActiveThreadId(parsed[parsed.length - 1].id);
                }
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    // Persist
    useEffect(() => {
        if (threads.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [threads]);

    // Computed active messages
    const messages = threads.find(t => t.id === activeThreadId)?.messages ?? [];

    const createThread = useCallback((): string => {
        const id = generateId();
        const newThread: ChatThread = {
            id,
            title: 'New conversation',
            messages: [],
            createdAt: new Date().toISOString(),
        };
        setThreads(prev => [...prev, newThread]);
        setActiveThreadId(id);
        return id;
    }, []);

    const deleteThread = useCallback((id: string) => {
        setThreads(prev => {
            const filtered = prev.filter(t => t.id !== id);
            return filtered;
        });
        setActiveThreadId(current => {
            if (current === id) {
                const remaining = threadsRef.current.filter(t => t.id !== id);
                return remaining.length > 0 ? remaining[remaining.length - 1].id : null;
            }
            return current;
        });
    }, []);

    const switchThread = useCallback((id: string) => {
        if (threadsRef.current.some(t => t.id === id)) {
            setActiveThreadId(id);
        }
    }, []);

    const renameThread = useCallback((id: string, title: string) => {
        setThreads(prev => prev.map(t => t.id === id ? { ...t, title } : t));
    }, []);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isLoading) return;

        // Create thread if none active
        let targetId = activeIdRef.current;
        if (!targetId) {
            const id = generateId();
            const newThread: ChatThread = {
                id,
                title: generateTitle(content.trim()),
                messages: [],
                createdAt: new Date().toISOString(),
            };
            setThreads(prev => [...prev, newThread]);
            setActiveThreadId(id);
            targetId = id;
        }

        const userMessage: Message = { role: 'user', content };
        setIsLoading(true);

        // Update thread with user message
        setThreads(prev => prev.map(t => {
            if (t.id !== targetId) return t;
            // Auto-title from first user message
            const newTitle = t.messages.length === 0 ? generateTitle(content.trim()) : t.title;
            return {
                ...t,
                title: newTitle,
                messages: [...t.messages, userMessage],
            };
        }));

        try {
            // Build history from current thread messages (pre-user-message)
            const activeThread = threadsRef.current.find(t => t.id === targetId);
            const currentHistory = activeThread?.messages ?? [];

            const data = await api.sendChatMessage(content, currentHistory);

            setThreads(prev => prev.map(t => {
                if (t.id !== targetId) return t;
                return {
                    ...t,
                    messages: [...t.messages, {
                        role: 'assistant' as const,
                        content: data.response,
                        thoughts: data.thoughts,
                    }],
                };
            }));
        } catch (error) {
            console.error("Chat error:", error);
            setThreads(prev => prev.map(t => {
                if (t.id !== targetId) return t;
                return {
                    ...t,
                    messages: [...t.messages, {
                        role: 'assistant' as const,
                        content: "Sorry, I encountered an error processing your request.",
                    }],
                };
            }));
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    const clearActiveThread = useCallback(() => {
        const id = activeIdRef.current;
        if (!id) return;
        setThreads(prev => prev.map(t =>
            t.id === id ? { ...t, messages: [] } : t
        ));
    }, []);

    return {
        threads,
        activeThreadId,
        messages,
        isLoading,
        createThread,
        deleteThread,
        switchThread,
        renameThread,
        sendMessage,
        clearActiveThread,
    };
}
