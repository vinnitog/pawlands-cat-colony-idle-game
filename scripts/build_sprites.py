#!/usr/bin/env python3
"""
Pawlands sprite pipeline.

The Cute Legends: Cat Heroes pack ships each animation as a vertical strip.
Two export conventions appear in the pack:

  * "trimmed" strips, where frames are separated by fully-transparent rows
    (knight / archer / mage) -> segmented by blank rows;
  * "uniform grid" strips, where frames touch with no separator because the
    art fills the whole cell (king) -> sliced by a known frame height.

Either way this tool re-packs the frames into a clean horizontal sheet of
uniform cells, bottom-center anchored (feet planted), and writes a manifest
the web app consumes.

Run once whenever the source art in assets/ changes (the raw pack is licensed
and git-ignored; only the derived sheets in public/sprites/ ship):

    python scripts/build_sprites.py

Outputs: public/sprites/<class>_<anim>.png  and  src/ui/sprites/manifest.json
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
HEROES = {
    "knight": ("Meow Knight", "Meow-Knight"),
    "archer": ("Meowolas", "MEOWOLAS"),
    "mage": ("Meowtar The Blue", "MEOWTAR_THE_BLUE"),
    "king": ("King Meowthur", "King_Mewrthur"),
}

# animation key -> (file suffix, frames-per-second for playback)
ANIMS = {
    "idle": ("Idle", 7),
}

# (hero, anim) whose frames touch and must be sliced by a fixed cell height
# instead of transparent-row segmentation.
GRID_FRAME_HEIGHT = {
    ("king", "idle"): 16,
}


def frames_by_blank_rows(im):
    """Yield full-width row slices split on fully-transparent separator rows."""
    w, h = im.size
    px = im.load()
    blank = [all(px[x, y][3] == 0 for x in range(w)) for y in range(h)]
    y = 0
    while y < h:
        if blank[y]:
            y += 1
            continue
        start = y
        while y < h and not blank[y]:
            y += 1
        yield im.crop((0, start, w, y))


def frames_by_grid(im, frame_h):
    """Yield full-width row slices of a fixed height (uniform-grid sheet)."""
    w, h = im.size
    for top in range(0, h, frame_h):
        yield im.crop((0, top, w, min(top + frame_h, h)))


def tight(frame):
    """Crop a frame to its opaque content (alpha bounding box)."""
    bbox = frame.getchannel("A").getbbox()
    return frame.crop(bbox) if bbox else None


def normalize(src_path, out_path, grid_h=None):
    im = Image.open(src_path).convert("RGBA")
    raw = frames_by_grid(im, grid_h) if grid_h else frames_by_blank_rows(im)
    crops = [c for c in (tight(f) for f in raw) if c is not None]

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
            meta = normalize(src, out, GRID_FRAME_HEIGHT.get((hero, anim)))
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
