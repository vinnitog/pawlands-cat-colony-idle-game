import test from 'node:test';
import assert from 'node:assert/strict';
import { shopsById } from '../src/game/data/shop.ts';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { getLeader } from '../src/game/systems/colonySystem.ts';
import { buyShopItem } from '../src/game/systems/shopSystem.ts';

function withGems(n) {
  const state = createInitialGameState(1000);
  state.resources.gems = n;
  return state;
}

function withCoins(n) {
  const state = createInitialGameState(1000);
  state.resources.coins = n;
  return state;
}

test('every shop item has exactly one positive currency cost', () => {
  for (const shop of Object.values(shopsById)) {
    for (const item of shop.items) {
      const costs = [item.gemCost, item.coinCost].filter(
        (cost) => cost !== undefined,
      );
      assert.equal(costs.length, 1, item.id);
      assert.equal(costs[0] > 0, true, item.id);
      assert.ok(item.icon, `${item.id} has an icon`);
      assert.ok(item.category, `${item.id} has a category`);
    }
  }
});

test('cannot buy without enough gems', () => {
  const result = buyShopItem(withGems(0), 'royalMeal');
  assert.equal(result.ok, false);
});

test('royal meal refills energy and spends gems', () => {
  const state = withGems(1);
  state.cats[0].energy = 5;
  const result = buyShopItem(state, 'royalMeal');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.resources.gems, 0);
  assert.equal(getLeader(result.state).energy, getLeader(result.state).maxEnergy);
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
  const baseLuck = getLeader(state).stats.luck;
  const result = buyShopItem(state, 'otherBlessing');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(getLeader(result.state).stats.luck, baseLuck + 1);
  assert.equal(result.state.resources.gems, 0);
});

test("blacksmith's steel claw raises attack", () => {
  const state = withGems(5);
  const baseAttack = getLeader(state).stats.attack;
  const result = buyShopItem(state, 'steelClaw');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(getLeader(result.state).stats.attack, baseAttack + 1);
  assert.equal(result.state.resources.gems, 0);
});

test('blacksmith gear spends coins and adds an unequipped inventory piece', () => {
  const state = withCoins(100);
  const result = buyShopItem(state, 'ironClaw');
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.state.resources.coins, 0);
  assert.equal(result.state.inventory.ironClaw, 1);
  assert.equal(getLeader(result.state).equipment.weapon, null);
});

test('coin gear purchase fails immutably when the player cannot pay', () => {
  const state = withCoins(139);
  const result = buyShopItem(state, 'guardArmor');

  assert.equal(result.ok, false);
  assert.equal(result.state, state);
  assert.equal(state.resources.coins, 139);
  assert.equal(state.inventory.guardArmor, 0);
});
