"""Generate mipmap launcher icons from the desktop app icon."""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT.parent / "frontend" / "icon.png"
RES = ROOT / "app" / "src" / "main" / "res"

DENSITIES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"Source icon not found: {SRC}")
    img = Image.open(SRC).convert("RGBA")
    for folder, size in DENSITIES.items():
        out_dir = RES / folder
        out_dir.mkdir(parents=True, exist_ok=True)
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        for name in ("ic_launcher.png", "ic_launcher_round.png"):
            resized.save(out_dir / name)
    fg_dir = RES / "drawable-nodpi"
    fg_dir.mkdir(parents=True, exist_ok=True)
    img.resize((432, 432), Image.Resampling.LANCZOS).save(fg_dir / "ic_launcher_foreground.png")
    print("Launcher icons written under", RES)


if __name__ == "__main__":
    main()
