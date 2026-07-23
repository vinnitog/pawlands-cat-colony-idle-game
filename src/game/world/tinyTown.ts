import type { CatClass } from '../models/catClass.ts';
import type { ShopId } from '../models/shop.ts';

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
  barrel: 106,
  crate: 130,
} as const;

export type InteractionKind = 'missions' | 'upgrades' | 'activities';

export type Interaction = {
  tx: number;
  ty: number;
  kind: InteractionKind;
  label: string;
};

export type Npc = {
  tx: number;
  ty: number;
  sprite: CatClass;
  name: string;
  lines: string[];
  /** When set, interacting opens this shop instead of showing dialog. */
  shop?: ShopId;
};

export type WorldMap = {
  width: number;
  height: number;
  ground: number[];
  objects: (number | null)[];
  solid: boolean[];
  interactions: Interaction[];
  npcs: Npc[];
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

  // dirt roads tying the plaza to the gate and the house
  const paths: Array<[number, number]> = [
    [11, 11], [11, 12], [11, 13], [12, 11], [12, 12], [12, 13], // plaza -> gate
    [5, 4], [5, 5], [5, 6], [6, 6], [7, 6], [8, 6], // blue house -> plaza
    [17, 4], [17, 5], [16, 5], [15, 5], [14, 6], // red house -> plaza
  ];
  for (const [px, py] of paths) ground[idx(px, py)] = TILES.dirt;

  // a few decorative bushes (non-solid)
  for (const [bx, by] of [
    [4, 4],
    [19, 5],
    [18, 11],
    [7, 13],
    [2, 13],
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

  // Assembled structures (tile indices from the Tiny Town sheet).
  const house: Array<[number, number, number]> = [
    [3, 2, 48], [4, 2, 49], [5, 2, 50], // blue roof
    [3, 3, 84], [4, 3, 85], [5, 3, 86], // timbered wall: window, plain, door
    [16, 2, 52], [17, 2, 53], [18, 2, 54], // red roof
    [16, 3, 84], [17, 3, 85], [18, 3, 86],
  ];
  // stone gatehouse over the bottom gap — the way out toward the Além
  const gatehouse: Array<[number, number, number]> = [
    [10, 14, 108], [11, 14, 111], [12, 14, 114], [13, 14, 110],
    [10, 15, 120], [11, 15, 123], [12, 15, 125], [13, 15, 122],
  ];
  const props: Array<[number, number, number]> = [
    [17, 7, TILES.barrel],
    [7, 9, TILES.crate],
  ];
  for (const [sx, sy, t] of [...house, ...gatehouse, ...props]) {
    objects[idx(sx, sy)] = t;
    solid[idx(sx, sy)] = true;
  }

  // a pond (recolored Tiny Town autotile, indices 132-140) on the ground layer
  const pond: Array<[number, number, number]> = [
    [3, 11, 132], [4, 11, 133], [5, 11, 133], [6, 11, 134],
    [3, 12, 135], [4, 12, 136], [5, 12, 136], [6, 12, 137],
    [3, 13, 135], [4, 13, 136], [5, 13, 136], [6, 13, 137],
    [3, 14, 138], [4, 14, 139], [5, 14, 139], [6, 14, 140],
  ];
  for (const [px, py, t] of pond) {
    ground[idx(px, py)] = t;
    solid[idx(px, py)] = true;
  }

  const npcs: Npc[] = [
    {
      tx: 11,
      ty: 7,
      sprite: 'mage',
      name: 'Vittorio, o Joalheiro',
      shop: 'jeweler',
      lines: ['Gemas? *te encara* ...nunca embolsei uma que já não fosse minha.'],
    },
    {
      tx: 17,
      ty: 8,
      sprite: 'knight',
      name: 'Aldric, o Ferreiro',
      shop: 'blacksmith',
      lines: ['Ferro é honesto. Gente, nem tanto. *martela*'],
    },
  ];

  for (const npc of npcs) {
    solid[idx(npc.tx, npc.ty)] = true;
  }

  return {
    width,
    height,
    ground,
    objects,
    solid,
    interactions,
    npcs,
    spawn: { x: 12 * TILE, y: 9 * TILE },
  };
}
