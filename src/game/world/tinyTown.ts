// World tiles come from Kenney's "Tiny Town" pack (CC0) — public/tiles/tiny_town.png,
// a 12-column sheet of 16x16 tiles. See public/tiles/tiny_town.license.txt.

export const TILE = 16;
export const TILESET_COLUMNS = 12;
export const tilesetSrc = 'tiles/tiny_town.png';

// Named tile indices (index = row * 12 + col in the packed sheet).
export const TILES = {
  grass: 0,
  grassFlower: 1,
  dirt: 25,
  tree: 4,
  bush: 5,
  sign: 92,
} as const;

export type InteractionKind = 'missions' | 'upgrades' | 'activities';

export type Interaction = {
  tx: number;
  ty: number;
  kind: InteractionKind;
  label: string;
};

export type WorldMap = {
  width: number;
  height: number;
  ground: number[];
  objects: (number | null)[];
  solid: boolean[];
  interactions: Interaction[];
  spawn: { x: number; y: number };
};

// Small deterministic hash so decoration is stable between renders.
function sprinkle(x: number, y: number): boolean {
  return ((x * 73856093) ^ (y * 19349663)) % 7 === 0;
}

/**
 * Hand-authored courtyard of Grimalkin: a grass yard ringed by trees (with a
 * gate gap), a stone-dirt plaza in the middle, and three notice posts that open
 * the existing idle screens.
 */
export function createGrimalkin(): WorldMap {
  const width = 24;
  const height = 16;
  const ground: number[] = new Array(width * height);
  const objects: (number | null)[] = new Array(width * height).fill(null);
  const solid: boolean[] = new Array(width * height).fill(false);

  const idx = (x: number, y: number) => y * width + x;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      // central plaza of dirt
      const inPlaza = x >= 9 && x <= 14 && y >= 6 && y <= 10;
      ground[idx(x, y)] = inPlaza
        ? TILES.dirt
        : sprinkle(x, y)
          ? TILES.grassFlower
          : TILES.grass;

      // tree border (leave a gate gap on the bottom edge)
      const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      const isGate = y === height - 1 && x >= 11 && x <= 12;
      if (isBorder && !isGate) {
        objects[idx(x, y)] = TILES.tree;
        solid[idx(x, y)] = true;
      }
    }
  }

  // a few decorative bushes (non-solid)
  for (const [bx, by] of [
    [4, 4],
    [19, 5],
    [5, 12],
    [18, 11],
  ] as const) {
    objects[idx(bx, by)] = TILES.bush;
  }

  const interactions: Interaction[] = [
    { tx: 8, ty: 8, kind: 'missions', label: 'Mural de Grimalkin' },
    { tx: 15, ty: 8, kind: 'upgrades', label: 'Forja da Garra' },
    { tx: 12, ty: 12, kind: 'activities', label: 'Portão do Além' },
  ];

  for (const post of interactions) {
    objects[idx(post.tx, post.ty)] = TILES.sign;
    solid[idx(post.tx, post.ty)] = true;
  }

  return {
    width,
    height,
    ground,
    objects,
    solid,
    interactions,
    spawn: { x: 12 * TILE, y: 9 * TILE },
  };
}
