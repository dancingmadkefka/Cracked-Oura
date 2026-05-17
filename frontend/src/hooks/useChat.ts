import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    thoughts?: any[];
}

const STORAGE_KEY = 'oura_chat_history';

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesRef = useRef(messages);

    // Keep ref in sync so sendMessage always sees latest messages
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Use ref to get the latest messages, avoiding stale closure
            const currentHistory = messagesRef.current;
            const data = await api.sendChatMessage(content, currentHistory);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response,
                thoughts: data.thoughts,
            }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Sorry, I encountered an error processing your request.",
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    const clearHistory = useCallback(() => {
        setMessages([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return { messages, isLoading, sendMessage, clearHistory };
}
