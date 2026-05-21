import { useState, useEffect, useCallback, useRef } from 'react';
import { api, ChatMessage, ChatThread } from '@/lib/api';

// Re-export types for backward compatibility with consumers that import from this module
export type { ChatMessage, ChatThread };
export type Message = ChatMessage;

const STORAGE_KEY = 'oura_chat_threads';

export function useChat() {
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const activeRequestThreadIdRef = useRef<string | null>(null);

    // One-time localStorage migration & Initial Load
    useEffect(() => {
        const initializeChat = async () => {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setIsMigrating(true);
                try {
                    const parsed = JSON.parse(saved) as any[];
                    // Migrate threads one by one
                    for (const oldThread of parsed) {
                        try {
                            const newThread = await api.createThread(oldThread.title || oldThread.id);
                            if (oldThread.messages && Array.isArray(oldThread.messages)) {
                                for (const msg of oldThread.messages) {
                                    await api.appendMessageToThread(
                                        newThread.id,
                                        msg.role,
                                        msg.content,
                                        msg.thoughts
                                    );
                                }
                            }
                        } catch (e) {
                            console.error('Failed to migrate thread:', oldThread, e);
                        }
                    }
                    localStorage.removeItem(STORAGE_KEY);
                } catch (e) {
                    console.error('Failed to parse localStorage chat history:', e);
                    localStorage.removeItem(STORAGE_KEY);
                } finally {
                    setIsMigrating(false);
                }
            }

            // Load threads from database
            try {
                const dbThreads = await api.getThreads();
                setThreads(dbThreads);
                if (dbThreads.length > 0) {
                    // Set active thread to the most recently updated one
                    setActiveThreadId(dbThreads[0].id);
                }
            } catch (e) {
                console.error('Failed to fetch threads:', e);
            }
        };

        initializeChat();
    }, []);

    // Load messages when activeThreadId changes
    useEffect(() => {
        if (!activeThreadId) {
            setMessages([]);
            return;
        }

        // Prevent redundant loads if this thread ID is already the one being processed
        // (e.g. just created by sendMessage)
        if (activeRequestThreadIdRef.current === activeThreadId) {
            return;
        }

        activeRequestThreadIdRef.current = activeThreadId;
        const fetchMessages = async () => {
            try {
                const threadData = await api.getThread(activeThreadId);
                // Prevent race conditions: check if this is still the active request
                if (activeRequestThreadIdRef.current === activeThreadId) {
                    setMessages(threadData.messages || []);
                }
            } catch (e) {
                console.error(`Failed to fetch messages for thread ${activeThreadId}:`, e);
            }
        };

        fetchMessages();
    }, [activeThreadId]);

    const createThread = useCallback(async (title?: string): Promise<string> => {
        try {
            const newThread = await api.createThread(title);
            setThreads(prev => [newThread, ...prev]);
            setActiveThreadId(newThread.id);
            setMessages([]);
            return newThread.id;
        } catch (e) {
            console.error('Failed to create thread:', e);
            throw e;
        }
    }, []);

    const deleteThread = useCallback(async (id: string) => {
        try {
            await api.deleteThread(id);
            
            // Update threads list
            setThreads(prev => {
                const filtered = prev.filter(t => t.id !== id);
                
                // If the deleted thread was active, switch to the next available one
                if (activeThreadId === id) {
                    if (filtered.length > 0) {
                        // Switch active thread in next tick to allow state updates
                        setTimeout(() => setActiveThreadId(filtered[0].id), 0);
                    } else {
                        setTimeout(() => setActiveThreadId(null), 0);
                    }
                }
                
                return filtered;
            });
        } catch (e) {
            console.error(`Failed to delete thread ${id}:`, e);
        }
    }, [activeThreadId]);

    const switchThread = useCallback((id: string) => {
        setActiveThreadId(id);
    }, []);

    const renameThread = useCallback((id: string, title: string) => {
        // Renaming in list immediately for nice UX
        setThreads(prev => prev.map(t => t.id === id ? { ...t, title } : t));
    }, []);

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
            
            // Append a notice to the last message that generation was canceled
            setMessages(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                if (last.role === 'assistant') {
                    return [
                        ...prev.slice(0, -1),
                        {
                            ...last,
                            content: last.content + '\n\n*(Generation stopped by user)*'
                        }
                    ];
                }
                return prev;
            });
        }
    }, []);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isLoading) return;

        let currentThreadId = activeThreadId;
        setIsLoading(true);

        // Cancel any pending generation first
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        // If no active thread, we start a new one database-side implicitly
        if (!currentThreadId) {
            try {
                // We create a temporary thread ID so the user sees progress immediately
                // The actual thread ID will be received from the streaming endpoint
                setMessages([{ role: 'user', content }]);
            } catch (e) {
                console.error('Failed to pre-create thread for sending message:', e);
                setIsLoading(false);
                return;
            }
        } else {
            // Append user message to active thread list immediately
            setMessages(prev => [...prev, { role: 'user', content }]);
        }

        // Add dummy assistant message for token appending
        setMessages(prev => [
            ...prev,
            { role: 'assistant', content: '', thoughts: [] }
        ]);

        try {
            await api.sendChatMessageStream(
                content,
                currentThreadId,
                (chunk) => {
                    if (chunk.type === 'thread_info') {
                        // Received actual thread ID (especially for new threads)
                        const receivedId = chunk.thread_id;
                        if (!currentThreadId) {
                            currentThreadId = receivedId;
                            activeRequestThreadIdRef.current = receivedId;
                            setActiveThreadId(receivedId);
                            // Prepend the new thread metadata to the side list
                            const newMetadata: ChatThread = {
                                id: receivedId,
                                title: chunk.title,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            };
                            setThreads(prev => [newMetadata, ...prev]);
                        } else {
                            // Update existing thread title if changed
                            setThreads(prev => prev.map(t => 
                                t.id === currentThreadId ? { ...t, title: chunk.title } : t
                            ));
                        }
                    } else if (chunk.type === 'thought') {
                        // Append thought to the assistant message
                        setMessages(prev => {
                            if (prev.length === 0) return prev;
                            const lastMsg = prev[prev.length - 1];
                            if (lastMsg.role === 'assistant') {
                                const currentThoughts = lastMsg.thoughts || [];
                                return [
                                    ...prev.slice(0, -1),
                                    {
                                        ...lastMsg,
                                        thoughts: [...currentThoughts, chunk.thought]
                                    }
                                ];
                            }
                            return prev;
                        });
                    } else if (chunk.type === 'token') {
                        // Append text token to assistant message content
                        setMessages(prev => {
                            if (prev.length === 0) return prev;
                            const lastMsg = prev[prev.length - 1];
                            if (lastMsg.role === 'assistant') {
                                return [
                                    ...prev.slice(0, -1),
                                    {
                                        ...lastMsg,
                                        content: lastMsg.content + chunk.content
                                    }
                                ];
                            }
                            return prev;
                        });
                    } else if (chunk.type === 'done') {
                        // Generation finalized
                        setMessages(prev => {
                            if (prev.length === 0) return prev;
                            const lastMsg = prev[prev.length - 1];
                            if (lastMsg.role === 'assistant') {
                                return [
                                    ...prev.slice(0, -1),
                                    {
                                        ...lastMsg,
                                        content: chunk.response || lastMsg.content,
                                        thoughts: chunk.thoughts || lastMsg.thoughts
                                    }
                                ];
                            }
                            return prev;
                        });

                        // Refresh threads list to update order and title
                        api.getThreads().then(dbThreads => {
                            setThreads(dbThreads);
                        }).catch(e => console.error('Failed to reload threads list:', e));
                    } else if (chunk.type === 'error') {
                        throw new Error(chunk.message || 'Stream processing error');
                    }
                },
                controller.signal
            );
        } catch (error: any) {
            // Do not show errors if user intentionally cancelled
            if (error.name === 'AbortError') {
                console.log('User cancelled stream');
                return;
            }
            console.error("Chat error:", error);
            setMessages(prev => {
                if (prev.length === 0) return prev;
                const lastMsg = prev[prev.length - 1];
                if (lastMsg.role === 'assistant') {
                    return [
                        ...prev.slice(0, -1),
                        {
                            role: 'assistant',
                            content: `*(Error: ${error.message || 'Sorry, I encountered an error processing your request.'})*`,
                            thoughts: lastMsg.thoughts
                        }
                    ];
                }
                return prev;
            });
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [activeThreadId, isLoading]);

    const clearActiveThread = useCallback(() => {
        setMessages([]);
        setActiveThreadId(null);
    }, []);

    return {
        threads,
        activeThreadId,
        messages,
        isLoading,
        isMigrating,
        createThread,
        deleteThread,
        switchThread,
        renameThread,
        sendMessage,
        stopGeneration,
        clearActiveThread,
    };
}
