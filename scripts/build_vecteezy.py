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
# Pecas de UI referenciadas pelo CSS: ficam em src/ para o Vite resolver a URL.
UI_DIR = ROOT / "src/ui/art"

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


SRC_UIKIT = (
    ROOT
    / "assets/vecteezy/23869687_game-ui-gold-frames-medieval"
    / "vecteezy_game-ui-elements-with-gold-frame-in-medieval-style_23869687.jpg"
)
SRC_SHIELDS = (
    ROOT
    / "assets/vecteezy/82189854_knight-shields-crossed-swords"
    / "vecteezy_knight-shields-with-crossed-swords-icon-collection-medieval_82189854.jpg"
)


def isolate_gold(image: Image.Image) -> Image.Image:
    """Mantem so os tracos dourados (pixels quentes) com alfa suave.

    O kit desenha ouro sobre navy/preto (ambos frios: b >= r). Ouro tem
    r >> b, entao alfa = f(r - b) separa os tracos do fundo sem flood-fill.
    """
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, _ = pixels[x, y]
            warmth = r - b
            alpha = max(0, min(255, (warmth - 18) * 5))
            pixels[x, y] = (r, g, b, alpha)
    return rgba


def gold_tint(image: Image.Image, bg_level: int = 150) -> Image.Image:
    """Converte silhuetas escuras em ouro, descartando o fundo.

    A folha de escudos NAO tem fundo branco puro: e um cinza ~168 com moldura
    de 1px. Sem cortar em bg_level o fundo inteiro virava um veu dourado (e a
    moldura da fonte aparecia como "borda do escudo").
    """
    gray = image.convert("L")
    rgba = Image.new("RGBA", image.size)
    out = rgba.load()
    src = gray.load()
    gold = (200, 150, 44)
    for y in range(image.height):
        for x in range(image.width):
            level = src[x, y]
            if level >= bg_level:
                out[x, y] = (gold[0], gold[1], gold[2], 0)
                continue
            # bg_level -> 0 (transparente), 0 -> 255 (ouro cheio)
            alpha = int(255 * (bg_level - level) / bg_level)
            out[x, y] = (gold[0], gold[1], gold[2], alpha)
    return rgba


def build_ui_kit() -> None:
    sheet = isolate_gold(Image.open(SRC_UIKIT))

    # Ornamento (ponta de seta + losango). Usado sob o brasao do menu; girado
    # 90 graus vira o trilho da borda lateral. Nao entra mais na regua dos
    # titulos: sobreposto ao fio as duas linhas nunca casavam (la ficou so CSS).
    divider = autocrop(sheet.crop((1100, 285, 1435, 345)), margin=2)
    divider.save(UI_DIR / "ui_divider.png", optimize=True)
    print(f"  ui_divider.png: {divider.size[0]}x{divider.size[1]}")

    rail = divider.rotate(90, expand=True)
    rail.save(UI_DIR / "ui_rail.png", optimize=True)
    print(f"  ui_rail.png: {rail.size[0]}x{rail.size[1]}")

    # Nota: uma moldura 9-slice foi testada e descartada — esticada em cards
    # pequenos as linhas duplas do original desalinhavam e sumiam na tela.
    # A borda dos cards hoje e CSS (fio de ouro + losangos nos cantos).


def build_shield() -> None:
    sheet = Image.open(SRC_SHIELDS)
    # Caixa medida do 1o escudo (silhueta cheia com espada). Dividir a folha em
    # 4 partes iguais cortava o desenho e incluia a moldura de 1px da fonte.
    shield = sheet.crop((160, 40, 470, sheet.height - 40))
    art = autocrop(gold_tint(shield), margin=2)
    art.thumbnail((256, 256), Image.LANCZOS)
    art.save(UI_DIR / "ui_shield.png", optimize=True)
    print(f"  ui_shield.png: {art.size[0]}x{art.size[1]}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    UI_DIR.mkdir(parents=True, exist_ok=True)
    print("Fatiando gatos medievais (7741781)...")
    build_cats()
    print("Recortando mascote kawaii (3207369)...")
    build_mascot()
    print("Derivando kit de UI dourado (23869687)...")
    build_ui_kit()
    print("Derivando escudo do brasão (82189854)...")
    build_shield()
    print(f"OK — derivados em {OUT_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
