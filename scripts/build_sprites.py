#!/usr/bin/env python3
"""
Pawlands sprite pipeline.

The Cute Legends: Cat Heroes pack ships each animation as a *trimmed* vertical
strip (every frame cropped to its own bounding box), which cannot be used as a
uniform CSS sprite grid. This tool re-packs a chosen animation into a clean
horizontal sheet of uniform cells, bottom-center anchored (feet planted), and
writes a manifest the web app consumes.

Run once whenever the source art in assets/ changes:

    python scripts/build_sprites.py

Outputs: public/sprites/<class>_<anim>.png  and  public/sprites/manifest.json
Requires: Pillow  (pip install Pillow)
"""
import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "CUTE LEGENDS CAT HEROES")
OUT = os.path.join(ROOT, "public", "sprites")            # runtime PNG sheets
MANIFEST = os.path.join(ROOT, "src", "ui", "sprites", "manifest.json")  # typed import

# class key -> (source folder, file prefix)
# NOTE: "king" (King Meowthur) is intentionally deferred. Its idle frames touch
# vertically with no transparent separator row (the tall crown pushes frames
# together), so the row-segmentation below merges frames into a garbled cell.
# It needs frame boundaries read from the source .aseprite file instead.
# Tracked as a follow-up; knight/archer/mage export cleanly with this method.
HEROES = {
    "knight": ("Meow Knight", "Meow-Knight"),
    "archer": ("Meowolas", "MEOWOLAS"),
    "mage": ("Meowtar The Blue", "MEOWTAR_THE_BLUE"),
}

# animation key -> (file suffix, frames-per-second for playback)
ANIMS = {
    "idle": ("Idle", 7),
}


def segment_rows(im):
    """Split a vertical strip into frames using fully-transparent separator rows."""
    w, h = im.size
    px = im.load()
    blank = [all(px[x, y][3] == 0 for x in range(w)) for y in range(h)]
    frames, y = [], 0
    while y < h:
        if blank[y]:
            y += 1
            continue
        start = y
        while y < h and not blank[y]:
            y += 1
        frames.append((start, y))
    return frames


def content_hbounds(im, top, bottom):
    w, _ = im.size
    px = im.load()
    minx, maxx = w, -1
    for y in range(top, bottom):
        for x in range(w):
            if px[x, y][3] != 0:
                minx = min(minx, x)
                maxx = max(maxx, x)
    return minx, maxx


def normalize(src_path, out_path):
    im = Image.open(src_path).convert("RGBA")
    crops = []
    for (t, b) in segment_rows(im):
        minx, maxx = content_hbounds(im, t, b)
        crops.append(im.crop((minx, t, maxx + 1, b)))
    cw = max(c.width for c in crops)
    ch = max(c.height for c in crops)
    n = len(crops)
    sheet = Image.new("RGBA", (cw * n, ch), (0, 0, 0, 0))
    for i, c in enumerate(crops):
        ox = i * cw + (cw - c.width) // 2  # center horizontally
        oy = ch - c.height                 # anchor to floor (feet)
        sheet.paste(c, (ox, oy))
    sheet.save(out_path)
    return {"frameWidth": cw, "frameHeight": ch, "frames": n}


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = {"heroes": {}}
    for hero, (folder, prefix) in HEROES.items():
        manifest["heroes"][hero] = {}
        for anim, (suffix, fps) in ANIMS.items():
            src = os.path.join(SRC, folder, f"{prefix}_{suffix}.png")
            out = os.path.join(OUT, f"{hero}_{anim}.png")
            meta = normalize(src, out)
            meta["fps"] = fps
            meta["src"] = f"sprites/{hero}_{anim}.png"
            manifest["heroes"][hero][anim] = meta
            print(f"{hero:7s} {anim:5s} -> {meta['frames']} frames "
                  f"cell {meta['frameWidth']}x{meta['frameHeight']}")
    os.makedirs(os.path.dirname(MANIFEST), exist_ok=True)
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")
    print(f"\nWrote {MANIFEST}")


if __name__ == "__main__":
    main()
