const BASE_URL = 'http://localhost:8000';

export interface AutomationStatusResponse {
    status: string;
    message?: string;
    logged_in?: boolean;
    email?: string;
    last_run?: string | null;
    next_run?: string | null;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    thoughts?: any[];
    created_at?: string;
}

export interface ChatThread {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface ChatThreadWithMessages extends ChatThread {
    messages: ChatMessage[];
}

export interface MobileSyncSettings {
    enabled: boolean;
    token: string;
    default_window_days: number;
    bind_host: string;
    port: number;
    latest_day?: string | null;
    has_data: boolean;
    run_command: string;
    server_running: boolean;
    server_status: string;
}

export const api = {
    // --- Settings & Automation ---
    getSettings: async (): Promise<{ daily_sync_time: string; email: string; llm_model: string; llm_host: string; llm_api_key: string }> => {
        const res = await fetch(`${BASE_URL}/api/settings`);
        if (!res.ok) throw new Error('Failed to fetch settings');
        return res.json();
    },

    saveSettings: async (settings: { daily_sync_time: string; email?: string; llm_model?: string; llm_host?: string; llm_api_key?: string }) => {
        const res = await fetch(`${BASE_URL}/api/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        if (!res.ok) throw new Error('Failed to save settings');
        return res.json();
    },

    getMobileSyncSettings: async (): Promise<MobileSyncSettings> => {
        const res = await fetch(`${BASE_URL}/api/mobile/settings`);
        if (!res.ok) throw new Error('Failed to fetch mobile sync settings');
        return res.json();
    },

    saveMobileSyncSettings: async (settings: {
        enabled?: boolean;
        token?: string;
        regenerate_token?: boolean;
        default_window_days?: number;
        bind_host?: string;
        port?: number;
    }): Promise<MobileSyncSettings> => {
        const res = await fetch(`${BASE_URL}/api/mobile/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to save mobile sync settings');
        return data;
    },

    clearSession: async () => {
        const res = await fetch(`${BASE_URL}/api/automation/clear-session`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to clear session');
        return res.json();
    },

    startLogin: async (email: string) => {
        const res = await fetch(`${BASE_URL}/api/automation/start-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Login failed');
        return data;
    },

    submitOtp: async (otp: string, action: 'test' | 'run' | 'download' = 'test') => {
        const res = await fetch(`${BASE_URL}/api/automation/submit-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp, action })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'OTP failed');
        return data;
    },

    requestExport: async () => {
        const res = await fetch(`${BASE_URL}/api/automation/request-export`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Export request failed');
        return data;
    },

    checkStatus: async (): Promise<AutomationStatusResponse> => {
        const res = await fetch(`${BASE_URL}/api/automation/check-status`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to check status');
        return res.json();
    },

    downloadExport: async () => {
        const res = await fetch(`${BASE_URL}/api/automation/download`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Download failed');
        return data;
    },

    uploadZip: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${BASE_URL}/api/ingest/zip`, {
            method: 'POST',
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Upload failed');
        return data;
    },

    // --- Dashboard Data ---
    getDailyData: async (date: string) => {
        const res = await fetch(`${BASE_URL}/api/days/${date}`);
        if (!res.ok) throw new Error('Failed to fetch daily data');
        return res.json();
    },

    getQuery: async (path: string, startDate?: string, endDate?: string) => {
        const params = new URLSearchParams({ path });
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const res = await fetch(`${BASE_URL}/api/query?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch query data');
        return res.json();
    },

    getSchema: async () => {
        const res = await fetch(`${BASE_URL}/api/schema`);
        if (!res.ok) throw new Error('Failed to fetch schema');
        return res.json();
    },

    getTrends: async (metric: string, startDate: string, endDate: string) => {
        return api.getQuery(metric, startDate, endDate);
    },

    // --- Layout ---
    getLayout: async () => {
        const res = await fetch(`${BASE_URL}/api/dashboard`);
        if (!res.ok) throw new Error('Failed to fetch layout');
        return res.json();
    },

    saveLayout: async (layout: any) => {
        const res = await fetch(`${BASE_URL}/api/dashboard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(layout)
        });
        if (!res.ok) throw new Error('Failed to save layout');
        return res.json();
    },

    // --- Chat Threads ---
    getThreads: async (): Promise<ChatThread[]> => {
        const res = await fetch(`${BASE_URL}/api/chat/threads`);
        if (!res.ok) throw new Error('Failed to fetch chat threads');
        return res.json();
    },

    getThread: async (id: string): Promise<ChatThreadWithMessages> => {
        const res = await fetch(`${BASE_URL}/api/chat/threads/${id}`);
        if (!res.ok) throw new Error('Failed to fetch chat thread');
        return res.json();
    },

    createThread: async (title?: string): Promise<ChatThread> => {
        const res = await fetch(`${BASE_URL}/api/chat/threads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        if (!res.ok) throw new Error('Failed to create chat thread');
        return res.json();
    },

    deleteThread: async (id: string): Promise<void> => {
        const res = await fetch(`${BASE_URL}/api/chat/threads/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete chat thread');
    },

    appendMessageToThread: async (threadId: string, role: string, content: string, thoughts?: any[]): Promise<void> => {
        const res = await fetch(`${BASE_URL}/api/chat/threads/${threadId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, content, thoughts })
        });
        if (!res.ok) throw new Error('Failed to append message to thread');
    },

    // --- Chat ---
    sendChatMessageStream: async (
        message: string,
        threadId: string | null,
        onChunk: (chunk: any) => void,
        signal?: AbortSignal
    ): Promise<void> => {
        const res = await fetch(`${BASE_URL}/api/advisor/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, thread_id: threadId }),
            signal
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => 'Chat request failed');
            throw new Error(errText || 'Chat request failed');
        }

        if (!res.body) {
            throw new Error('ReadableStream not supported by browser or response has empty body');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // Save last incomplete line back to buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const chunk = JSON.parse(line);
                            onChunk(chunk);
                        } catch (e) {
                            console.error('Failed to parse line-delimited JSON stream chunk:', e, line);
                        }
                    }
                }
            }

            // Parse final buffer if any
            if (buffer.trim()) {
                try {
                    const chunk = JSON.parse(buffer);
                    onChunk(chunk);
                } catch (e) {
                    console.error('Failed to parse final chunk:', e, buffer);
                }
            }
        } finally {
            reader.releaseLock();
        }
    },

    // --- Connection Health ---
    healthCheck: async (): Promise<boolean> => {
        try {
            const res = await fetch(`${BASE_URL}/api/settings`, { method: 'GET' });
            return res.ok;
        } catch {
            return false;
        }
    },

    getSyncStatus: async (): Promise<{
        status: string;
        last_run: string | null;
        next_run: string | null;
        [key: string]: any;
    }> => {
        const res = await fetch(`${BASE_URL}/api/automation/check-status`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to fetch sync status');
        return res.json();
    },
};
