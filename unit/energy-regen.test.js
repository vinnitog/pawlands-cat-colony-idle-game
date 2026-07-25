import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { applyEnergyRegen, ENERGY_REGEN_MS_PER_POINT } from '../src/game/systems/energySystem.ts';
import { startActivity } from '../src/game/systems/activitySystem.ts';
import { processOfflineProgress } from '../src/game/systems/offlineSystem.ts';
import { migrateGameSave } from '../src/game/storage/migrations.ts';
import { getLeader } from '../src/game/systems/colonySystem.ts';
import { startExpedition } from '../src/game/systems/expeditionSystem.ts';

const MIN = 60_000;

function tiredState(now, energy = 10) {
  const state = createInitialGameState(now);
  return { ...state, cats: state.cats.map((cat) => ({ ...cat, energy })) };
}

test('idle cat regens 1 energy per 2 minutes, capped at max', () => {
  const state = tiredState(0, 10);

  const after10 = applyEnergyRegen(state, 10 * MIN);
  assert.equal(getLeader(after10).energy, 15);
  assert.equal(after10.lastEnergyRegenAt, 10 * MIN);

  const capped = applyEnergyRegen(tiredState(0, 39), 60 * MIN);
  assert.equal(getLeader(capped).energy, 40);
});

test('fractional progress is preserved between ticks', () => {
  const state = tiredState(0, 10);

  // 3 minutes: 1 whole point, baseline advances only 2 minutes.
  const after3 = applyEnergyRegen(state, 3 * MIN);
  assert.equal(getLeader(after3).energy, 11);
  assert.equal(after3.lastEnergyRegenAt, 2 * MIN);

  // 1 more minute completes the second point.
  const after4 = applyEnergyRegen(after3, 4 * MIN);
  assert.equal(getLeader(after4).energy, 12);
});

test('busy cat misses ticks and cannot bank regen for later', () => {
  const state = tiredState(0, 10);
  const started = startActivity(state, 'huntMice', 0);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const busyEnergy = getLeader(started.state).energy;

  // 10 minutes pass while working: no regen, but the baseline advances.
  const during = applyEnergyRegen(started.state, 10 * MIN);
  assert.equal(getLeader(during).energy, busyEnergy);
  assert.equal(during.lastEnergyRegenAt, 10 * MIN);

  // Freed at the same instant: nothing accrued retroactively.
  const freed = { ...during, cats: during.cats.map((cat) => ({ ...cat, activity: null })) };
  const after = applyEnergyRegen(freed, 10 * MIN);
  assert.equal(getLeader(after).energy, busyEnergy);
});

test('expedition cat does not regenerate energy online or offline', () => {
  const state = tiredState(0, 10);
  const catId = getLeader(state).id;
  const started = startExpedition(state, catId, 'whisperingFields', 0);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const online = applyEnergyRegen(started.state, 10 * MIN);
  assert.equal(getLeader(online).energy, 10);
  assert.equal(online.lastEnergyRegenAt, 10 * MIN);

  const offline = processOfflineProgress(started.state, 30 * MIN, () => 0.99);
  assert.equal(getLeader(offline.state).energy, 10);
  assert.equal(offline.state.lastEnergyRegenAt, 30 * MIN);
});

test('offline progress applies regen with and without an activity', () => {
  const idle = processOfflineProgress(tiredState(0, 10), 30 * MIN, () => 0);
  assert.equal(getLeader(idle.state).energy, 25);

  // searchYarn (3 min, -3 energia) completes offline; regen resumes after the
  // baseline advanced past the busy window.
  const started = startActivity(tiredState(0, 10), 'searchYarn', 0);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const done = processOfflineProgress(started.state, 30 * MIN, () => 0);
  assert.equal(done.activityCompleted, true);
  // 10 - 3 (cost) + 15 (30 min of regen after completion frees the cat)
  assert.equal(getLeader(done.state).energy, 22);
});

test('clock rollback re-anchors the baseline instead of freezing regen', () => {
  const state = { ...tiredState(0, 10), lastEnergyRegenAt: 100 * MIN };
  const rolled = applyEnergyRegen(state, 50 * MIN);
  assert.equal(getLeader(rolled).energy, 10);
  assert.equal(rolled.lastEnergyRegenAt, 50 * MIN);
});

test('old saves default the regen baseline to lastSavedAt', () => {
  const v1 = {
    schemaVersion: 1,
    cat: { name: 'Nera' },
    lastSavedAt: 5_000,
  };
  const migrated = migrateGameSave(v1);
  assert.equal(migrated.lastEnergyRegenAt, 5_000);
});
