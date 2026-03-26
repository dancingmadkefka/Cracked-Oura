import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, AlertCircle, Download, Copy, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { api, type AutomationStatusResponse, type MobileSyncSettings } from '@/lib/api';

interface SettingsPanelProps {
    onClose: () => void;
}

type AutomationStatus = AutomationStatusResponse['status'];

export function SettingsPanel({ onClose }: SettingsPanelProps) {
    const [status, setStatus] = useState<AutomationStatus>('idle');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'automation' | 'layout'>('automation');

    const [dailySyncTime, setDailySyncTime] = useState("09:00");
    const [mobileSync, setMobileSync] = useState<MobileSyncSettings | null>(null);
    const [mobileSyncEnabled, setMobileSyncEnabled] = useState(false);
    const [mobileSyncToken, setMobileSyncToken] = useState("");
    const [mobileSyncHost, setMobileSyncHost] = useState("0.0.0.0");
    const [mobileSyncPort, setMobileSyncPort] = useState("8037");
    const [mobileSyncWindowDays, setMobileSyncWindowDays] = useState("180");

    useEffect(() => {
        // Fetch settings on mount
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
    }, []);

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            await api.saveSettings({ daily_sync_time: dailySyncTime, email });
            addLog(`Settings saved: Daily sync at ${dailySyncTime}`);
        } catch (err: any) {
            setError(err?.message || 'Unknown error');
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
            addLog(regenerateToken ? "Mobile sync token regenerated." : "Mobile sync settings saved.");
        } catch (err: any) {
            setError(err?.message || 'Unknown error');
            addLog(`Error: ${err?.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleClearSession = async () => {
        if (!confirm("Are you sure you want to clear the login session? You will need to login again.")) return;

        setLoading(true);
        try {
            await api.clearSession();
            setStatus('idle');
            addLog("Session cleared.");
        } catch (err: any) {
            setError(err?.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handleStartLogin = async () => {
        setLoading(true);
        setError(null);
        addLog(`Starting login for ${email}...`);
        try {
            // Auto-save settings to persist email
            await api.saveSettings({ daily_sync_time: dailySyncTime, email });

            const data = await api.startLogin(email);
            addLog(data?.message || 'Login started');
            setStatus('otp_needed');
        } catch (err: any) {
            const errMsg = err?.message || 'Unknown error';
            setError(errMsg);
            addLog(`Error: ${errMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitOtp = async () => {
        setLoading(true);
        setError(null);
        addLog(`Submitting OTP...`);
        try {
            const data = await api.submitOtp(otp);
            addLog(data?.message || 'OTP submitted');
            setStatus('logged_in');
        } catch (err: any) {
            const errMsg = err?.message || 'Unknown error';
            setError(errMsg);
            addLog(`Error: ${errMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestExport = async () => {
        setLoading(true);
        setError(null);
        addLog(`Requesting data export...`);
        try {
            const data = await api.requestExport();
            addLog(data?.message || 'Export requested');
            setStatus('exporting');
            // Start polling
            pollStatus();
        } catch (err: any) {
            const errMsg = err?.message || 'Unknown error';
            setError(errMsg);
            addLog(`Error: ${errMsg}`);
            setLoading(false);
        }
    };

    const pollStatus = async () => {
        const interval = setInterval(async () => {
            try {
                const data = await api.checkStatus();

                if (data.status === 'completed' || data.status === 'ready_to_download') {
                    clearInterval(interval);
                    setStatus('ready_to_download');
                    setLoading(false);
                    addLog("Export ready for download!");
                } else if (data.status === 'error') {
                    clearInterval(interval);
                    setStatus('error');
                    setError("Export failed on server.");
                    setLoading(false);
                } else {
                    // Still processing
                    addLog(`Status: ${data.status}`);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 5000);
    };

    const handleDownload = async () => {
        setLoading(true);
        setError(null);
        addLog(`Downloading and ingesting data...`);
        try {
            const data = await api.downloadExport();
            addLog(data?.message || 'Download complete');
            setStatus('completed');
        } catch (err: any) {
            const errMsg = err?.message || 'Unknown error';
            setError(errMsg);
            addLog(`Error: ${errMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        addLog(`Uploading ${file.name}...`);

        try {
            const data = await api.uploadZip(file);
            addLog(data?.message || "Upload complete");
            setStatus('completed');
        } catch (err: any) {
            const errMsg = err?.message || 'Unknown error';
            setError(errMsg);
            addLog(`Error: ${errMsg}`);
        } finally {
            setLoading(false);
            // Reset input
            event.target.value = '';
        }
    };

    return (
        <div className="w-[400px] border-l bg-card flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Settings</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
                <button
                    className={cn(
                        "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'automation'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setActiveTab('automation')}
                >
                    Automation
                </button>
                <button
                    className={cn(
                        "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'layout'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setActiveTab('layout')}
                >
                    Layout
                </button>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {activeTab === 'automation' && (
                    <>
                        {/* Automation Config */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Configuration</h3>
                            <div className="space-y-2">
                                <Label>Daily Sync Time</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="time"
                                        value={dailySyncTime}
                                        onChange={e => setDailySyncTime(e.target.value)}
                                    />
                                    <Button onClick={handleSaveSettings} disabled={loading} variant="outline">
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Mobile Sync</h3>

                            <div className="rounded-lg border p-4 space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <Label>Enable Mobile API</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Starts a token-protected sync server for the Android app.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={mobileSyncEnabled}
                                        onCheckedChange={setMobileSyncEnabled}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Bind Host</Label>
                                        <Input
                                            value={mobileSyncHost}
                                            onChange={e => setMobileSyncHost(e.target.value)}
                                            placeholder="0.0.0.0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Port</Label>
                                        <Input
                                            type="number"
                                            value={mobileSyncPort}
                                            onChange={e => setMobileSyncPort(e.target.value)}
                                            placeholder="8037"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Default Sync Window (days)</Label>
                                    <Input
                                        type="number"
                                        value={mobileSyncWindowDays}
                                        onChange={e => setMobileSyncWindowDays(e.target.value)}
                                        placeholder="180"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <Label>Sync Token</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigator.clipboard.writeText(mobileSyncToken)}
                                                disabled={!mobileSyncToken}
                                            >
                                                <Copy className="mr-2 h-4 w-4" />
                                                Copy
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSaveMobileSync(true)}
                                                disabled={loading}
                                            >
                                                Regenerate
                                            </Button>
                                        </div>
                                    </div>
                                    <Input
                                        value={mobileSyncToken}
                                        onChange={e => setMobileSyncToken(e.target.value)}
                                        placeholder="Sync token"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <Button onClick={() => handleSaveMobileSync()} disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Mobile Sync Settings
                                    </Button>
                                </div>

                                <div className="space-y-2 rounded-md bg-secondary/40 p-3">
                                    <p className="text-xs font-medium">Server status</p>
                                    <p className="text-xs text-muted-foreground">
                                        {mobileSync?.server_status || "Save settings to start the mobile sync server."}
                                    </p>
                                    <p className="text-xs font-medium pt-2">Launch mode</p>
                                    <p className="text-xs font-mono break-all text-muted-foreground">
                                        {mobileSync?.run_command || "Save settings to generate the run command."}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Android server URL format: <span className="font-mono">http://&lt;pc-or-tailscale-ip&gt;:{mobileSyncPort || "8037"}</span>
                                    </p>
                                    {mobileSync?.latest_day && (
                                        <p className="text-xs text-muted-foreground">
                                            Latest local data day: {mobileSync.latest_day}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Manual Actions */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Sync Status</h3>

                            {/* Status Indicator */}
                            <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                                <div className={cn("h-2.5 w-2.5 rounded-full",
                                    status === 'completed' ? "bg-green-500" :
                                        status === 'error' ? "bg-red-500" :
                                            loading ? "bg-yellow-500 animate-pulse" : "bg-gray-500"
                                )} />
                                <span className="text-sm font-medium">
                                    {status === 'idle' && "Ready"}
                                    {status === 'login_needed' && "Login required"}
                                    {status === 'otp_needed' && "Enter OTP"}
                                    {status === 'logged_in' && "Logged in"}
                                    {status === 'exporting' && "Exporting data..."}
                                    {status === 'ready_to_download' && "Export ready"}
                                    {status === 'completed' && "Sync complete"}
                                    {status === 'error' && "Error occurred"}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {/* Login Flow */}
                                {status === 'idle' && (
                                    <div className="space-y-3 p-3 border rounded-lg">
                                        <Label>Login</Label>
                                        <Input
                                            placeholder="email@example.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                        />
                                        <Button className="w-full" onClick={handleStartLogin} disabled={!email || loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Start Login
                                        </Button>
                                    </div>
                                )}

                                {status === 'otp_needed' && (
                                    <div className="space-y-3 p-3 border rounded-lg bg-secondary/10">
                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>OTP Sent</AlertTitle>
                                            <AlertDescription>Check your email.</AlertDescription>
                                        </Alert>
                                        <Input
                                            placeholder="OTP Code"
                                            value={otp}
                                            onChange={e => setOtp(e.target.value)}
                                        />
                                        <Button className="w-full" onClick={handleSubmitOtp} disabled={!otp || loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Submit OTP
                                        </Button>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="space-y-2">
                                    <Label>Data Sync</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleRequestExport}
                                            disabled={loading || status === 'exporting'}
                                            className="h-auto py-3 flex flex-col gap-1"
                                        >
                                            <span className="font-semibold">Request New</span>
                                            <span className="text-xs font-normal text-muted-foreground">Request & Wait</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleDownload}
                                            disabled={loading}
                                            className="h-auto py-3 flex flex-col gap-1"
                                        >
                                            <span className="font-semibold">Download Latest</span>
                                            <span className="text-xs font-normal text-muted-foreground">Ingest Existing</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* Manual Import */}
                                <div className="space-y-2">
                                    <Label>Manual Upload</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="file"
                                            accept=".zip"
                                            onChange={handleFileUpload}
                                            disabled={loading}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        Upload an Oura export ZIP file manually.
                                    </p>
                                </div>
                            </div>

                            {status === 'ready_to_download' && (
                                <Alert className="bg-blue-500/10 border-blue-500/20">
                                    <Download className="h-4 w-4 text-blue-500" />
                                    <AlertTitle>Export Ready</AlertTitle>
                                    <AlertDescription>
                                        Data is ready. Click "Download Latest" to ingest.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </div>

                        {/* Logs Console */}
                        <div className="space-y-2">
                            <Label>Activity Log</Label>
                            <div className="bg-black/50 rounded-md p-3 h-32 overflow-y-auto font-mono text-xs text-muted-foreground space-y-1">
                                {logs.length === 0 && <span className="opacity-50">No activity yet...</span>}
                                {logs.map((log, i) => (
                                    <div key={i}>{log}</div>
                                ))}
                            </div>
                        </div>

                        {/* Session Management (Bottom) */}
                        <div className="pt-4 border-t space-y-4">
                            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Session</h3>
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={handleClearSession}
                                disabled={loading}
                            >
                                Clear Login Session
                            </Button>
                        </div>
                    </>
                )}

                {activeTab === 'layout' && (
                    <div className="space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Layout Actions</h3>

                        <div className="grid grid-cols-1 gap-3">
                            <Button variant="outline" onClick={() => {
                                api.getLayout()
                                    .then(data => {
                                        const layoutJson = JSON.stringify(data, null, 2);
                                        navigator.clipboard.writeText(layoutJson);
                                        addLog("Layout config copied to clipboard.");
                                    })
                                    .catch(err => {
                                        console.error("Failed to fetch layout", err);
                                    });
                            }}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Layout to Clipboard
                            </Button>

                            <div className="space-y-2">
                                <Label>Import Layout</Label>
                                <textarea
                                    placeholder="Paste layout JSON here..."
                                    className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono text-[10px]"
                                    id="import-layout-area"
                                />
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={async () => {
                                        const el = document.getElementById('import-layout-area') as HTMLTextAreaElement;
                                        if (!el || !el.value) return;

                                        try {
                                            const rawJson = JSON.parse(el.value);
                                            let payload = rawJson;

                                            // Handle case where export is wrapped in "dashboard" key
                                            if (rawJson.dashboard && rawJson.dashboard.dashboards) {
                                                payload = rawJson.dashboard;
                                            }

                                            // Validation
                                            if (!payload.dashboards && !payload.widgets) {
                                                alert("Invalid JSON: Must contain 'dashboards' or 'widgets' property.");
                                                return;
                                            }

                                            await api.saveLayout(payload);
                                            alert("Layout imported successfully! The page will reload.");
                                            window.location.reload();
                                            el.value = "";
                                        } catch (e: any) {
                                            alert("Import Failed: " + e.message);
                                        }
                                    }}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import Layout
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
