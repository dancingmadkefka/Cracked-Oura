const BASE_URL = 'http://localhost:8000';

export interface AutomationStatusResponse {
    status: 'idle' | 'login_needed' | 'otp_needed' | 'logged_in' | 'exporting' | 'ready_to_download' | 'downloading' | 'completed' | 'error';
    message?: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    thoughts?: any[];
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
    getSettings: async () => {
        const res = await fetch(`${BASE_URL}/api/settings`);
        if (!res.ok) throw new Error('Failed to fetch settings');
        return res.json();
    },

    saveSettings: async (settings: { daily_sync_time: string; email?: string }) => {
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

    submitOtp: async (otp: string) => {
        const res = await fetch(`${BASE_URL}/api/automation/submit-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp })
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

    // --- Chat ---
    sendChatMessage: async (message: string, history: ChatMessage[], context?: any) => {
        const res = await fetch(`${BASE_URL}/api/advisor/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history, context })
        });
        if (!res.ok) throw new Error('Chat request failed');
        return res.json();
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
