import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { buyShopItem } from '../src/game/systems/shopSystem.ts';

function withGems(n) {
  const state = createInitialGameState(1000);
  state.resources.gems = n;
  return state;
}

test('cannot buy without enough gems', () => {
  const result = buyShopItem(withGems(0), 'royalMeal');
  assert.equal(result.ok, false);
});

test('royal meal refills energy and spends gems', () => {
  const state = withGems(1);
  state.cat.energy = 5;
  const result = buyShopItem(state, 'royalMeal');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.resources.gems, 0);
  assert.equal(result.state.cat.energy, result.state.cat.maxEnergy);
});

test('coin purse converts gems into coins', () => {
  const result = buyShopItem(withGems(3), 'coinPurse');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.resources.gems, 0);
  assert.equal(result.state.resources.coins, 20 + 150); // initial 20 + purse
});

test('blessing permanently raises luck', () => {
  const state = withGems(5);
  const baseLuck = state.cat.stats.luck;
  const result = buyShopItem(state, 'otherBlessing');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.cat.stats.luck, baseLuck + 1);
  assert.equal(result.state.resources.gems, 0);
});
