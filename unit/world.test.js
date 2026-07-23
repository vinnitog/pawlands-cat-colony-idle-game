import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { migrateGameSave } from '../src/game/storage/migrations.ts';

test('initial state has a world spawn position', () => {
  const state = createInitialGameState(1000);
  assert.equal(typeof state.world.x, 'number');
  assert.equal(typeof state.world.y, 'number');
});

test('migration preserves a saved world position', () => {
  const saved = { ...createInitialGameState(1000), world: { x: 50, y: 60 } };
  const migrated = migrateGameSave(saved);
  assert.deepEqual(migrated.world, { x: 50, y: 60 });
});

test('migration falls back to a spawn when world is missing or invalid', () => {
  const saved = { ...createInitialGameState(1000), world: { x: 'nope' } };
  const migrated = migrateGameSave(saved);
  assert.equal(typeof migrated.world.x, 'number');
  assert.equal(typeof migrated.world.y, 'number');
});
