import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Download, Copy, Upload, LogOut, RefreshCw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { api, type AutomationStatusResponse, type MobileSyncSettings } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface SettingsPanelProps {
    onClose: () => void;
}

type BackendStatus = AutomationStatusResponse['status'];

interface AutomationState {
    status: BackendStatus;
    email: string;
    lastRun: string | null;
    nextRun: string | null;
    message: string | null;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
    const [automation, setAutomation] = useState<AutomationState | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');

    const [dailySyncTime, setDailySyncTime] = useState("09:00");
    const [mobileSync, setMobileSync] = useState<MobileSyncSettings | null>(null);
    const [mobileSyncEnabled, setMobileSyncEnabled] = useState(false);
    const [mobileSyncToken, setMobileSyncToken] = useState("");
    const [mobileSyncHost, setMobileSyncHost] = useState("0.0.0.0");
    const [mobileSyncPort, setMobileSyncPort] = useState("8037");
    const [mobileSyncWindowDays, setMobileSyncWindowDays] = useState("180");

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const data = await api.checkStatus();
            setAutomation({
                status: data.status,
                email: data.email || '',
                lastRun: data.last_run || null,
                nextRun: data.next_run || null,
                message: data.message || null,
            });
            if (data.email) setEmail(data.email);
        } catch (err) {
            console.error("Failed to fetch status", err);
        }
    }, []);

    // Fetch initial state on mount
    useEffect(() => {
        fetchStatus();
        api.getSettings()
            .then(data => {
                if (data.daily_sync_time) setDailySyncTime(data.daily_sync_time);
                if (data.email) setEmail(data.email);
            })
            .catch(err => console.error("Failed to fetch settings", err));

        api.getMobileSyncSettings()
            .then(data => {
                setMobileSync(data);
                setMobileSyncEnabled(data.enabled);
                setMobileSyncToken(data.token);
                setMobileSyncHost(data.bind_host);
                setMobileSyncPort(String(data.port));
                setMobileSyncWindowDays(String(data.default_window_days));
            })
            .catch(err => console.error("Failed to fetch mobile sync settings", err));

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [fetchStatus]);

    const startPolling = useCallback(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const data = await api.checkStatus();
                setAutomation(prev => prev ? {
                    ...prev,
                    status: data.status,
                    lastRun: data.last_run || prev.lastRun,
                    nextRun: data.next_run || prev.nextRun,
                    message: data.message || prev.message,
                } : null);

                if (data.status === 'completed' || data.status === 'ready_to_download') {
                    if (pollRef.current) clearInterval(pollRef.current);
                    // Auto-download when ready
                    handleAutoDownload();
                } else if (data.status === 'Idle') {
                    if (pollRef.current) clearInterval(pollRef.current);
                    setLoading(false);
                } else if (data.status === 'Error') {
                    if (pollRef.current) clearInterval(pollRef.current);
                    setError(data.message || "Sync failed");
                    setLoading(false);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 5000);
    }, []);

    const handleAutoDownload = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.downloadExport();
            setAutomation(prev => prev ? { ...prev, status: 'Idle', message: data?.message || 'Sync complete', lastRun: new Date().toISOString() } : null);
            await fetchStatus();
        } catch (err: any) {
            setError(err?.message || 'Download failed');
        } finally {
            setLoading(false);
        }
    };

    const handleStartLogin = async () => {
        if (!email.trim()) return;
        setLoading(true);
        setError(null);
        try {
            await api.saveSettings({ daily_sync_time: dailySyncTime, email });
            const data = await api.startLogin(email);
            setAutomation(prev => prev ? { ...prev, status: 'otp_needed', email, message: data?.message || null } : { status: 'otp_needed', email, lastRun: null, nextRun: null, message: data?.message || null });
        } catch (err: any) {
            setError(err?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitOtp = async () => {
        if (!otp.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const data = await api.submitOtp(otp);
            setAutomation(prev => prev ? { ...prev, status: 'logged_in', message: data?.message || null } : null);
            setOtp('');
            await fetchStatus();
        } catch (err: any) {
            setError(err?.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncNow = async () => {
        setLoading(true);
        setError(null);
        try {
            await api.requestExport();
            setAutomation(prev => prev ? { ...prev, status: 'Processing', message: 'Requesting export from Oura...' } : null);
            startPolling();
        } catch (err: any) {
            // If export request fails, try downloading existing
            const errMsg = err?.message || '';
            if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('existing')) {
                await handleAutoDownload();
            } else {
                setError(errMsg || 'Sync failed');
                setLoading(false);
            }
        }
    };

    const handleClearSession = async () => {
        setLoading(true);
        try {
            await api.clearSession();
            setAutomation({ status: 'Idle', email: '', lastRun: null, nextRun: null, message: null });
        } catch (err: any) {
            setError(err?.message || 'Failed to log out');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSchedule = async () => {
        setLoading(true);
        setError(null);
        try {
            await api.saveSettings({ daily_sync_time: dailySyncTime, email });
        } catch (err: any) {
            setError(err?.message || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const applyMobileSyncState = (data: MobileSyncSettings) => {
        setMobileSync(data);
        setMobileSyncEnabled(data.enabled);
        setMobileSyncToken(data.token);
        setMobileSyncHost(data.bind_host);
        setMobileSyncPort(String(data.port));
        setMobileSyncWindowDays(String(data.default_window_days));
    };

    const handleSaveMobileSync = async (regenerateToken = false) => {
        setLoading(true);
        setError(null);
        try {
            const normalizedToken = mobileSyncToken.trim();
            const data = await api.saveMobileSyncSettings({
                enabled: mobileSyncEnabled,
                token: regenerateToken ? undefined : normalizedToken || undefined,
                regenerate_token: regenerateToken,
                bind_host: mobileSyncHost,
                port: Number(mobileSyncPort),
                default_window_days: Number(mobileSyncWindowDays)
            });
            applyMobileSyncState(data);
        } catch (err: any) {
            setError(err?.message || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const data = await api.uploadZip(file);
            setAutomation(prev => prev ? { ...prev, status: 'Idle', message: data?.message || 'Upload complete', lastRun: new Date().toISOString() } : null);
            await fetchStatus();
        } catch (err: any) {
            setError(err?.message || 'Upload failed');
        } finally {
            setLoading(false);
            event.target.value = '';
        }
    };

    const isLoggedIn = automation?.lastRun != null;
    const isExporting = automation?.status === 'Processing' || automation?.status === 'Ingesting';
    const isWaitingForOtp = automation?.status === 'Waiting' || automation?.status === 'otp_needed';
    const isError = automation?.status === 'Error';
    const isBusy = loading || isExporting;

    return (
        <div className="w-[400px] border-l bg-card flex flex-col h-full">
            {/* Header */}
            <div className="p-5 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Settings</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 p-5 space-y-6 overflow-y-auto">
                {/* ─── Connection ─── */}
                <div className="space-y-3">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Connection</h3>

                    <div className="rounded-lg border p-4 space-y-3">
                        {/* Status line */}
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "h-2.5 w-2.5 rounded-full shrink-0",
                                isLoggedIn && !isError ? "bg-green-500" :
                                isWaitingForOtp ? "bg-yellow-500 animate-pulse" :
                                isExporting ? "bg-yellow-500 animate-pulse" :
                                isError ? "bg-red-500" :
                                "bg-gray-500"
                            )} />
                            <span className="text-sm font-medium">
                                {isLoggedIn && !isError && `Logged in as ${automation?.email}`}
                                {isWaitingForOtp && `Waiting for code`}
                                {isExporting && "Syncing..."}
                                {isError && "Something went wrong"}
                                {!isLoggedIn && !isWaitingForOtp && !isExporting && !isError && "Not logged in"}
                            </span>
                        </div>

                        {/* Last sync info */}
                        {isLoggedIn && automation?.lastRun && (
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    Last sync {formatDistanceToNow(new Date(automation.lastRun), { addSuffix: true })}
                                </span>
                                {mobileSync?.latest_day && (
                                    <span className="font-medium text-foreground">
                                        Data up to {mobileSync.latest_day}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Error message */}
                        {isError && automation?.message && (
                            <p className="text-xs text-red-500 bg-red-500/10 rounded-md px-3 py-2">{automation.message}</p>
                        )}

                        {/* Exporting message */}
                        {isExporting && automation?.message && (
                            <p className="text-xs text-muted-foreground">{automation.message}</p>
                        )}

                        {/* Login form — only when not logged in */}
                        {!isLoggedIn && !isWaitingForOtp && (
                            <div className="space-y-2 pt-1">
                                <Input
                                    placeholder="email@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                                <Button className="w-full" onClick={handleStartLogin} disabled={!email.trim() || loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Log in
                                </Button>
                            </div>
                        )}

                        {/* OTP input — only when waiting */}
                        {isWaitingForOtp && (
                            <div className="space-y-2 pt-1">
                                <p className="text-xs text-muted-foreground">
                                    Enter the code sent to <span className="font-medium text-foreground">{automation?.email}</span>
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="123456"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        disabled={loading}
                                        className="flex-1"
                                    />
                                    <Button onClick={handleSubmitOtp} disabled={!otp.trim() || loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Log out — only when logged in and idle */}
                        {isLoggedIn && !isExporting && !isWaitingForOtp && (
                            <button
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                                onClick={handleClearSession}
                                disabled={loading}
                            >
                                <LogOut className="h-3 w-3" />
                                Log out
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── Sync Data ─── */}
                <div className="space-y-3">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sync Data</h3>

                    <div className="space-y-2">
                        <Button
                            className="w-full"
                            onClick={handleSyncNow}
                            disabled={isBusy || isWaitingForOtp}
                        >
                            {isBusy
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing...</>
                                : <><RefreshCw className="mr-2 h-4 w-4" /> Sync now</>
                            }
                        </Button>
                        <p className="text-[10px] text-muted-foreground text-center">
                            Requests fresh data from Oura and ingests it
                        </p>
                    </div>

                    {automation?.nextRun && (
                        <p className="text-xs text-muted-foreground">
                            Next auto-sync: {formatDistanceToNow(new Date(automation.nextRun), { addSuffix: true })}
                        </p>
                    )}

                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Or upload a ZIP manually</Label>
                        <div className="flex gap-2">
                            <Input
                                type="file"
                                accept=".zip"
                                onChange={handleFileUpload}
                                disabled={loading}
                                className="cursor-pointer flex-1 text-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* ─── Schedule ─── */}
                <div className="space-y-3">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Schedule</h3>
                    <div className="flex items-center gap-3">
                        <Label className="text-sm shrink-0">Auto-sync daily at</Label>
                        <Input
                            type="time"
                            value={dailySyncTime}
                            onChange={e => setDailySyncTime(e.target.value)}
                            className="w-32"
                        />
                        <Button onClick={handleSaveSchedule} disabled={loading} variant="outline" size="sm">
                            Save
                        </Button>
                    </div>
                </div>

                {/* ─── Mobile App ─── */}
                <div className="space-y-3">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mobile App</h3>

                    <div className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <Label>Enable Mobile API</Label>
                            <Switch
                                checked={mobileSyncEnabled}
                                onCheckedChange={setMobileSyncEnabled}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-xs">Bind Host</Label>
                                <Input
                                    value={mobileSyncHost}
                                    onChange={e => setMobileSyncHost(e.target.value)}
                                    placeholder="0.0.0.0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Port</Label>
                                <Input
                                    type="number"
                                    value={mobileSyncPort}
                                    onChange={e => setMobileSyncPort(e.target.value)}
                                    placeholder="8037"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">Sync Window (days)</Label>
                            <Input
                                type="number"
                                value={mobileSyncWindowDays}
                                onChange={e => setMobileSyncWindowDays(e.target.value)}
                                placeholder="180"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <Label className="text-xs">Sync Token</Label>
                                <div className="flex gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigator.clipboard.writeText(mobileSyncToken)}
                                        disabled={!mobileSyncToken}
                                    >
                                        <Copy className="mr-1 h-3 w-3" />
                                        Copy
                                    </Button>
                                </div>
                            </div>
                            <Input
                                value={mobileSyncToken}
                                onChange={e => setMobileSyncToken(e.target.value)}
                                placeholder="Sync token"
                            />
                        </div>

                        <Button onClick={() => handleSaveMobileSync()} disabled={loading} size="sm">
                            {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            Save
                        </Button>

                        {mobileSync?.server_status && (
                            <p className="text-xs text-muted-foreground rounded-md bg-secondary/40 p-2">
                                {mobileSync.server_status}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground font-mono">
                            http://&lt;pc-or-tailscale-ip&gt;:{mobileSyncPort || "8037"}
                        </p>
                    </div>
                </div>

                {/* ─── Layout (collapsed, at bottom) ─── */}
                <div className="space-y-3 pt-4 border-t">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Layout</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                api.getLayout()
                                    .then(data => navigator.clipboard.writeText(JSON.stringify(data, null, 2)))
                                    .catch(err => console.error("Failed to fetch layout", err));
                            }}
                        >
                            <Copy className="mr-2 h-3 w-3" />
                            Copy Layout JSON
                        </Button>
                        <Input
                            type="file"
                            accept=".json"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                    const text = await file.text();
                                    const raw = JSON.parse(text);
                                    let payload = raw.dashboard?.dashboards ? raw.dashboard : raw;
                                    if (!payload.dashboards && !payload.widgets) {
                                        setError("Invalid layout file");
                                        return;
                                    }
                                    await api.saveLayout(payload);
                                    window.location.reload();
                                } catch (err: any) {
                                    setError("Failed to import: " + err.message);
                                }
                                e.target.value = '';
                            }}
                            className="cursor-pointer text-xs"
                        />
                    </div>
                </div>

                {/* Error toast */}
                {error && !isError && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
