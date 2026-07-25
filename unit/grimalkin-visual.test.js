import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  TILE,
  TILESET_TILE_COUNT,
  WORLD_PLAYER_COLLISION_HALF_SIZE,
  createGrimalkin,
  resolveWorldPosition,
} from '../src/game/world/tinyTown.ts';

const interactionContract = [
  ['missions', 8, 8],
  ['upgrades', 15, 8],
  ['expedition', 12, 12],
  ['fish', 7, 12],
];

function reachableTiles(map) {
  const start = {
    x: Math.floor(map.spawn.x / TILE),
    y: Math.floor(map.spawn.y / TILE),
  };
  const queue = [start];
  const visited = new Set([`${start.x},${start.y}`]);

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: current.x + dx, y: current.y + dy };
      const key = `${next.x},${next.y}`;
      if (
        next.x < 0
        || next.y < 0
        || next.x >= map.width
        || next.y >= map.height
        || map.solid[next.y * map.width + next.x]
        || visited.has(key)
      ) {
        continue;
      }
      visited.add(key);
      queue.push(next);
    }
  }

  return visited;
}

test('G1 ships the audited 192x192 Tiny Town atlas and its CC0 license', () => {
  const atlas = readFileSync(join(process.cwd(), 'public/tiles/tiny_town.png'));
  assert.deepEqual(
    [...atlas.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
    'Tiny Town asset must remain a PNG',
  );
  assert.equal(atlas.toString('ascii', 12, 16), 'IHDR');
  assert.equal(atlas.readUInt32BE(16), 192);
  assert.equal(atlas.readUInt32BE(20), 192);

  const license = readFileSync(
    join(process.cwd(), 'public/tiles/tiny_town.license.txt'),
    'utf8',
  );
  assert.match(license, /Tiny Town \(1\.1\)/);
  assert.match(license, /Created\/distributed by Kenney/);
  assert.match(license, /Creative Commons Zero, CC0/);
});

test('G1 keeps the 24x16 world contract and valid Tiny Town indices', () => {
  const map = createGrimalkin();

  assert.equal(map.width, 24);
  assert.equal(map.height, 16);
  assert.equal(map.ground.length, 24 * 16);
  assert.equal(map.objects.length, 24 * 16);
  assert.equal(map.solid.length, 24 * 16);
  assert.deepEqual(createGrimalkin(), map, 'map generation must remain deterministic');

  for (const tile of [...map.ground, ...map.objects.filter((value) => value !== null)]) {
    assert.equal(Number.isInteger(tile), true);
    assert.ok(tile >= 0 && tile < TILESET_TILE_COUNT, `invalid atlas tile ${tile}`);
  }
  assert.equal(
    map.ground.some((tile) => tile >= 141 && tile <= 143),
    false,
    'transparent atlas cells cannot be used as ground',
  );
  assert.ok(map.ground.includes(0), 'plain grass is present');
  assert.ok(map.ground.includes(1), 'deterministic grass detail is present');
  assert.ok(map.ground.includes(2), 'deterministic flowers are present');

  const uniqueTiles = new Set([
    ...map.ground,
    ...map.objects.filter((value) => value !== null),
  ]);
  assert.ok(uniqueTiles.size >= 42, 'the city uses a broad but audited atlas vocabulary');
});

test('G1 preserves interactions, NPCs, spawn and landmark variety', () => {
  const map = createGrimalkin();

  assert.deepEqual(
    map.interactions.map(({ kind, tx, ty }) => [kind, tx, ty]),
    interactionContract,
  );
  assert.deepEqual(
    map.npcs.map(({ tx, ty }) => [tx, ty]),
    [[11, 7], [17, 8], [12, 6]],
  );
  assert.deepEqual(map.spawn, { x: 12 * TILE, y: 9 * TILE });
  for (const npc of map.npcs) {
    const index = npc.ty * map.width + npc.tx;
    assert.equal(map.objects[index], null, `${npc.name} cannot overlap a map object`);
    assert.equal(map.solid[index], true, `${npc.name} must keep its collision tile`);
  }

  const objectTiles = map.objects.filter((tile) => tile !== null);
  const uniqueObjects = new Set(objectTiles);
  assert.ok(uniqueObjects.size >= 20, 'fortress, houses, vegetation and props stay varied');
  assert.ok(map.ground.some((tile) => tile >= 132 && tile <= 140), 'pond is present');
  assert.ok(objectTiles.includes(48) && objectTiles.includes(52), 'diverse complete roofs are present');
  assert.ok(
    objectTiles.includes(60)
      && objectTiles.includes(63)
      && objectTiles.includes(64)
      && objectTiles.includes(67),
    'houses include the middle roof and gable rows',
  );
  assert.ok(objectTiles.includes(96) && objectTiles.includes(120), 'royal stone keep is present');
  assert.ok(
    objectTiles.includes(106) && objectTiles.includes(128) && objectTiles.includes(119),
    'the forge yard uses firewood, hammer and sword tiles',
  );
  assert.deepEqual(
    [9, 10, 11, 12, 13, 14].map((x) => map.objects[2 * map.width + x]),
    [108, 111, 112, 113, 114, 110],
    'the royal keep uses a readable arched facade',
  );
  assert.equal(map.objects[2 * map.width + 4], null, 'merchant houses keep breathing room');
  assert.equal(map.objects[2 * map.width + 8], null, 'merchant homes do not merge into the keep');
  assert.equal(map.objects[9 * map.width + 21], 50, 'props preserve the residential roof');
  assert.equal(map.solid[9 * map.width + 21], true, 'residential structure collision is preserved');
  assert.deepEqual(
    [10, 11, 12, 13].map((x) => map.objects[14 * map.width + x]),
    [111, 112, 113, 114],
  );
  assert.deepEqual(
    [11, 12, 13].map((x) => map.objects[15 * map.width + x]),
    [123, 124, 125],
  );
  for (const interaction of map.interactions) {
    assert.equal(
      map.objects[interaction.ty * map.width + interaction.tx],
      83,
      `${interaction.label} uses the Tiny Town sign marker`,
    );
  }

  const largeProps = new Set([81, 103, 104, 106, 107]);
  map.objects.forEach((tile, index) => {
    if (tile !== null && largeProps.has(tile)) {
      assert.equal(map.solid[index], true, `large prop ${tile} must block movement`);
    }
  });
  for (const mislabeledHistoricalTile of [5, 92, 117, 118, 130]) {
    assert.equal(
      objectTiles.includes(mislabeledHistoricalTile),
      false,
      `historically mislabeled tile ${mislabeledHistoricalTile} is not used as a prop`,
    );
  }
});

test('spawn reaches at least two approach tiles for every fixed interaction and NPC', () => {
  const map = createGrimalkin();
  const reachable = reachableTiles(map);

  for (const landmark of [...map.interactions, ...map.npcs]) {
    const adjacent = [];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        adjacent.push(`${landmark.tx + dx},${landmark.ty + dy}`);
      }
    }
    assert.ok(
      adjacent.filter((tile) => reachable.has(tile)).length >= 2,
      `${'label' in landmark ? landmark.label : landmark.name} needs two reachable approaches`,
    );
  }
});

test('saved world position stays when free and recovers safely when blocked or outside', () => {
  const map = createGrimalkin();
  for (const [wx, wy] of [
    [
      map.spawn.x - WORLD_PLAYER_COLLISION_HALF_SIZE,
      map.spawn.y - WORLD_PLAYER_COLLISION_HALF_SIZE,
    ],
    [
      map.spawn.x + WORLD_PLAYER_COLLISION_HALF_SIZE,
      map.spawn.y - WORLD_PLAYER_COLLISION_HALF_SIZE,
    ],
    [map.spawn.x - WORLD_PLAYER_COLLISION_HALF_SIZE, map.spawn.y],
    [map.spawn.x + WORLD_PLAYER_COLLISION_HALF_SIZE, map.spawn.y],
  ]) {
    assert.equal(
      map.solid[Math.floor(wy / TILE) * map.width + Math.floor(wx / TILE)],
      false,
      'the initial spawn footprint must not overlap collision',
    );
  }

  const valid = { x: map.spawn.x + 3, y: map.spawn.y + 2 };
  assert.strictEqual(resolveWorldPosition(map, valid), valid);

  for (const invalid of [
    { x: 1, y: 1 },
    { x: 2 * TILE + 2, y: 6 * TILE + TILE / 2 },
    { x: -100, y: 50 },
    { x: Number.NaN, y: Number.POSITIVE_INFINITY },
  ]) {
    const resolved = resolveWorldPosition(map, invalid);
    const tx = Math.floor(resolved.x / TILE);
    const ty = Math.floor(resolved.y / TILE);
    assert.ok(tx >= 0 && ty >= 0 && tx < map.width && ty < map.height);
    assert.equal(map.solid[ty * map.width + tx], false);
    for (const [wx, wy] of [
      [
        resolved.x - WORLD_PLAYER_COLLISION_HALF_SIZE,
        resolved.y - WORLD_PLAYER_COLLISION_HALF_SIZE,
      ],
      [
        resolved.x + WORLD_PLAYER_COLLISION_HALF_SIZE,
        resolved.y - WORLD_PLAYER_COLLISION_HALF_SIZE,
      ],
      [resolved.x - WORLD_PLAYER_COLLISION_HALF_SIZE, resolved.y],
      [resolved.x + WORLD_PLAYER_COLLISION_HALF_SIZE, resolved.y],
    ]) {
      assert.equal(
        map.solid[Math.floor(wy / TILE) * map.width + Math.floor(wx / TILE)],
        false,
        'the recovered player footprint must not overlap collision',
      );
    }
  }
});
