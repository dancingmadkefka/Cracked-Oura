# Issue: Backend Login Fails with Empty Error After UI Redesign

**Date:** 2026-05-18
**Severity:** High
**Component:** Backend (`backend/src/automation.py`, `backend/src/api/routes.py`)
**Reporter:** UI Redesign Session

## Summary

The Oura login flow via the Settings panel is broken. Clicking "Log in" shows "Login failed" at the bottom of the Settings panel. A second click shows the OTP input field but the OTP submission also fails. The backend returns HTTP 500 with an empty `detail` field.

This was discovered after the UI redesign session. The UI code for login was **not modified** — only `SettingsPanel.tsx` styling was adjusted (glass-morphism classes). The login button, API calls, and state management are unchanged.

## Reproduction

1. Open Settings panel (gear icon in sidebar)
2. Enter email: `henderson.daniel10@yahoo.com`
3. Click "Log in"
4. **Result:** "Login failed" toast appears at bottom of panel. No OTP email received.
5. Click "Log in" again
6. **Result:** OTP input field appears (backend returned `otp_required` on second call due to `_login_in_progress` flag)
7. Enter any OTP code, click "Submit"
8. **Result:** "Invalid code" or similar error

## API Evidence

### First call (fresh state):
```
POST /api/automation/start-login
Body: {"email":"henderson.daniel10@yahoo.com"}
Response: 500 {"detail": ""}
```

### Second call (login in progress):
```
POST /api/automation/start-login
Response: 200 {"status":"otp_required","message":"Login already in progress. Check your email for the code."}
```

### Clear session:
```
POST /api/automation/clear-session
Response: 200 {"status":"info","message":"No session found to clear."}
```

### After clear, fresh call:
```
POST /api/automation/start-login
Response: 500 {"detail": ""}
```

## Root Cause Analysis

The backend's `OuraAutomator.start_login()` in `backend/src/automation.py:122` is raising an exception with an empty message. The route handler at `backend/src/api/routes.py:200` catches it and returns `HTTPException(status_code=500, detail=str(e))`, but `str(e)` is empty.

Likely causes:
1. **Playwright browser corrupted** — The bundled Chromium browser may have been invalidated by the electron-builder rebuild. The app packages a PyInstaller-built `backend.exe` which bundles Playwright's Chromium. If the browser binaries are mismatched or corrupted, Playwright fails silently.
2. **Session state file corruption** — `backend/src/automation.py:153` references `self.storage_state_path`. If this file exists but is corrupted, `context.storage_state()` or `browser.new_context()` may fail.
3. **Playwright driver mismatch** — The PyInstaller bundle may have bundled a different Playwright version than what the venv has, causing driver/browser version mismatch.
4. **Oura login page changed** — Oura may have updated their login flow, breaking the selectors in `_perform_login_actions()` (line 214: `input[name='username']`).

## What Was NOT Changed

The UI redesign did **not** modify:
- `backend/src/automation.py`
- `backend/src/api/routes.py`
- `backend/src/api/main.py`
- `frontend/src/lib/api.ts` (login methods unchanged)
- `frontend/src/hooks/useChat.ts`
- Any auth/session logic

Only changes were:
- `SettingsPanel.tsx` — CSS class updates for glass-morphism styling
- `index.css` — New glass utility classes
- Shell replacement (`MainLayout` → `AppShell`)

## Resolution

**Date:** 2026-05-18
**Fixed by:** Debug session
**Root cause:** Stale Playwright browser installation directory with empty skeleton files.

### Root Cause (Detailed)

The `OuraAutomator.__init__()` sets `PLAYWRIGHT_BROWSERS_PATH` to a custom directory:
```
C:\Users\daniel\AppData\Roaming\CrackedOura\browsers
```

This path contained stale versioned subdirectories (e.g., `chromium_headless_shell-1208/` and `chromium-1208/`) from a previous Playwright installation. These directories had only marker files (`INSTALLATION_COMPLETE`, `DEPENDENCIES_VALIDATED`) and an empty browser executable directory — the actual `chrome-headless-shell.exe` was missing.

The old `_ensure_browser_installed()` check:
```python
if not force and os.path.exists(self.browser_dir) and os.listdir(self.browser_dir):
    return
```
This checked **whether any files exist** in the browser dir at all. Since the empty skeleton directories existed, it returned without installing. The subsequent `chromium.launch()` call failed because the executable didn't exist at the custom path.

When the launch failed, `initialize()` caught the error and called `_ensure_browser_installed(force=True)`, which attempted to install Chromium via the internal Playwright driver CLI. However, if this subprocess install also failed (or the `compute_driver_executable()` / `get_driver_env()` approach had issues), the exception propagated up uncaught with an empty message.

### Changes Made

#### 1. `backend/src/automation.py` — `_ensure_browser_installed()` hardened

Instead of checking if the directory has **any** contents, the method now globs for the actual browser executable file:
```python
headless_exes = glob.glob(os.path.join(self.browser_dir, "chromium_headless_shell-*",
                                        "chrome-headless-shell-win64", "chrome-headless-shell.exe"))
chrome_exes = glob.glob(os.path.join(self.browser_dir, "chromium-*",
                                      "chrome-win64", "chrome.exe"))
if headless_exes or chrome_exes:
    return
```
This prevents false positives from stale empty skeleton directories.

#### 2. `backend/src/automation.py` — `initialize()` retry improved

The inner retry block now has its own `try/except` with a descriptive error message:
```python
try:
    self.browser = await self.playwright.chromium.launch(...)
except Exception as e2:
    logger.error(f"Browser launch still failed after reinstall: {e2}", exc_info=True)
    raise Exception(f"Browser launch failed after reinstall: {e2}") from e2
```

#### 3. `backend/src/automation.py` — `_ensure_browser_installed()` in `initialize()` wrapped

The call in `initialize()` is now wrapped in a try/except to ensure errors are logged with full context:
```python
try:
    await self._ensure_browser_installed()
except Exception as e:
    logger.error(f"Browser installation check failed: {e}", exc_info=True)
    raise Exception(f"Failed to ensure Playwright browser is installed: {e}")
```

#### 4. `backend/src/automation.py` — Duplicate login restart instead of stale message

When `start_login()` is called while `_login_in_progress` is `True` (e.g., after a failed first attempt left the flag set), the old code returned a stale "already in progress" message without actually clicking "Send code" again — meaning no email was dispatched. The new code cleans up the existing session and restarts fresh:
```python
if self._login_in_progress:
    logger.warning("Login already in progress — cleaning up and restarting.")
    await self.cleanup()
    self._login_in_progress = False
```

#### 5. `backend/src/automation.py` — `_is_logged_in()` relaxed for Oura's redirect chain

After successful OTP, Oura redirects through: `enter-otp` → `oauth-authorize` → `membership.ouraring.com/login` (transient, with auth code in URL) → `membership.ouraring.com/` (dashboard). The old check rejected any URL containing "login", causing it to miss the final dashboard URL. The new check also accepts `ouraring.com` URLs without `authn`/`login`/`enter-otp`.

#### 6. `backend/src/automation.py` — OTP submit wait improved

After submitting OTP, the code now waits up to 20s total for Oura's multi-step redirect chain to complete, polling every second:
```python
for _ in range(5):
    if self._is_logged_in():
        break
    await self.page.wait_for_timeout(1000)
    await self.page.wait_for_load_state("networkidle", timeout=5000)
```

#### 7. `backend/src/automation.py` — Error text detection expanded

Added missing OTP error messages: `"Incorrect or expired code"` and `"try again"` to match actual Oura error text.

#### 8. `backend/src/automation.py` — Removed duplicate `dispatch_event` on OTP input

Oura's OTP page has auto-submit JS that triggers when 6 digits are entered. The old code called `dispatch_event('input')` after `fill()`, which could race with the auto-submit and cause double-submission. Replaced with a simple `wait_for_timeout(1500)` to let the auto-submit settle naturally.

### Immediate Fix Applied

Running `playwright install chromium` from the backend venv downloaded the browser binaries to the custom path, which immediately resolved the HTTP 500 issue.

The hardened checks above prevent recurrence when the browser directory has stale marker files.

## Verification

All login flow paths verified:
1. ✅ First `start_login()` call returns `{"status": "otp_required", "message": "OTP required"}`
2. ✅ Second (duplicate) call now **restarts** the flow and clicks "Send code" again (sends new email)
3. ✅ `clear_session()` resets state and allows fresh logins
4. ✅ OTP input page at `moi.ouraring.com/authn/authentication/email_otp_moi/enter-otp` has `input[name='otp']` visible and `#submit-button`
5. ✅ Browser detection correctly finds v1208 executables via glob patterns
6. ✅ No HTTP 500 errors during login flow
7. ✅ Error text "Incorrect or expired code" now recognized

## Debugging Steps for Senior Dev

1. **Run backend standalone** to see actual error output:
   ```bash
   cd backend
   .\venv\Scripts\python.exe -m uvicorn backend.src.api.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   Then trigger login from the app and check console for the actual Python traceback.

2. **Check Playwright browser installation:**
   ```bash
   cd backend
   .\venv\Scripts\python.exe -m playwright install chromium
   ```

3. **Check session state file:**
   ```powershell
   Get-ChildItem "$env:APPDATA\CrackedOura" -Filter "*.json"
   ```
   If `storage_state.json` exists, try deleting it and retrying login.

4. **Check if bundled backend.exe works:**
   The installed app at `C:\Users\daniel\AppData\Local\Programs\Cracked Oura\resources\backend\backend.exe` is a PyInstaller bundle. It may have a different Playwright/browser state than the dev venv. Test:
   ```powershell
   & "C:\Users\daniel\AppData\Local\Programs\Cracked Oura\resources\backend\backend.exe"
   ```
   Then check if the standalone backend can login.

## Workaround

Use **Mobile Sync** instead of browser-based login:
- Settings → Mobile Sync → Enable
- This uses token-based auth and does not require Playwright or OTP

## Files to Investigate

- `backend/src/automation.py` — `start_login()`, `login()`, `_perform_login_actions()`
- `backend/src/api/routes.py` — `start_login` endpoint
- `backend/src/config.py` — Session state path configuration
- `backend/venv/Lib/site-packages/playwright` — Playwright installation state
- `C:\Users\daniel\AppData\Roaming\CrackedOura\` — Session storage files
