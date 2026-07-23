#!/usr/bin/env python3
"""
Pawlands world tileset pipeline.

Kenney's "Tiny Town" (CC0) has no water tiles, and mixing another Kenney pack
clashes with its chunky style. So we derive water in Tiny Town's OWN style:
recolor its grass->dirt autotile (the rounded patch) from tan to blue. The 9
recolored tiles are appended as a new row, giving a grass->water autotile that
blends perfectly.

Run once (the raw Tiny Town pack lives in assets/, git-ignored):

    python scripts/build_tiles.py

Output: public/tiles/tiny_town.png  (base sheet + appended water autotile row)
Requires: Pillow
"""
import colorsys
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "kenney-tiny-town", "Tilemap", "tilemap_packed.png")
OUT = os.path.join(ROOT, "public", "tiles", "tiny_town.png")

COLS = 12
TILE = 16
# Tiny Town grass->dirt autotile (rounded patch): 3x3 of corners/edges/center.
DIRT_AUTOTILE = [12, 13, 14, 24, 25, 26, 36, 37, 38]


def is_dirt(r, g, b):
    h, s, _ = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return s > 0.18 and 12 <= h * 360 <= 58


def to_water(r, g, b):
    _, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    nr, ng, nb = colorsys.hsv_to_rgb(206 / 360, min(0.6, s + 0.12), min(1.0, v + 0.03))
    return int(nr * 255), int(ng * 255), int(nb * 255)


def recolor_tile(sheet, index):
    sx, sy = (index % COLS) * TILE, (index // COLS) * TILE
    src = sheet.crop((sx, sy, sx + TILE, sy + TILE))
    px = src.load()
    out = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    op = out.load()
    for y in range(TILE):
        for x in range(TILE):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            op[x, y] = (*to_water(r, g, b), a) if is_dirt(r, g, b) else (r, g, b, a)
    return out


def main():
    sheet = Image.open(SRC).convert("RGBA")
    rows = sheet.height // TILE
    # extend by one row for the water autotile (indices rows*COLS ..)
    extended = Image.new("RGBA", (sheet.width, sheet.height + TILE), (0, 0, 0, 0))
    extended.paste(sheet, (0, 0))
    base = rows * COLS
    for offset, index in enumerate(DIRT_AUTOTILE):
        water = recolor_tile(sheet, index)
        col = (base + offset) % COLS
        extended.alpha_composite(water, (col * TILE, rows * TILE))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    extended.save(OUT)
    print(f"Wrote {OUT} ({extended.width}x{extended.height}); "
          f"water autotile at indices {base}..{base + len(DIRT_AUTOTILE) - 1}")


if __name__ == "__main__":
    main()
