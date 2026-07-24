#!/usr/bin/env python3
"""
Pawlands world tileset pipeline.

Takes Kenney's "Tiny Town" (CC0) and produces public/tiles/tiny_town.png:

  1. Enhances the flat terrain palette — a richer grass with a subtle texture
     dither (kills the "flat plastic" look) and a softer, less-orange dirt.
  2. Derives water in Tiny Town's own style: recolors the grass->dirt autotile
     from tan to blue, appended as a new row (grass->water autotile). Water is
     built from the ENHANCED tiles so pond edges match the new grass.

Run once (the raw Tiny Town pack lives in assets/, git-ignored):

    python scripts/build_tiles.py

Output: public/tiles/tiny_town.png
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
DIRT_AUTOTILE = [12, 13, 14, 24, 25, 26, 36, 37, 38]

# --- palette enhancement (exact-color remap, so trees/props are untouched) ---
GRASS = (132, 198, 105)
GRASS_HI = (139, 216, 125)
GRASS_LO = (101, 165, 86)
DIRT = (234, 165, 108)

NEW_GRASS = (108, 182, 94)
NEW_GRASS_SHADE = (96, 168, 84)  # subtle texture dither
NEW_GRASS_HI = (126, 198, 110)
NEW_GRASS_LO = (88, 150, 78)
NEW_DIRT = (198, 160, 114)


def grass_textured(x, y):
    # deterministic sparse dither by in-tile position -> consistent & seamless
    return NEW_GRASS_SHADE if ((x % TILE) * 3 + (y % TILE) * 7) % 13 < 2 else NEW_GRASS


def enhance(sheet):
    px = sheet.load()
    out = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    op = out.load()
    for y in range(sheet.height):
        for x in range(sheet.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            rgb = (r, g, b)
            if rgb == GRASS:
                op[x, y] = (*grass_textured(x, y), a)
            elif rgb == GRASS_HI:
                op[x, y] = (*NEW_GRASS_HI, a)
            elif rgb == GRASS_LO:
                op[x, y] = (*NEW_GRASS_LO, a)
            elif rgb == DIRT:
                op[x, y] = (*NEW_DIRT, a)
            else:
                op[x, y] = (r, g, b, a)
    return out


# --- water derivation ---
def is_dirt(r, g, b):
    h, s, _ = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return s > 0.18 and 12 <= h * 360 <= 58


def to_water(r, g, b):
    _, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    nr, ng, nb = colorsys.hsv_to_rgb(206 / 360, min(0.6, s + 0.12), min(1.0, v + 0.03))
    return int(nr * 255), int(ng * 255), int(nb * 255)


def recolor_to_water(sheet, index):
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
    original = Image.open(SRC).convert("RGBA")
    sheet = enhance(original)
    rows = sheet.height // TILE

    extended = Image.new("RGBA", (sheet.width, sheet.height + TILE), (0, 0, 0, 0))
    extended.paste(sheet, (0, 0))
    base = rows * COLS
    for offset, index in enumerate(DIRT_AUTOTILE):
        water = recolor_to_water(sheet, index)  # from enhanced tiles -> matching edges
        col = (base + offset) % COLS
        extended.alpha_composite(water, (col * TILE, rows * TILE))

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    extended.save(OUT)
    print(f"Wrote {OUT} ({extended.width}x{extended.height}); "
          f"grass/dirt enhanced; water autotile at indices {base}..{base + len(DIRT_AUTOTILE) - 1}")


if __name__ == "__main__":
    main()
