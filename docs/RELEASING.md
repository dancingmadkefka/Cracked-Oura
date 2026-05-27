# Releasing Cracked Oura

This document describes how desktop installers are built and published to [GitHub Releases](https://github.com/dancingmadkefka/Cracked-Oura/releases).

## What gets shipped

| Platform | Artifact | CI |
|----------|----------|-----|
| Windows x64 | `Cracked Oura Setup <version>.exe` (NSIS installer) | Yes (tag push) |
| macOS | `.dmg` | Local build only (not in CI yet) |
| Linux | `.AppImage` / `.deb` | Local build only (not in CI yet) |

The Windows installer bundles:

1. **Electron shell** — tray, window, starts the backend
2. **Python backend** (PyInstaller) — FastAPI API + SQLite + static UI from Vite

Production UI is **not** read from `app.asar` alone. The backend serves `frontend/dist-ui`, which is embedded in the PyInstaller bundle at `resources/backend/_internal/frontend/dist/`. Any UI change requires the full `npm run build` (including `build:backend`).

## Version numbers

Set the release version in **`frontend/package.json`** → `"version"`. electron-builder uses it for the installer file name (e.g. `Cracked Oura Setup 0.2.0.exe`).

Git tags must match: **`v<version>`** (e.g. `v0.2.0` for package version `0.2.0`).

## Automated release (recommended)

### Prerequisites

- Changes merged to `main`
- `frontend/package.json` version bumped
- GitHub Actions enabled on the repo

### Steps

```bash
# From repo root, after bumping frontend/package.json version:
git add frontend/package.json
git commit -m "chore(release): bump version to 0.2.0"
git push origin main

git tag v0.2.0
git push origin v0.2.0
```

Pushing the tag runs [`.github/workflows/release.yml`](../.github/workflows/release.yml), which:

1. Installs Node 20 + Python 3.11 on `windows-latest`
2. Runs `npm run build` in `frontend/` (Vite → PyInstaller → electron-builder)
3. Uploads the `.exe` to a new **GitHub Release** for that tag

Monitor progress: **Actions** tab → **Release** workflow.

### Re-run without a new tag

In GitHub: **Actions** → **Release** → **Run workflow** → enter an existing tag (e.g. `v0.2.0`).

## Manual release (local Windows build)

Use when CI is unavailable or you need a one-off installer before tagging.

### Prerequisites

- Node.js 20+
- Python 3.11+ with `backend/venv` and `pip install -r requirements.txt pyinstaller`
- Quit any running **Cracked Oura** instance (avoids locked `app.asar` / output dirs)

### Build

```powershell
cd frontend
npm ci --legacy-peer-deps
npm run build
```

Output directory: **`frontend/dist/`**

- Installer: `Cracked Oura Setup <version>.exe`
- Unpacked app: `frontend/dist/win-unpacked/`

### Publish to GitHub manually

1. Create a release on GitHub for tag `v<version>`.
2. Upload `Cracked Oura Setup <version>.exe` as a release asset.

With [GitHub CLI](https://cli.github.com/):

```powershell
gh release create v0.2.0 `
  "frontend/dist/Cracked Oura Setup 0.2.0.exe" `
  --title "Cracked Oura v0.2.0" `
  --generate-notes
```

## PR / main branch validation

Every PR and push to `main` runs [`.github/workflows/windows-build.yml`](../.github/workflows/windows-build.yml). It performs the same build but only uploads a **workflow artifact** (no GitHub Release).

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `app.asar` / output dir locked | Quit Cracked Oura and any `backend.exe` from a prior install |
| UI changes not in installed app | Run full `npm run build` (must include `build:backend`) |
| CI can't find `*.exe` | Confirm `frontend/package.json` → `build.directories.output` is `dist` |
| macOS "app is damaged" | See README — `xattr -cr` on the `.app` (unsigned build) |

## Checklist before tagging

- [ ] Version bumped in `frontend/package.json`
- [ ] `npm run build` succeeds locally (optional but recommended)
- [ ] No secrets or personal paths in the commit
- [ ] README / release notes mention notable user-facing changes
- [ ] Tag name is `v` + semver matching `package.json`
