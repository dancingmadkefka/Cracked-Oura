#!/usr/bin/env node
/**
 * Cross-platform script to build the Python backend with PyInstaller.
 * Detects the correct venv Python path for the current OS.
 */
const { execFileSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const backendDir = path.resolve(__dirname, '../../backend');
const isWindows = os.platform() === 'win32';
const pythonPath = isWindows
    ? path.join(backendDir, 'venv', 'Scripts', 'python.exe')
    : path.join(backendDir, 'venv', 'bin', 'python');

if (!fs.existsSync(pythonPath)) {
    console.error(`ERROR: Python not found at ${pythonPath}`);
    console.error('Make sure you have created and activated the venv:');
    if (isWindows) {
        console.error('  cd backend && python -m venv venv && venv\\Scripts\\pip install -r requirements.txt');
    } else {
        console.error('  cd backend && python -m venv venv && venv/bin/pip install -r requirements.txt');
    }
    process.exit(1);
}

console.log('Building backend...');
console.log('  Backend dir:', backendDir);
console.log('  Python:    ', pythonPath);

// Use dist-packaged so a locked legacy backend/dist tree cannot block rebuilds.
execFileSync(
    pythonPath,
    ['-m', 'PyInstaller', '--noconfirm', '--distpath', 'dist-packaged', 'build.spec'],
    { cwd: backendDir, stdio: 'inherit' },
);
