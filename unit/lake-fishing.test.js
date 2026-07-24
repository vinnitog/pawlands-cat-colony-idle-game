import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { startActivity, completeCurrentActivity } from '../src/game/systems/activitySystem.ts';
import { migrateGameSave } from '../src/game/storage/migrations.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
// Day 0's featured activity is huntMice, so fishPond is NOT featured here —
// this isolates the lake bonus from the daily bonus.
const DAY0 = 60_000;
const FISH_DURATION = 8 * 60_000;

function fishOnce(atLake) {
  const state = createInitialGameState(DAY0);
  const started = startActivity(state, 'fishPond', DAY0, atLake ? { atLake: true } : undefined);
  assert.equal(started.ok, true);
  return completeCurrentActivity(started.state, DAY0 + FISH_DURATION + 1, () => 0);
}

test('startActivity flags fishing at the lake', () => {
  const state = createInitialGameState(DAY0);
  const menu = startActivity(state, 'fishPond', DAY0);
  assert.equal(menu.ok, true);
  if (!menu.ok) return;
  assert.equal(menu.state.activeActivity.atLake, undefined);

  const lake = startActivity(state, 'fishPond', DAY0, { atLake: true });
  assert.equal(lake.ok, true);
  if (!lake.ok) return;
  assert.equal(lake.state.activeActivity.atLake, true);
});

test('fishing at the lake yields more fish and XP than the menu', () => {
  const menu = fishOnce(false);
  const lake = fishOnce(true);

  assert.equal(menu.reward.resources.fish, 3);
  assert.equal(menu.reward.xp, 20);

  assert.equal(lake.reward.resources.fish, 4); // 3 x1.5 floored
  assert.equal(lake.reward.xp, 25); // 20 x1.25
  // Coins are unaffected by the location bonus.
  assert.equal(lake.reward.resources.coins, menu.reward.resources.coins);
});

test('the lake flag survives a save migration', () => {
  const state = createInitialGameState(DAY0);
  const started = startActivity(state, 'fishPond', DAY0, { atLake: true });
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const migrated = migrateGameSave(started.state);
  assert.equal(migrated.activeActivity?.atLake, true);
});
