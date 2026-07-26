export const TINY_DUNGEON_TILESET_COLUMNS = 12;
export const TINY_DUNGEON_TILESET_TILE_COUNT = 132;
export const tinyDungeonTilesetSrc = 'tiles/tiny_dungeon.png';

// Kenney Tiny Dungeon 1.0, packed atlas. Keep raw indices confined here.
// Names were checked against the individual Tiles/tile_####.png files from the
// audited archive. Multi-tile structures deliberately expose each 16 px part.
export const DUNGEON_TILES = {
  wallCapLeft: 4,
  wallCapRight: 5,
  pillarTop: 6,
  pillarMiddle: 18,
  pillarBase: 31,
  guardianReliefTop: 7,
  guardianReliefMiddle: 19,
  fountainTop: 8,
  fountainMiddle: 20,
  fountainBasin: 32,
  brazierTop: 9,
  brazierEmbers: 21,
  gatewayTopLeft: 10,
  gatewayTopRight: 11,
  gatewaySideLeft: 22,
  gatewaySideRight: 23,
  masonryRubble: 24,
  boneFragments: 25,
  stoneWall: 28,
  wallFlame: 29,
  stoneThreshold: 30,
  stoneFloorLight: 36,
  stoneWallPlain: 40,
  floorDebris: 42,
} as const;

export type DungeonTile = (typeof DUNGEON_TILES)[keyof typeof DUNGEON_TILES];

export async function loadOptionalAsset<T>(loader: () => Promise<T>): Promise<T | null> {
  try {
    return await loader();
  } catch {
    return null;
  }
}
