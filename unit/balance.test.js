import test from 'node:test';
import assert from 'node:assert/strict';
import { activityById } from '../src/game/data/activities.ts';
import { upgradeById } from '../src/game/data/upgrades.ts';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { buyUpgrade } from '../src/game/systems/upgradeSystem.ts';

test('fishing takes 8 minutes (lifted from the weakest core XP/min)', () => {
  assert.equal(activityById.fishPond.durationMs, 8 * 60_000);
});

test('cardboard box level 3 costs only one cardboard box', () => {
  assert.equal(upgradeById.cardboardBox.costsByNextLevel[3].cardboardBoxes, 1);
});

test('a stocked colony can climb the cardboard box to level 3', () => {
  const state = {
    ...createInitialGameState(1000),
    resources: {
      ...createInitialGameState(1000).resources,
      coins: 200,
      cardboardBoxes: 2,
      yarn: 20,
    },
  };

  const toL2 = buyUpgrade(state, 'cardboardBox');
  assert.equal(toL2.ok, true);
  if (!toL2.ok) return;

  const toL3 = buyUpgrade(toL2.state, 'cardboardBox');
  assert.equal(toL3.ok, true);
  if (!toL3.ok) return;

  assert.equal(toL3.state.upgrades.cardboardBox.level, 3);
  // Two boxes in, one per level, none left over.
  assert.equal(toL3.state.resources.cardboardBoxes, 0);
  assert.equal(toL3.state.cats[0].maxEnergy, 60); // 40 + 10 + 10
});
