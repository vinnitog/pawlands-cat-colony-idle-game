import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { startActivity } from '../src/game/systems/activitySystem.ts';
import { addXpToState } from '../src/game/systems/levelSystem.ts';
import { processOfflineProgress } from '../src/game/systems/offlineSystem.ts';
import { buyUpgrade } from '../src/game/systems/upgradeSystem.ts';
import { claimMission, getPendingMissionCount } from '../src/game/systems/missionSystem.ts';
import { clearGame, saveGame, loadGame, saveKey } from '../src/game/storage/saveManager.ts';

function fixedRandom() {
  return 0;
}

test('offline progress completes one finished activity once', () => {
  const startAt = 1_000;
  const state = createInitialGameState(startAt);
  const started = startActivity(state, 'searchYarn', startAt);

  assert.equal(started.ok, true);
  if (!started.ok) return;

  const completed = processOfflineProgress(started.state, startAt + 3 * 60_000 + 1, fixedRandom);

  assert.equal(completed.activityCompleted, true);
  assert.equal(completed.state.activeActivity, null);
  assert.equal(completed.state.resources.yarn, 2);
  assert.equal(completed.state.cat.xp, 10);
  assert.equal(completed.state.totals.activitiesCompleted, 1);
  assert.equal(completed.state.missions.completeFirstActivity.completed, true);

  const secondOpen = processOfflineProgress(completed.state, startAt + 3 * 60_000 + 2, fixedRandom);

  assert.equal(secondOpen.activityCompleted, false);
  assert.equal(secondOpen.reward, null);
  assert.equal(secondOpen.state.resources.yarn, 2);
  assert.equal(secondOpen.state.totals.activitiesCompleted, 1);
});

test('offline progress keeps unfinished activity active', () => {
  const startAt = 2_000;
  const state = createInitialGameState(startAt);
  const started = startActivity(state, 'fishPond', startAt);

  assert.equal(started.ok, true);
  if (!started.ok) return;

  const result = processOfflineProgress(started.state, startAt + 5 * 60_000, fixedRandom);

  assert.equal(result.activityCompleted, false);
  assert.equal(result.reward, null);
  assert.equal(result.state.activeActivity?.activityId, 'fishPond');
  assert.equal(result.state.lastSavedAt, startAt + 5 * 60_000);
});

test('offline progress handles no activity, clock rollback, and exact completion edge', () => {
  const state = createInitialGameState(10_000);
  const rollback = processOfflineProgress(state, 5_000, fixedRandom);

  assert.equal(rollback.offlineDurationMs, 0);
  assert.equal(rollback.activityCompleted, false);
  assert.equal(rollback.state.lastSavedAt, 5_000);

  const started = startActivity(state, 'searchYarn', 10_000);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const exactEnd = processOfflineProgress(started.state, 10_000 + 3 * 60_000, fixedRandom);

  assert.equal(exactEnd.activityCompleted, true);
  assert.equal(exactEnd.state.activeActivity, null);
});

test('start activity blocks busy cat and insufficient energy', () => {
  const state = createInitialGameState(11_000);
  const started = startActivity(state, 'fishPond', 11_000);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const busy = startActivity(started.state, 'huntMice', 12_000);
  assert.equal(busy.ok, false);

  const tiredState = {
    ...state,
    cat: {
      ...state.cat,
      energy: 2,
    },
  };
  const tired = startActivity(tiredState, 'huntMice', 12_000);
  assert.equal(tired.ok, false);
});

test('sleep restores energy without exceeding max energy', () => {
  const state = createInitialGameState(12_000);
  const tiredState = {
    ...state,
    cat: {
      ...state.cat,
      energy: 35,
    },
  };
  const started = startActivity(tiredState, 'sleep', 12_000);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const slept = processOfflineProgress(started.state, 12_000 + 15 * 60_000, fixedRandom);

  assert.equal(slept.activityCompleted, true);
  assert.equal(slept.state.cat.energy, 40);
});

test('level system applies level up, stat gains, and coin bonus', () => {
  const state = createInitialGameState(3_000);
  const result = addXpToState(state, 150);

  assert.equal(result.levelsGained, 1);
  assert.equal(result.coinsAwarded, 15);
  assert.equal(result.state.cat.level, 2);
  assert.equal(result.state.cat.xp, 0);
  assert.equal(result.state.cat.stats.hunting, 4);
  assert.equal(result.state.resources.coins, 35);
});

test('buying cardboard box upgrade spends resources and updates mission progress', () => {
  const state = createInitialGameState(4_000);
  const prepared = {
    ...state,
    resources: {
      ...state.resources,
      coins: 40,
    },
  };

  const result = buyUpgrade(prepared, 'cardboardBox');

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.state.resources.coins, 0);
  assert.equal(result.state.resources.cardboardBoxes, 0);
  assert.equal(result.state.upgrades.cardboardBox.level, 2);
  assert.equal(result.state.cat.maxEnergy, 50);
  assert.equal(result.state.missions.upgradeCardboard2.completed, true);
});

test('upgrade purchase rejects insufficient resources and max level', () => {
  const state = createInitialGameState(4_500);
  const insufficient = buyUpgrade(state, 'cardboardBox');
  assert.equal(insufficient.ok, false);

  const maxed = {
    ...state,
    upgrades: {
      ...state.upgrades,
      cardboardBox: {
        id: 'cardboardBox',
        level: 3,
      },
    },
  };
  const maxResult = buyUpgrade(maxed, 'cardboardBox');
  assert.equal(maxResult.ok, false);
});

test('mission claim rewards once and pending count follows claimed state', () => {
  const state = createInitialGameState(4_600);
  const completed = processOfflineProgress(startActivity(state, 'searchYarn', 4_600).state, 4_600 + 3 * 60_000, fixedRandom).state;

  assert.equal(getPendingMissionCount(completed), 1);

  const claim = claimMission(completed, 'completeFirstActivity');
  assert.equal(claim.ok, true);
  if (!claim.ok) return;

  assert.equal(claim.state.resources.coins, completed.resources.coins + 20);
  assert.equal(getPendingMissionCount(claim.state), 0);

  const secondClaim = claimMission(claim.state, 'completeFirstActivity');
  assert.equal(secondClaim.ok, false);

  const incompleteClaim = claimMission(claim.state, 'collectFish10');
  assert.equal(incompleteClaim.ok, false);
});

test('save manager uses an adapter and stores a timestamped save', () => {
  const memory = new Map();
  const adapter = {
    read: (key) => memory.get(key) ?? null,
    write: (key, value) => memory.set(key, value),
    remove: (key) => memory.delete(key),
  };
  const state = createInitialGameState(5_000);

  saveGame(state, adapter, 9_000);
  const raw = JSON.parse(memory.get(saveKey));
  const loaded = loadGame(adapter);

  assert.equal(raw.lastSavedAt, 9_000);
  assert.equal(loaded.cat.name, 'Milo');
  assert.equal(loaded.lastSavedAt, 9_000);
});

test('save manager tolerates missing, corrupted, invalid, and unavailable storage', () => {
  const missingAdapter = {
    read: () => null,
    write: () => undefined,
    remove: () => undefined,
  };
  assert.equal(loadGame(missingAdapter).cat.name, 'Milo');

  const corruptedAdapter = {
    read: () => '{not-json',
    write: () => undefined,
    remove: () => undefined,
  };
  assert.equal(loadGame(corruptedAdapter).cat.name, 'Milo');

  const partialAdapter = {
    read: () => JSON.stringify({ schemaVersion: 1, cat: { name: 'Nina' } }),
    write: () => undefined,
    remove: () => undefined,
  };
  const partial = loadGame(partialAdapter);
  assert.equal(partial.cat.name, 'Nina');
  assert.equal(partial.missions.completeFirstActivity.completed, false);
  assert.equal(partial.resources.coins, 20);

  const throwingAdapter = {
    read: () => {
      throw new Error('blocked');
    },
    write: () => {
      throw new Error('quota');
    },
    remove: () => {
      throw new Error('blocked');
    },
  };
  assert.equal(loadGame(throwingAdapter).cat.name, 'Milo');
  assert.doesNotThrow(() => saveGame(createInitialGameState(), throwingAdapter));
  assert.doesNotThrow(() => clearGame(throwingAdapter));
});
