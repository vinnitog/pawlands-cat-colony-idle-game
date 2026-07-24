"""Deriva PNGs transparentes dos vetores Vecteezy (JPGs de alta resolucao).

Fontes (assets/, git-ignored — ver assets/vecteezy/README.md e licenca):
- 7741781: grade 3x3 com gatos medievais (colunas: cavaleiro, viking, rei).
- 3207369: gato cavaleiro kawaii com escudo de peixe (mascote).

O fundo e removido por flood-fill a partir das bordas (a arte tem contorno
escuro, entao o preenchimento nao invade o personagem — crucial porque os
gatos sao brancos sobre fundo branco). Saida em public/art/ (derivados
versionados; atribuicao "Vecteezy" obrigatoria na UI).

Uso:  python scripts/build_vecteezy.py
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_CATS = (
    ROOT
    / "assets/vecteezy/7741781_cats-medieval-outfits"
    / "vecteezy_vector-illustrations-of-cat-characters-in-various-medieval_7741781.jpg"
)
SRC_MASCOT = (
    ROOT / "assets/vecteezy/3207369_kawaii-knight-cat" / "vecteezy_empower-cat-knight_3207369.jpg"
)
OUT_DIR = ROOT / "public/art"

GRID = 3
CELL = 640
# Distancia de cor (soma RGB) tolerada ao expandir o flood-fill do fundo.
BG_TOLERANCE = 90
# Colunas do pack 7741781, na ordem.
COLUMNS = ["knight", "viking", "king"]


def remove_background(image: Image.Image, tolerance: int = BG_TOLERANCE) -> Image.Image:
    """Zera o alfa da regiao de fundo conectada as bordas da imagem."""
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()

    seeds = deque()
    seen = bytearray(width * height)

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if not seen[index]:
            seen[index] = 1
            seeds.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    base_r, base_g, base_b, _ = pixels[0, 0]

    while seeds:
        x, y = seeds.popleft()
        r, g, b, _ = pixels[x, y]
        if abs(r - base_r) + abs(g - base_g) + abs(b - base_b) > tolerance:
            continue
        pixels[x, y] = (r, g, b, 0)
        if x > 0:
            enqueue(x - 1, y)
        if x < width - 1:
            enqueue(x + 1, y)
        if y > 0:
            enqueue(x, y - 1)
        if y < height - 1:
            enqueue(x, y + 1)

    return rgba


def autocrop(image: Image.Image, margin: int = 8) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        return image
    left, top, right, bottom = bbox
    left = max(0, left - margin)
    top = max(0, top - margin)
    right = min(image.width, right + margin)
    bottom = min(image.height, bottom + margin)
    return image.crop((left, top, right, bottom))


def build_cats() -> None:
    sheet = Image.open(SRC_CATS)
    for row in range(GRID):
        for col in range(GRID):
            cell = sheet.crop((col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL))
            art = autocrop(remove_background(cell))
            name = f"cat_{COLUMNS[col]}_{row + 1}.png"
            art.save(OUT_DIR / name, optimize=True)
            print(f"  {name}: {art.size[0]}x{art.size[1]}")


def build_mascot() -> None:
    art = autocrop(remove_background(Image.open(SRC_MASCOT)))
    art.thumbnail((640, 640), Image.LANCZOS)
    art.save(OUT_DIR / "cat_mascot.png", optimize=True)
    print(f"  cat_mascot.png: {art.size[0]}x{art.size[1]}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print("Fatiando gatos medievais (7741781)...")
    build_cats()
    print("Recortando mascote kawaii (3207369)...")
    build_mascot()
    print(f"OK — derivados em {OUT_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
