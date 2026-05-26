# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_submodules

block_cipher = None

# Collect all langchain submodules to ensure PyInstaller bundles them
langchain_hiddenimports = collect_submodules('langchain_community')
langchain_hiddenimports += collect_submodules('langchain_ollama')
langchain_hiddenimports += collect_submodules('langchain_openai')
langchain_hiddenimports += collect_submodules('openai')
langchain_hiddenimports += collect_submodules('sqlalchemy')
langchain_hiddenimports += collect_submodules('langchain_core')

a = Analysis(
    ['src/api/main.py'],
    pathex=['..'], # Allow resolving 'backend' package from root
    binaries=[],
    datas=[
        ('src', 'backend/src'),  # Map 'src' to 'backend/src' inside bundle so 'backend.src' imports work
        ('../frontend/dist-ui', 'frontend/dist'),  # Desktop UI static assets for packaged backend
    ],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
    ] + langchain_hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='backend',
)
