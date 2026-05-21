# Android Mobile Sync

This repo now contains a native Android client in [`android-mobile/`](../android-mobile) and a small authenticated sync API on the desktop/backend side.

## What Syncs

The mobile sync API returns a compact snapshot built from the existing SQLite database:

- Daily sleep, readiness, and activity summaries
- Primary sleep-session details for each day
- Aggregated all-session sleep totals per day, including nap or short-session duration when present
- Activity target context such as calorie or distance targets and remaining distance to target
- Recovery/stress minute splits and readiness day summaries when present
- Resilience and cardiovascular age when present
- Recent workouts inside the synced window

The Android app stores that snapshot locally in Room so the latest synced data remains available offline.

## Mobile UX Improvements

The native Android app now includes:

- A stronger `Overview` briefing screen with derived insight cards and a tappable recent-day timeline
- A real `Trends` explorer with:
  - metric-family filters
  - metric tabs with explicit units
  - selectable time windows (`7d`, `30d`, `90d`, `180d`)
  - an interactive chart with visible range, average, and selected-day context
  - a direct jump from a chart day into a dedicated day-detail screen
- A dedicated day-detail screen that keeps scores, durations, targets, HR markers, temperature, and workouts together for one date
- Clearer empty states and sync-state messaging so the app makes it obvious whether it needs setup, a sync, or just more history

## Derived Metrics

The mobile app now computes several useful local-only summaries from the synced cache:

- `Sleep debt` approximation
- `Activity goal progress` from available calorie or distance target data
- `HRV vs 14-day baseline`
- `Resting HR vs 14-day baseline`
- `Recovery share` from synced recovery/stress minutes

### Sleep Debt Approximation

Exact Oura sleep-need internals are not exported, so the Android app is explicit that this is an approximation.

Current implementation:

- Uses total sleep per day across all synced sleep sessions when available
- Includes nap or short sleep duration in that total
- Requires at least `5` sleep days inside the last `14` days before showing a sleep-need estimate
- Estimates personal sleep need as the rolling `14-day median` of total sleep duration
- Estimates sleep debt as the positive cumulative difference between estimated need and actual sleep across the rolling `14-day` window

This is intentionally documented in the UI so users are not misled into thinking it is exact Oura parity.

## Configure Desktop Sync

1. Start the existing desktop app/backend as usual.
2. Open `Settings` in the desktop UI.
3. In the new `Mobile Sync` section:
   - Enable the mobile API
   - Set the bind host and port
   - Generate or regenerate a sync token
   - Save the settings
4. Copy the token for the Android app.

The desktop settings panel also shows the latest local Oura day and the command to run the sync server from the repo checkout.

## Run the PC-side Sync Server

From the repo root:

```powershell
.\backend\venv\Scripts\python.exe -m backend.src.mobile_server --host 0.0.0.0 --port 8037
```

Notes:

- `0.0.0.0` lets the phone reach the server over LAN or Tailscale.
- The port should match what you configured in the desktop settings panel.
- The API is token-protected. Mobile requests must send `X-Cracked-Oura-Token`.

### Mobile API Surface

- `GET /api/mobile/ping`
- `GET /api/mobile/sync?window_days=180`

Both endpoints require the sync token header.

## Build and Run the Android App

The Android project lives in [`android-mobile/`](../android-mobile).

1. Install the Android SDK locally.
2. Create `android-mobile/local.properties` on your machine with your SDK path, for example:

```properties
sdk.dir=C\:\\Users\\your-user\\AppData\\Local\\Android\\Sdk
```

Do not commit `local.properties`.

3. Open `android-mobile` in Android Studio, or build from PowerShell:

```powershell
cd android-mobile
.\gradlew.bat assembleDebug
```

The debug APK is written to:

```text
android-mobile/app/build/outputs/apk/debug/app-debug.apk
```

To install it on a connected Android device or emulator:

```powershell
cd android-mobile
adb install -r .\app\build\outputs\apk\debug\app-debug.apk
```

4. Launch the app on a device or emulator.
5. In the app `Settings` screen, enter:
   - Server URL, for example `http://100.x.y.z:8037`
   - Sync token from the desktop app
   - Desired sync window in days
6. Tap `Save and sync now`.

## Using Tailscale

Tailscale is the easiest way to reach the PC when the phone is away from home.

1. Install Tailscale on the PC and the Android phone.
2. Sign both devices into the same tailnet.
3. Start the sync server on the PC with `--host 0.0.0.0`.
4. Find the PC's Tailscale IP address.
5. In the Android app, use `http://<pc-tailscale-ip>:8037` as the server URL.

If the phone cannot connect:

- Confirm the server is still running on the PC
- Confirm the desktop mobile sync section is enabled and has a token
- Confirm the token in the phone matches the desktop token
- Confirm the chosen port is reachable through local firewall rules

## Sync Failure Diagnostics

When a sync attempt fails the Android app now reports the precise cause for each
configured server address. The `Settings` screen renders a `Last error` line
followed by a bullet per attempted URL, for example:

- `100.x.y.z:8037 refused the connection. Nothing is listening on that host:port.`
- `192.168.178.25:8037 did not respond before the timeout. The address is unreachable from this network.`

In `Auto-detect` mode both the LAN and Tailscale addresses are tried, in
fastest-reachable-first order. Terminal failures (`401`, `403`, `404`, `503`,
TLS, invalid URL) stop the retry loop because they apply equally to every URL.
The classified reasons (`DnsFailure`, `ConnectionRefused`, `ConnectionTimeout`,
`NoRouteToHost`, `TokenRejected`, `EndpointMissing`, `ServerNotEnabled`,
`SslFailure`, `ServerError`, `NetworkError`) are also written to logcat under
the `Repository` tag for `adb logcat` debugging.

## Android App Behavior

The Android app currently includes:

- A configuration screen for server URL, token, and sync window
- A manual sync action against the desktop server
- Local persistence with Room and DataStore
- Offline overview, trend exploration, and per-day detail screens
- Local derived insights such as sleep debt, activity goal progress, and rolling baseline deltas

## Follow-ups / Known Limits

- Sync is snapshot-based, not row-level incremental replication.
- The mobile client still syncs summary data and workouts, not the full high-frequency heart-rate or temperature streams.
- Background or scheduled sync is not implemented yet; sync is manual.
- Sleep debt is an explicit approximation because Oura's exact personal sleep-need model is not present in exported data.
- The Android project builds with Gradle wrapper, but an installed Android SDK and local `sdk.dir` are still required on each machine.
