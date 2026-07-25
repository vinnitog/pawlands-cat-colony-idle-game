import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { missions } from '../src/game/data/missions.ts';
import { upgrades } from '../src/game/data/upgrades.ts';
import { getCurrentChronicleProgress } from '../src/game/systems/progressionSystem.ts';

test('current chronicle requires every mission claimed and every upgrade maxed', () => {
  const state = createInitialGameState(1_000);
  assert.deepEqual(getCurrentChronicleProgress(state), {
    allMissionsClaimed: false,
    allUpgradesMaxed: false,
    complete: false,
  });

  for (const mission of missions) {
    state.missions[mission.id].claimed = true;
  }
  assert.deepEqual(getCurrentChronicleProgress(state), {
    allMissionsClaimed: true,
    allUpgradesMaxed: false,
    complete: false,
  });

  for (const upgrade of upgrades) {
    state.upgrades[upgrade.id].level = upgrade.maxLevel;
  }
  assert.deepEqual(getCurrentChronicleProgress(state), {
    allMissionsClaimed: true,
    allUpgradesMaxed: true,
    complete: true,
  });

  state.missions[missions[0].id].claimed = false;
  assert.deepEqual(getCurrentChronicleProgress(state), {
    allMissionsClaimed: false,
    allUpgradesMaxed: true,
    complete: false,
  });
});
