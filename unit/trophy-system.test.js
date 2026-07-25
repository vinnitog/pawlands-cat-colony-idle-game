import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { loadGame, saveGame } from '../src/game/storage/saveManager.ts';
import { sellTrophy } from '../src/game/systems/trophySystem.ts';

test('selling one trophy removes one and adds its exact coin value', () => {
  const state = createInitialGameState(1_000);
  state.inventory.ancientBoneCharm = 3;
  const beforeCoins = state.resources.coins;
  const beforeEarned = state.totals.resourcesEarned.coins;

  const result = sellTrophy(state, 'ancientBoneCharm', 'one');
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.quantity, 1);
  assert.equal(result.coins, 65);
  assert.equal(result.state.inventory.ancientBoneCharm, 2);
  assert.equal(result.state.resources.coins, beforeCoins + 65);
  assert.equal(result.state.totals.resourcesEarned.coins, beforeEarned + 65);
  assert.equal(state.inventory.ancientBoneCharm, 3);
});

test('selling all trophies conserves quantity times unit value and refreshes missions', () => {
  const state = createInitialGameState(1_000);
  state.inventory.eclipseShard = 2;
  const result = sellTrophy(state, 'eclipseShard', 'all');
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.quantity, 2);
  assert.equal(result.coins, 280);
  assert.equal(result.state.inventory.eclipseShard, 0);
  assert.equal(result.state.resources.coins, 300);
  assert.equal(result.state.totals.resourcesEarned.coins, 280);
  assert.equal(result.state.missions.saveCoins100.completed, true);
  assert.equal(result.state.missions.crownTribute250.completed, true);
});

test('zero inventory, invalid ids, invalid modes, gear, and specials fail immutably', () => {
  const state = createInitialGameState(1_000);

  for (const [id, mode] of [
    ['soulAmulet', 'all'],
    ['notATrophy', 'one'],
    ['ironClaw', 'one'],
    ['rareFeather', 'one'],
    ['spectralSardine', 'some'],
  ]) {
    const result = sellTrophy(state, id, mode);
    assert.equal(result.ok, false);
    assert.equal(result.state, state);
  }
});

test('selling one trophy never changes any other inventory item', () => {
  const state = createInitialGameState(1_000);
  state.inventory.spectralSardine = 2;
  state.inventory.soulAmulet = 1;
  state.inventory.ironClaw = 3;
  state.inventory.rareFeather = 4;
  const before = { ...state.inventory };

  const result = sellTrophy(state, 'spectralSardine', 'one');
  assert.equal(result.ok, true);
  if (!result.ok) return;

  for (const [itemId, quantity] of Object.entries(before)) {
    assert.equal(
      result.state.inventory[itemId],
      itemId === 'spectralSardine' ? quantity - 1 : quantity,
      itemId,
    );
  }
});

test('unsafe trophy quantity and sale product fail without mutating state', () => {
  const unsafeQuantity = createInitialGameState(1_000);
  unsafeQuantity.inventory.eclipseShard = Number.MAX_VALUE;
  const unsafeQuantityResult = sellTrophy(unsafeQuantity, 'eclipseShard', 'all');
  assert.equal(unsafeQuantityResult.ok, false);
  assert.equal(unsafeQuantityResult.state, unsafeQuantity);
  if (!unsafeQuantityResult.ok) assert.match(unsafeQuantityResult.reason, /quantidade/i);

  const unsafeProduct = createInitialGameState(1_000);
  unsafeProduct.inventory.eclipseShard =
    Math.floor(Number.MAX_SAFE_INTEGER / 140) + 1;
  const unsafeProductResult = sellTrophy(unsafeProduct, 'eclipseShard', 'all');
  assert.equal(unsafeProductResult.ok, false);
  assert.equal(unsafeProductResult.state, unsafeProduct);
  if (!unsafeProductResult.ok) assert.match(unsafeProductResult.reason, /valor total/i);
});

test('unsafe projected coin balances fail immutably', () => {
  for (const balance of ['resources', 'earned']) {
    const state = createInitialGameState(1_000);
    state.inventory.eclipseShard = 1;
    if (balance === 'resources') {
      state.resources.coins = Number.MAX_VALUE;
    } else {
      state.totals.resourcesEarned.coins = Number.MAX_SAFE_INTEGER;
    }

    const result = sellTrophy(state, 'eclipseShard', 'one');
    assert.equal(result.ok, false, balance);
    assert.equal(result.state, state, balance);
    if (!result.ok) assert.match(result.reason, /limite seguro de moedas/i);
  }
});

test('a sale may reach the exact maximum safe coin balance', () => {
  const state = createInitialGameState(1_000);
  state.inventory.eclipseShard = 1;
  state.resources.coins = Number.MAX_SAFE_INTEGER - 140;
  state.totals.resourcesEarned.coins = Number.MAX_SAFE_INTEGER - 140;

  const result = sellTrophy(state, 'eclipseShard', 'one');

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.resources.coins, Number.MAX_SAFE_INTEGER);
  assert.equal(
    result.state.totals.resourcesEarned.coins,
    Number.MAX_SAFE_INTEGER,
  );
});

test('NaN, Infinity, negative, and fractional trophy counts fail immutably', () => {
  for (const quantity of [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    -1,
    1.5,
  ]) {
    const state = createInitialGameState(1_000);
    state.inventory.soulAmulet = quantity;
    const result = sellTrophy(state, 'soulAmulet', 'all');

    assert.equal(result.ok, false, String(quantity));
    assert.equal(result.state, state, String(quantity));
    assert.equal(state.inventory.soulAmulet, quantity);
    assert.equal(state.resources.coins, 20);
    assert.equal(state.totals.resourcesEarned.coins, 0);
  }
});

test('sold trophies, coins, totals, and missions survive a save round-trip', () => {
  const state = createInitialGameState(1_000);
  state.inventory.eclipseShard = 2;
  state.inventory.soulAmulet = 1;
  const sold = sellTrophy(state, 'eclipseShard', 'all');
  assert.equal(sold.ok, true);
  if (!sold.ok) return;

  let stored = null;
  const adapter = {
    read: () => stored,
    write: (_key, value) => {
      stored = value;
    },
    remove: () => {
      stored = null;
    },
  };
  saveGame(sold.state, adapter, 2_000);
  const loaded = loadGame(adapter);

  assert.equal(loaded.inventory.eclipseShard, 0);
  assert.equal(loaded.inventory.soulAmulet, 1);
  assert.equal(loaded.resources.coins, 300);
  assert.equal(loaded.totals.resourcesEarned.coins, 280);
  assert.equal(loaded.missions.saveCoins100.completed, true);
  assert.equal(loaded.missions.crownTribute250.completed, true);

  const duplicate = sellTrophy(loaded, 'eclipseShard', 'all');
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.state, loaded);
});
