import type { CatClass } from '../models/catClass.ts';
import type { MissionId } from '../models/missions.ts';
import type { ShopId } from '../models/shop.ts';

// Kenney Tiny Town (CC0), already published at public/tiles/tiny_town.png.
// The atlas is a 12 × 12 grid of 16 px tiles; valid indices are 0..143.
export const TILE = 16;
export const TILESET_COLUMNS = 12;
export const TILESET_TILE_COUNT = 144;
export const tilesetSrc = 'tiles/tiny_town.png';
export const WORLD_PLAYER_COLLISION_HALF_SIZE = 5;

export const TILES = {
  grass: 0,
  grassDetail: 1,
  flowers: 2,
  pathTopLeft: 12,
  pathTop: 13,
  pathTopRight: 14,
  pathLeft: 24,
  pathCenter: 25,
  pathRight: 26,
  pathBottomLeft: 36,
  pathBottom: 37,
  pathBottomRight: 38,
  treePine: 4,
  treeRound: 7,
  treeAutumn: 10,
  shrub: 17,
  sign: 83,
  crate: 103,
  bench: 81,
  well: 104,
  firewood: 106,
  clayPot: 107,
  hammer: 128,
  sword: 119,
} as const;

export type InteractionKind = 'missions' | 'upgrades' | 'activities' | 'expedition' | 'fish';

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
  shop?: ShopId;
  questId?: MissionId;
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

export type WorldPosition = { x: number; y: number };

function isFreeTile(map: WorldMap, tx: number, ty: number): boolean {
  return (
    tx >= 0
    && ty >= 0
    && tx < map.width
    && ty < map.height
    && !map.solid[ty * map.width + tx]
  );
}

function isWalkablePosition(map: WorldMap, position: WorldPosition): boolean {
  const { x, y } = position;
  return [
    [x - WORLD_PLAYER_COLLISION_HALF_SIZE, y - WORLD_PLAYER_COLLISION_HALF_SIZE],
    [x + WORLD_PLAYER_COLLISION_HALF_SIZE, y - WORLD_PLAYER_COLLISION_HALF_SIZE],
    [x - WORLD_PLAYER_COLLISION_HALF_SIZE, y],
    [x + WORLD_PLAYER_COLLISION_HALF_SIZE, y],
  ].every(([wx, wy]) => isFreeTile(map, Math.floor(wx / TILE), Math.floor(wy / TILE)));
}

/**
 * Keeps a valid saved position verbatim. Invalid or obstructed positions move
 * to the nearest walkable tile, using the map spawn as the safe search origin
 * when the coordinates are outside the world.
 */
export function resolveWorldPosition(
  map: WorldMap,
  position: WorldPosition,
): WorldPosition {
  const finite = Number.isFinite(position.x) && Number.isFinite(position.y);
  const tx = finite ? Math.floor(position.x / TILE) : -1;
  const ty = finite ? Math.floor(position.y / TILE) : -1;

  if (finite && isWalkablePosition(map, position)) return position;

  const spawnTx = Math.floor(map.spawn.x / TILE);
  const spawnTy = Math.floor(map.spawn.y / TILE);
  const startsInside = tx >= 0 && ty >= 0 && tx < map.width && ty < map.height;
  const start = startsInside
    ? { tx, ty }
    : { tx: spawnTx, ty: spawnTy };
  const queue = [start];
  const visited = new Set([`${start.tx},${start.ty}`]);

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (isFreeTile(map, current.tx, current.ty)) {
      return {
        x: current.tx * TILE + TILE / 2,
        y: current.ty * TILE + TILE / 2,
      };
    }

    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]] as const) {
      const next = { tx: current.tx + dx, ty: current.ty + dy };
      const key = `${next.tx},${next.ty}`;
      if (
        next.tx < 0
        || next.ty < 0
        || next.tx >= map.width
        || next.ty >= map.height
        || visited.has(key)
      ) {
        continue;
      }
      visited.add(key);
      queue.push(next);
    }
  }

  return map.spawn;
}

function getPathTile(path: Set<string>, x: number, y: number): number {
  const north = path.has(`${x},${y - 1}`);
  const south = path.has(`${x},${y + 1}`);
  const west = path.has(`${x - 1},${y}`);
  const east = path.has(`${x + 1},${y}`);

  if (!north && !west) return TILES.pathTopLeft;
  if (!north && !east) return TILES.pathTopRight;
  if (!south && !west) return TILES.pathBottomLeft;
  if (!south && !east) return TILES.pathBottomRight;
  if (!north) return TILES.pathTop;
  if (!south) return TILES.pathBottom;
  if (!west) return TILES.pathLeft;
  if (!east) return TILES.pathRight;
  return TILES.pathCenter;
}

export function createGrimalkin(): WorldMap {
  const width = 24;
  const height = 16;
  const ground = new Array<number>(width * height).fill(TILES.grass);
  const objects = new Array<number | null>(width * height).fill(null);
  const solid = new Array<boolean>(width * height).fill(false);
  const idx = (x: number, y: number) => y * width + x;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const detailRoll = (x * 17 + y * 31) % 23;
      if (detailRoll === 0) ground[idx(x, y)] = TILES.flowers;
      else if (detailRoll === 7 || detailRoll === 13) {
        ground[idx(x, y)] = TILES.grassDetail;
      }
    }
  }

  const setObject = (x: number, y: number, tile: number, isSolid = true) => {
    objects[idx(x, y)] = tile;
    solid[idx(x, y)] = isSolid;
  };
  const setUnoccupiedObject = (x: number, y: number, tile: number, isSolid = true) => {
    if (objects[idx(x, y)] !== null) {
      throw new Error(`Overlapping Grimalkin object at ${x},${y}`);
    }
    setObject(x, y, tile, isSolid);
  };

  const path = new Set<string>();
  const addPathRect = (left: number, top: number, right: number, bottom: number) => {
    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) path.add(`${x},${y}`);
    }
  };

  // Civic axis, central square and district branches.
  addPathRect(9, 6, 14, 10);
  addPathRect(11, 4, 12, 14);
  addPathRect(5, 5, 9, 6);
  addPathRect(7, 8, 9, 9);
  addPathRect(14, 8, 18, 9);
  addPathRect(7, 11, 9, 13);
  for (const key of path) {
    const [x, y] = key.split(',').map(Number);
    ground[idx(x, y)] = getPathTile(path, x, y);
  }

  // Stone perimeter and the south gatehouse. The two arch tiles remain open.
  for (let x = 0; x < width; x += 1) {
    setObject(x, 0, x === 0 ? 96 : x === width - 1 ? 98 : 97);
    setObject(x, height - 1, x === 0 ? 120 : x === width - 1 ? 122 : 121);
  }
  for (let y = 1; y < height - 1; y += 1) {
    setObject(0, y, 108);
    setObject(width - 1, y, 110);
  }
  const southGate: Array<[number, number, number, boolean]> = [
    [10, 14, 111, true], [11, 14, 112, false], [12, 14, 113, false], [13, 14, 114, true],
    [11, 15, 123, false], [12, 15, 124, false], [13, 15, 125, true],
  ];
  for (const [x, y, tile, isSolid] of southGate) setObject(x, y, tile, isSolid);

  const structures: Array<[number, number, number]> = [
    // Royal stone keep — north/centre.
    [9, 1, 96], [10, 1, 97], [11, 1, 98], [12, 1, 96], [13, 1, 97], [14, 1, 98],
    [9, 2, 108], [10, 2, 111], [11, 2, 112], [12, 2, 113], [13, 2, 114], [14, 2, 110],
    [9, 3, 120], [10, 3, 123], [11, 3, 124], [12, 3, 124], [13, 3, 125], [14, 3, 122],
    // Merchant homes — west.
    [1, 2, 48], [2, 2, 49], [3, 2, 50],
    [1, 3, 60], [2, 3, 63], [3, 3, 62],
    [1, 4, 84], [2, 4, 85], [3, 4, 86],
    [5, 1, 52], [6, 1, 53], [7, 1, 54],
    [5, 2, 64], [6, 2, 67], [7, 2, 66],
    [5, 3, 84], [6, 3, 85], [7, 3, 86],
    // Forge workshop — east.
    [17, 2, 52], [18, 2, 53], [19, 2, 54],
    [17, 3, 64], [18, 3, 67], [19, 3, 66],
    [17, 4, 84], [18, 4, 85], [19, 4, 86],
    // Residential house — southeast.
    [19, 9, 48], [20, 9, 49], [21, 9, 50],
    [19, 10, 60], [20, 10, 63], [21, 10, 62],
    [19, 11, 84], [20, 11, 85], [21, 11, 86],
  ];
  for (const [x, y, tile] of structures) setUnoccupiedObject(x, y, tile);

  // Lago-jardim southwest, using the complete Tiny Town pond autotile.
  const pond: Array<[number, number, number]> = [
    [3, 11, 132], [4, 11, 133], [5, 11, 133], [6, 11, 134],
    [3, 12, 135], [4, 12, 136], [5, 12, 136], [6, 12, 137],
    [3, 13, 135], [4, 13, 136], [5, 13, 136], [6, 13, 137],
    [3, 14, 138], [4, 14, 139], [5, 14, 139], [6, 14, 140],
  ];
  for (const [x, y, tile] of pond) {
    ground[idx(x, y)] = tile;
    solid[idx(x, y)] = true;
  }

  // Vegetation clusters frame districts instead of scattering visual noise.
  const trees: Array<[number, number, number]> = [
    [1, 6, TILES.treePine], [2, 7, TILES.treeRound], [1, 8, TILES.treePine],
    [3, 8, TILES.treeRound], [2, 9, TILES.treePine], [1, 10, TILES.treeRound],
    [20, 6, TILES.treeAutumn], [22, 5, TILES.treeAutumn], [21, 7, TILES.treeRound],
    [20, 13, TILES.treePine], [22, 12, TILES.treeRound], [21, 14, TILES.treePine],
  ];
  for (const [x, y, tile] of trees) setUnoccupiedObject(x, y, tile);

  const props: Array<[number, number, number, boolean]> = [
    [6, 6, TILES.crate, true],
    [16, 6, TILES.firewood, true],
    [17, 5, TILES.clayPot, true],
    [16, 7, TILES.hammer, false],
    [18, 6, TILES.sword, false],
    [10, 8, TILES.well, true],
    [9, 11, TILES.bench, true],
    [8, 5, TILES.shrub, false],
    [4, 8, TILES.shrub, false],
    [7, 14, TILES.shrub, false],
    [17, 11, TILES.shrub, false],
  ];
  for (const [x, y, tile, isSolid] of props) {
    setUnoccupiedObject(x, y, tile, isSolid);
  }

  const interactions: Interaction[] = [
    { tx: 8, ty: 8, kind: 'missions', label: 'Mural de Grimalkin' },
    { tx: 15, ty: 8, kind: 'upgrades', label: 'Forja da Garra' },
    { tx: 12, ty: 12, kind: 'expedition', label: 'Portão do Além' },
    { tx: 7, ty: 12, kind: 'fish', label: 'Lago de Grimalkin (pesca reforçada)' },
  ];
  for (const interaction of interactions) {
    setUnoccupiedObject(interaction.tx, interaction.ty, TILES.sign);
  }

  const npcs: Npc[] = [
    {
      tx: 11,
      ty: 7,
      sprite: 'mage',
      name: 'Vittorio, o Joalheiro',
      shop: 'jeweler',
      questId: 'jewelerGems5',
      lines: ['Gemas? *te encara* ...nunca embolsei uma que já não fosse minha.'],
    },
    {
      tx: 17,
      ty: 8,
      sprite: 'knight',
      name: 'Aldric, o Ferreiro',
      shop: 'blacksmith',
      questId: 'captureMice25',
      lines: ['Ferro é honesto. Gente, nem tanto. *martela*'],
    },
    {
      tx: 12,
      ty: 6,
      sprite: 'king',
      name: 'Rei Grimalkin, o Coroado',
      questId: 'crownTribute250',
      lines: [
        'Ajoelhe... ou ao menos pare de pisar na minha sombra. *ajeita a coroa*',
        'Grimalkin foi minha muito antes de você farejar estas ruas.',
        'Gemas, aço, sardinhas — tudo passa pela coroa. Não esqueça.',
        'Falando em passar pela coroa: onde está o meu tributo?',
      ],
    },
  ];
  for (const npc of npcs) solid[idx(npc.tx, npc.ty)] = true;

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
