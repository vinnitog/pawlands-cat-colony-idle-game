import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { startActivity, completeCurrentActivity } from '../src/game/systems/activitySystem.ts';
import { claimMission, refreshMissionProgress } from '../src/game/systems/missionSystem.ts';

test('new colony starts with zero gems', () => {
  const state = createInitialGameState(1000);
  assert.equal(state.resources.gems, 0);
});

test('milestone mission grants gems', () => {
  const state = createInitialGameState(1000);
  state.resources.coins = 100;
  const refreshed = refreshMissionProgress(state);
  assert.equal(refreshed.missions.saveCoins100.completed, true);

  const result = claimMission(refreshed, 'saveCoins100');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.gems, 1);
  assert.equal(result.state.resources.gems, 1);
});

test('exploring the yard can drop a gem', () => {
  const state = createInitialGameState(1000);
  const started = startActivity(state, 'exploreYard', 1000);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  // random()=0 makes every chance-based drop fire
  const done = completeCurrentActivity(started.state, 1000 + 20 * 60_000 + 1, () => 0);
  assert.equal(done.completed, true);
  assert.ok((done.reward.resources.gems ?? 0) >= 1);
  assert.ok(done.state.resources.gems >= 1);
});
