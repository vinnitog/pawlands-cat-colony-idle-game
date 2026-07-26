import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { DUNGEON_TILES, TINY_DUNGEON_TILESET_TILE_COUNT } from '../src/game/world/tinyDungeon.ts';
import { TILE, createGrimalkin } from '../src/game/world/tinyTown.ts';
import { sortByDepth } from '../src/game/world/worldVisuals.ts';

const EXPECTED_DETAILS = [
  { tx: 11, ty: 1, tile: DUNGEON_TILES.guardianReliefTop },
  { tx: 11, ty: 2, tile: DUNGEON_TILES.guardianReliefMiddle },
  { tx: 13, ty: 1, tile: DUNGEON_TILES.guardianReliefTop },
  { tx: 13, ty: 2, tile: DUNGEON_TILES.guardianReliefMiddle },
  { tx: 18, ty: 3, tile: DUNGEON_TILES.wallFlame },
  { tx: 17, ty: 4, tile: DUNGEON_TILES.masonryRubble },
  { tx: 11, ty: 14, tile: DUNGEON_TILES.gatewayTopLeft },
  { tx: 12, ty: 14, tile: DUNGEON_TILES.gatewayTopRight },
  { tx: 11, ty: 15, tile: DUNGEON_TILES.gatewaySideLeft },
  { tx: 12, ty: 15, tile: DUNGEON_TILES.gatewaySideRight },
];

const EXPECTED_BASE_TILES = [98, 112, 97, 114, 67, 84, 112, 113, 123, 124];
const EXPECTED_SOLIDITY = [true, true, true, true, true, true, false, false, false, false];

// Frozen from the shipped G1 map (commit dec1198). Update only after an explicit
// base-map contract revision; G3 detail-only passes must keep these exact values.
const BASE_LAYER_HASHES = {
  ground: 'da60cdd986232a27f98871d5d0a06e727803d6a43d92c394bef5df78f08aa831',
  objects: 'e230dc2d163e2047ed42b003608c774a68fd54baec0c587d354217862fcf4a35',
  solid: '4a19c18317d9d6805572f07e324474bca9c87df8deb02aca75fdc53bf87599d6',
};

function hashLayer(layer) {
  return createHash('sha256').update(JSON.stringify(layer)).digest('hex');
}

function getReachableTiles(map) {
  const start = {
    tx: Math.floor(map.spawn.x / TILE),
    ty: Math.floor(map.spawn.y / TILE),
  };
  const queue = [start];
  const visited = new Set([`${start.tx},${start.ty}`]);

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const tx = current.tx + dx;
      const ty = current.ty + dy;
      const key = `${tx},${ty}`;
      if (
        tx < 0
        || ty < 0
        || tx >= map.width
        || ty >= map.height
        || map.solid[ty * map.width + tx]
        || visited.has(key)
      ) {
        continue;
      }
      visited.add(key);
      queue.push({ tx, ty });
    }
  }

  return visited;
}

function findPath(map, start, target) {
  const queue = [start];
  const previous = new Map([[`${start.tx},${start.ty}`, null]]);

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (current.tx === target.tx && current.ty === target.ty) {
      const path = [];
      let key = `${current.tx},${current.ty}`;
      while (key !== null) {
        const [tx, ty] = key.split(',').map(Number);
        path.push({ tx, ty });
        key = previous.get(key);
      }
      return path.reverse();
    }

    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const tx = current.tx + dx;
      const ty = current.ty + dy;
      const key = `${tx},${ty}`;
      if (
        tx < 0
        || ty < 0
        || tx >= map.width
        || ty >= map.height
        || map.solid[ty * map.width + tx]
        || previous.has(key)
      ) {
        continue;
      }
      previous.set(key, `${current.tx},${current.ty}`);
      queue.push({ tx, ty });
    }
  }

  return null;
}

test('G3.2 uses ten audited detail tiles in the three approved districts', () => {
  const map = createGrimalkin();

  assert.deepEqual(map.details, EXPECTED_DETAILS);
  assert.equal(map.details.length, 10);
  assert.equal(new Set(map.details.map(({ tx, ty }) => `${tx},${ty}`)).size, 10);
  assert.ok(
    map.details.every(({ tile }) => tile >= 0 && tile < TINY_DUNGEON_TILESET_TILE_COUNT),
  );

  const expectedTiles = new Set(Object.values(DUNGEON_TILES));
  assert.ok(map.details.every(({ tile }) => expectedTiles.has(tile)));

  const zones = {
    royalCore: map.details.filter(({ tx, ty }) => [11, 13].includes(tx) && [1, 2].includes(ty)),
    forge: map.details.filter(
      ({ tx, ty }) => (tx === 18 && ty === 3) || (tx === 17 && ty === 4),
    ),
    beyondGate: map.details.filter(
      ({ tx, ty }) => [11, 12].includes(tx) && [14, 15].includes(ty),
    ),
  };
  assert.deepEqual(Object.fromEntries(
    Object.entries(zones).map(([zone, details]) => [zone, details.length]),
  ), {
    royalCore: 4,
    forge: 2,
    beyondGate: 4,
  });

  for (const [detailIndex, detail] of map.details.entries()) {
    const index = detail.ty * map.width + detail.tx;
    assert.equal(
      map.objects[index],
      EXPECTED_BASE_TILES[detailIndex],
      `detail ${detail.tx},${detail.ty} needs its audited Tiny Town base`,
    );
    assert.equal(
      map.solid[index],
      EXPECTED_SOLIDITY[detailIndex],
      `detail ${detail.tx},${detail.ty} cannot change the intended passage`,
    );
    assert.equal(
      map.interactions.some(({ tx, ty }) => tx === detail.tx && ty === detail.ty),
      false,
    );
    assert.equal(map.npcs.some(({ tx, ty }) => tx === detail.tx && ty === detail.ty), false);
  }
});

test('G3.2 is deterministic and leaves ground, objects and collision at the G1 baseline', () => {
  const first = createGrimalkin();
  const second = createGrimalkin();

  assert.deepEqual(second, first);
  assert.equal(hashLayer(first.ground), BASE_LAYER_HASHES.ground);
  assert.equal(hashLayer(first.objects), BASE_LAYER_HASHES.objects);
  assert.equal(hashLayer(first.solid), BASE_LAYER_HASHES.solid);
});

test('G3.2 returns a defensive detail copy for every map instance', () => {
  const first = createGrimalkin();
  const second = createGrimalkin();

  first.details[0].tx = 0;
  first.details.push({ tx: 0, ty: 0, tile: DUNGEON_TILES.floorDebris });

  assert.deepEqual(second.details, EXPECTED_DETAILS);
  assert.deepEqual(createGrimalkin().details, EXPECTED_DETAILS);
});

test('G3.2 preserves two reachable approaches to every interaction and NPC', () => {
  const map = createGrimalkin();
  const reachable = getReachableTiles(map);

  for (const landmark of [...map.interactions, ...map.npcs]) {
    const approaches = [];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx !== 0 || dy !== 0) approaches.push(`${landmark.tx + dx},${landmark.ty + dy}`);
      }
    }
    assert.ok(
      approaches.filter((position) => reachable.has(position)).length >= 2,
      `${'label' in landmark ? landmark.label : landmark.name} lost an approach`,
    );
  }
});

test('G3.2 keeps the four-tile south gate corridor open from the city interior', () => {
  const map = createGrimalkin();
  const gateCorridor = [
    { tx: 11, ty: 14 },
    { tx: 12, ty: 14 },
    { tx: 11, ty: 15 },
    { tx: 12, ty: 15 },
  ];
  const start = {
    tx: Math.floor(map.spawn.x / TILE),
    ty: Math.floor(map.spawn.y / TILE),
  };

  for (const tile of gateCorridor) {
    assert.equal(
      map.solid[tile.ty * map.width + tile.tx],
      false,
      `south gate tile ${tile.tx},${tile.ty} must stay passable`,
    );
  }

  for (const target of gateCorridor.filter(({ ty }) => ty === map.height - 1)) {
    const path = findPath(map, start, target);
    assert.ok(path, `spawn must reach the south exit at ${target.tx},${target.ty}`);
    assert.ok(
      path.some(({ tx, ty }) => ty === 14 && (tx === 11 || tx === 12)),
      'the interior-to-exterior route must cross the gatehouse opening',
    );
    assert.deepEqual(path.at(-1), target);
  }
});

test('G3.2 sorts each audited base tile before its detail on the same baseline', () => {
  const map = createGrimalkin();

  for (const [detailIndex, detail] of map.details.entries()) {
    const baselineY = (detail.ty + 1) * TILE;
    const baseOrder = detail.ty * map.width + detail.tx;
    const detailOrder = baseOrder + (detailIndex + 1) / (map.details.length + 1);
    const items = [
      { baselineY, order: detailOrder, value: 'detail' },
      { baselineY, order: baseOrder, value: 'base' },
    ];

    assert.deepEqual(
      sortByDepth(items).map(({ value }) => value),
      ['base', 'detail'],
      `base at ${detail.tx},${detail.ty} must render before its detail`,
    );
  }
});
