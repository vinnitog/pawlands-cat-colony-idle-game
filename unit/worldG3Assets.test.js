import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  DUNGEON_TILES,
  loadOptionalAsset,
  TINY_DUNGEON_TILESET_COLUMNS,
  TINY_DUNGEON_TILESET_TILE_COUNT,
  tinyDungeonTilesetSrc,
} from '../src/game/world/tinyDungeon.ts';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { saveSchemaVersion } from '../src/game/models/save.ts';
import { migrateGameSave } from '../src/game/storage/migrations.ts';
import { createGrimalkin } from '../src/game/world/tinyTown.ts';

const PNG_PATH = new URL('../public/tiles/tiny_dungeon.png', import.meta.url);
const LICENSE_PATH = new URL('../public/tiles/tiny_dungeon.license.txt', import.meta.url);
const SOURCE_PATH = new URL('../public/tiles/tiny_dungeon.source.txt', import.meta.url);
const WORLD_SCREEN_PATH = new URL('../src/ui/screens/WorldScreen.tsx', import.meta.url);
const EXPECTED_SHA256 = 'd24e60a41e4ac7a745c0304dfde121143688557f40215f23221c29cfe683825f';
const EXPECTED_ARCHIVE_SHA256 =
  'C109438AB06F65FD80F9B2686A4CF9C7C11DC64444B47333EC71D602F8BB5FC7';

function pngDimensions(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('G3.1 imports the audited Tiny Dungeon atlas and CC0 license', async () => {
  const [png, license, source] = await Promise.all([
    readFile(PNG_PATH),
    readFile(LICENSE_PATH, 'utf8'),
    readFile(SOURCE_PATH, 'utf8'),
  ]);

  assert.deepEqual(pngDimensions(png), { width: 192, height: 176 });
  assert.equal(createHash('sha256').update(png).digest('hex'), EXPECTED_SHA256);
  assert.notEqual(png.indexOf(Buffer.from('tRNS')), -1, 'indexed PNG must preserve transparency');
  assert.match(license, /Creative Commons Zero, CC0/);
  assert.match(source, /Source: https:\/\/kenney\.nl\/assets\/tiny-dungeon/);
  assert.match(source, new RegExp(`Original archive SHA-256: ${EXPECTED_ARCHIVE_SHA256}`));
  assert.match(source, new RegExp(`Imported file SHA-256: ${EXPECTED_SHA256}`, 'i'));
  assert.equal(tinyDungeonTilesetSrc, 'tiles/tiny_dungeon.png');
});

test('G3.1 keeps raw Tiny Dungeon indices centralized and in atlas bounds', () => {
  const indices = Object.values(DUNGEON_TILES);

  assert.equal(TINY_DUNGEON_TILESET_COLUMNS, 12);
  assert.equal(TINY_DUNGEON_TILESET_TILE_COUNT, 132);
  assert.equal(indices.length, 24);
  assert.equal(new Set(indices).size, indices.length);
  assert.ok(indices.every((index) => Number.isInteger(index)));
  assert.ok(indices.every((index) => index >= 0 && index < TINY_DUNGEON_TILESET_TILE_COUNT));
  assert.deepEqual(DUNGEON_TILES, {
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
  });
});

test('G3.1 wires an optional detail layer without coupling it to collision', () => {
  const map = createGrimalkin();
  const solidBeforeDecoration = [...map.solid];

  assert.ok(Array.isArray(map.details));
  assert.equal(map.ground.length, map.width * map.height);
  assert.equal(map.objects.length, map.width * map.height);
  assert.equal(map.solid.length, map.width * map.height);

  map.details.push({ tx: 1, ty: 1, tile: DUNGEON_TILES.floorDebris });

  assert.deepEqual(map.solid, solidBeforeDecoration);
  assert.equal(map.solid[1 * map.width + 1], false);
});

test('G3.1 keeps optional world details out of the save schema and migration', () => {
  const saved = createInitialGameState(1_000);
  const decoratedSave = {
    ...saved,
    details: [{ tx: 1, ty: 1, tile: DUNGEON_TILES.floorDebris }],
    world: {
      ...saved.world,
      details: [{ tx: 2, ty: 2, tile: DUNGEON_TILES.masonryRubble }],
    },
  };

  assert.equal(saved.schemaVersion, saveSchemaVersion);
  assert.equal(Object.hasOwn(saved, 'details'), false);
  assert.equal(Object.hasOwn(saved.world, 'details'), false);

  const migrated = migrateGameSave(decoratedSave);

  assert.equal(migrated.schemaVersion, saveSchemaVersion);
  assert.deepEqual(migrated.world, saved.world);
  assert.equal(Object.hasOwn(migrated, 'details'), false);
  assert.equal(Object.hasOwn(migrated.world, 'details'), false);
});

test('G3.1 optional image loading falls back without rejecting the world boot', async () => {
  const failure = new Error('atlas unavailable');

  assert.equal(await loadOptionalAsset(async () => Promise.reject(failure)), null);
  assert.equal(await loadOptionalAsset(async () => 'loaded'), 'loaded');
});

test('G3.1 renderer loads the complementary atlas outside the required world assets', async () => {
  const source = await readFile(WORLD_SCREEN_PATH, 'utf8');
  const requiredAssets = source.match(/Promise\.all\(\[([\s\S]*?)\]\)\s*\.then/);
  const optionalLoad = source.match(
    /loadOptionalAsset\(\(\) => loadImage\(base \+ tinyDungeonTilesetSrc\)\)/,
  );
  const optionalResolution = source.match(
    /loadOptionalAsset\(\(\) => loadImage\(base \+ tinyDungeonTilesetSrc\)\)\.then\(\(image\) => \{([\s\S]*?)\}\);/,
  );
  const cleanupStart = source.indexOf('return () => {');
  const cleanupEnd = source.indexOf('  }, [catClass, leaderIsAway]');
  const cleanup = source.slice(cleanupStart, cleanupEnd);

  assert.ok(requiredAssets, 'required world asset batch must remain identifiable');
  assert.doesNotMatch(requiredAssets[1], /tinyDungeonTilesetSrc/);
  assert.ok(optionalLoad, 'Tiny Dungeon must load through the optional fallback helper');
  assert.ok(optionalResolution, 'optional atlas resolution must remain identifiable');
  assert.match(optionalResolution[1], /if \(running\) detailImg = image;/);
  assert.doesNotMatch(optionalResolution[1], /detailImg = image;\s*if \(running\)/);
  assert.ok(cleanupStart >= 0 && cleanupEnd > cleanupStart, 'effect cleanup must remain identifiable');
  assert.match(cleanup, /running = false;/);
  assert.match(source, /if \(!detailImg\) return;/);
  assert.match(source, /map\.details\.forEach/);
});
