import test from 'node:test';
import assert from 'node:assert/strict';
import { gear, gearById, isGearId } from '../src/game/data/gear.ts';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { migrateGameSave } from '../src/game/storage/migrations.ts';
import {
  equipGear,
  getCatAttributePower,
  getEquipmentPower,
  unequipGear,
} from '../src/game/systems/equipmentSystem.ts';
import {
  getCatPower,
  getExpeditionEfficiency,
} from '../src/game/systems/expeditionSystem.ts';
import { getLeader, recruitCat } from '../src/game/systems/colonySystem.ts';

test('gear catalog has stable ids, compatible slots, power, origin, price, and art', () => {
  assert.deepEqual(
    gear.map((item) => [item.id, item.slot, item.power]),
    [
      ['ironClaw', 'weapon', 2],
      ['guardArmor', 'armor', 2],
      ['mistFang', 'weapon', 5],
      ['grimaldeAegis', 'armor', 4],
    ],
  );
  assert.equal(new Set(gear.map((item) => item.id)).size, gear.length);
  assert.deepEqual(gearById.ironClaw.price, { coins: 100 });
  assert.deepEqual(gearById.guardArmor.price, { coins: 140 });
  assert.deepEqual(gearById.mistFang.origin, { kind: 'expedition', zoneId: 'mistwood' });
  assert.equal(gearById.grimaldeAegis.tier, 'rare');
  assert.equal(gear.every((item) => item.art.endsWith('.png')), true);
  assert.equal(isGearId('ironClaw'), true);
  assert.equal(isGearId('steelClaw'), false);
});

test('cat power derives equipped gear without persisting a power field', () => {
  const state = createInitialGameState(1_000);
  const base = getLeader(state);
  const equipped = {
    ...base,
    equipment: { weapon: 'mistFang', armor: 'grimaldeAegis' },
  };

  assert.equal(getCatAttributePower(base), 7.5);
  assert.equal(getEquipmentPower(equipped), 9);
  assert.equal(getCatPower(equipped), 16.5);
  assert.equal(Object.hasOwn(equipped, 'power'), false);
});

test('equip, swap, and unequip move only unequipped pieces through inventory', () => {
  const initial = createInitialGameState(1_000);
  initial.inventory.ironClaw = 1;
  initial.inventory.mistFang = 1;
  const catId = getLeader(initial).id;

  const equipped = equipGear(initial, catId, 'weapon', 'ironClaw');
  assert.equal(equipped.ok, true);
  if (!equipped.ok) return;
  assert.equal(getLeader(equipped.state).equipment.weapon, 'ironClaw');
  assert.equal(equipped.state.inventory.ironClaw, 0);
  assert.equal(initial.inventory.ironClaw, 1);

  const swapped = equipGear(equipped.state, catId, 'weapon', 'mistFang');
  assert.equal(swapped.ok, true);
  if (!swapped.ok) return;
  assert.equal(getLeader(swapped.state).equipment.weapon, 'mistFang');
  assert.equal(swapped.state.inventory.mistFang, 0);
  assert.equal(swapped.state.inventory.ironClaw, 1);

  const removed = unequipGear(swapped.state, catId, 'weapon');
  assert.equal(removed.ok, true);
  if (!removed.ok) return;
  assert.equal(getLeader(removed.state).equipment.weapon, null);
  assert.equal(removed.state.inventory.mistFang, 1);
});

test('one versus two copies conserve gear and update only the targeted cat', () => {
  const initial = createInitialGameState(1_000);
  initial.resources.gems = 10;
  const recruited = recruitCat(initial, () => 0, 2_000);
  assert.equal(recruited.ok, true);
  if (!recruited.ok) return;

  const leaderId = recruited.state.leaderId;
  const recruitId = recruited.cat.id;
  const oneCopy = {
    ...recruited.state,
    inventory: { ...recruited.state.inventory, ironClaw: 1 },
  };
  const recruitBefore = oneCopy.cats.find((cat) => cat.id === recruitId);
  const firstEquipped = equipGear(oneCopy, leaderId, 'weapon', 'ironClaw');
  assert.equal(firstEquipped.ok, true);
  if (!firstEquipped.ok) return;

  assert.equal(firstEquipped.state.inventory.ironClaw, 0);
  assert.equal(
    firstEquipped.state.cats.find((cat) => cat.id === leaderId)?.equipment.weapon,
    'ironClaw',
  );
  assert.equal(
    firstEquipped.state.cats.find((cat) => cat.id === recruitId),
    recruitBefore,
  );
  const deniedSecondCat = equipGear(
    firstEquipped.state,
    recruitId,
    'weapon',
    'ironClaw',
  );
  assert.equal(deniedSecondCat.ok, false);
  assert.equal(deniedSecondCat.state, firstEquipped.state);
  assert.equal(
    firstEquipped.state.inventory.ironClaw
      + firstEquipped.state.cats.filter(
        (cat) => cat.equipment.weapon === 'ironClaw',
      ).length,
    1,
  );

  const twoCopies = {
    ...recruited.state,
    inventory: { ...recruited.state.inventory, ironClaw: 2 },
  };
  const equippedLeader = equipGear(twoCopies, leaderId, 'weapon', 'ironClaw');
  assert.equal(equippedLeader.ok, true);
  if (!equippedLeader.ok) return;
  const leaderBeforeSecondEquip = equippedLeader.state.cats.find(
    (cat) => cat.id === leaderId,
  );
  const equippedRecruit = equipGear(
    equippedLeader.state,
    recruitId,
    'weapon',
    'ironClaw',
  );
  assert.equal(equippedRecruit.ok, true);
  if (!equippedRecruit.ok) return;

  assert.equal(equippedRecruit.state.inventory.ironClaw, 0);
  assert.equal(
    equippedRecruit.state.cats.find((cat) => cat.id === leaderId),
    leaderBeforeSecondEquip,
  );
  assert.equal(
    equippedRecruit.state.cats.find((cat) => cat.id === recruitId)?.equipment.weapon,
    'ironClaw',
  );
  assert.equal(
    equippedRecruit.state.inventory.ironClaw
      + equippedRecruit.state.cats.filter(
        (cat) => cat.equipment.weapon === 'ironClaw',
      ).length,
    2,
  );
});

test('equip, swap, and unequip update then restore expedition efficiency', () => {
  const initial = createInitialGameState(1_000);
  initial.inventory.ironClaw = 1;
  initial.inventory.mistFang = 1;
  const catId = initial.leaderId;
  const baseEfficiency = getExpeditionEfficiency(
    getLeader(initial),
    'mistwood',
  );

  const equipped = equipGear(initial, catId, 'weapon', 'ironClaw');
  assert.equal(equipped.ok, true);
  if (!equipped.ok) return;
  assert.equal(
    getExpeditionEfficiency(getLeader(equipped.state), 'mistwood'),
    (getCatPower(getLeader(initial)) + gearById.ironClaw.power) / 14,
  );

  const swapped = equipGear(equipped.state, catId, 'weapon', 'mistFang');
  assert.equal(swapped.ok, true);
  if (!swapped.ok) return;
  assert.equal(
    getExpeditionEfficiency(getLeader(swapped.state), 'mistwood'),
    (getCatPower(getLeader(initial)) + gearById.mistFang.power) / 14,
  );

  const unequipped = unequipGear(swapped.state, catId, 'weapon');
  assert.equal(unequipped.ok, true);
  if (!unequipped.ok) return;
  assert.equal(
    getExpeditionEfficiency(getLeader(unequipped.state), 'mistwood'),
    baseEfficiency,
  );
  assert.equal(unequipped.state.inventory.ironClaw, 1);
  assert.equal(unequipped.state.inventory.mistFang, 1);
});

test('equipment changes fail immutably for occupied cats, wrong slots, and missing pieces', () => {
  const state = createInitialGameState(1_000);
  state.inventory.ironClaw = 1;
  const catId = getLeader(state).id;

  const wrongSlot = equipGear(state, catId, 'armor', 'ironClaw');
  assert.equal(wrongSlot.ok, false);
  assert.equal(wrongSlot.state, state);

  const missing = equipGear(state, catId, 'weapon', 'mistFang');
  assert.equal(missing.ok, false);
  assert.equal(missing.state, state);

  const busyState = {
    ...state,
    cats: state.cats.map((cat) => ({
      ...cat,
      activity: { activityId: 'huntMice', startedAt: 0, endsAt: 1_000 },
    })),
  };
  const busy = equipGear(busyState, catId, 'weapon', 'ironClaw');
  assert.equal(busy.ok, false);
  assert.equal(busy.state, busyState);

  const empty = unequipGear(state, catId, 'weapon');
  assert.equal(empty.ok, false);
  assert.equal(empty.state, state);

  const invalidEquipSlot = equipGear(state, catId, 'trinket', 'ironClaw');
  assert.equal(invalidEquipSlot.ok, false);
  assert.equal(invalidEquipSlot.state, state);

  const invalidUnequipSlot = unequipGear(state, catId, '__proto__');
  assert.equal(invalidUnequipSlot.ok, false);
  assert.equal(invalidUnequipSlot.state, state);
});

test('equipment changes reject expedition cats, strangers, and the same equipped piece', () => {
  const initial = createInitialGameState(1_000);
  initial.inventory.ironClaw = 2;
  const catId = initial.leaderId;
  const equipped = equipGear(initial, catId, 'weapon', 'ironClaw');
  assert.equal(equipped.ok, true);
  if (!equipped.ok) return;

  const sameGear = equipGear(equipped.state, catId, 'weapon', 'ironClaw');
  assert.equal(sameGear.ok, false);
  assert.equal(sameGear.state, equipped.state);
  assert.equal(equipped.state.inventory.ironClaw, 1);

  const away = {
    ...equipped.state,
    cats: equipped.state.cats.map((cat) => ({
      ...cat,
      expedition: {
        zoneId: 'whisperingFields',
        startedAt: 1_000,
        lastProgressAt: 1_000,
        accumulatedPulses: 0,
      },
    })),
  };
  const blockedEquip = equipGear(away, catId, 'weapon', 'ironClaw');
  const blockedUnequip = unequipGear(away, catId, 'weapon');
  assert.equal(blockedEquip.ok, false);
  assert.equal(blockedEquip.state, away);
  assert.equal(blockedUnequip.ok, false);
  assert.equal(blockedUnequip.state, away);
  assert.equal(getLeader(away).equipment.weapon, 'ironClaw');
  assert.equal(away.inventory.ironClaw, 1);

  const missingEquip = equipGear(initial, 'missing-cat', 'weapon', 'ironClaw');
  const missingUnequip = unequipGear(initial, 'missing-cat', 'weapon');
  assert.equal(missingEquip.ok, false);
  assert.equal(missingEquip.state, initial);
  assert.equal(missingUnequip.ok, false);
  assert.equal(missingUnequip.state, initial);
});

test('save v1-v5 defaults and sanitizes equipment ids and slots', () => {
  for (const schemaVersion of [1, 2, 3]) {
    const legacy = schemaVersion === 1
      ? { schemaVersion, cat: { id: 'legacy', name: 'Bruma' } }
      : {
          schemaVersion,
          cats: [{ id: 'legacy', name: 'Bruma' }],
          leaderId: 'legacy',
        };
    const migrated = migrateGameSave(legacy);
    assert.equal(migrated.schemaVersion, 5);
    assert.deepEqual(getLeader(migrated).equipment, { weapon: null, armor: null });
    assert.equal(migrated.inventory.ironClaw, 0);
    assert.equal(migrated.inventory.grimaldeAegis, 0);
  }

  const v4 = createInitialGameState(1_000);
  v4.inventory.ironClaw = 2;
  v4.inventory.mistFang = 1;
  v4.cats[0].equipment = {
    weapon: 'mistFang',
    armor: 'ironClaw',
  };
  const sanitized = migrateGameSave(JSON.parse(JSON.stringify(v4)));
  assert.deepEqual(getLeader(sanitized).equipment, {
    weapon: 'mistFang',
    armor: null,
  });
  assert.equal(sanitized.inventory.ironClaw, 2);
  assert.equal(sanitized.inventory.mistFang, 1);

  const corrupt = migrateGameSave({ schemaVersion: 4, cats: 'broken' });
  assert.deepEqual(getLeader(corrupt).equipment, { weapon: null, armor: null });

  const inherited = Object.create({ weapon: 'mistFang', armor: 'grimaldeAegis' });
  const inheritedSave = createInitialGameState(1_000);
  inheritedSave.cats[0].equipment = inherited;
  assert.deepEqual(getLeader(migrateGameSave(inheritedSave)).equipment, {
    weapon: null,
    armor: null,
  });
});

test('v5 round-trip preserves multi-cat inventory, equipment, activity, and expedition', () => {
  const initial = createInitialGameState(1_000);
  initial.resources.gems = 10;
  const recruited = recruitCat(initial, () => 0, 2_000);
  assert.equal(recruited.ok, true);
  if (!recruited.ok) return;

  const leaderId = recruited.state.leaderId;
  const recruitId = recruited.cat.id;
  const saved = {
    ...recruited.state,
    inventory: {
      ...recruited.state.inventory,
      ironClaw: 2,
      guardArmor: 3,
      mistFang: 1,
    },
    cats: recruited.state.cats.map((cat) => {
      if (cat.id === leaderId) {
        return {
          ...cat,
          equipment: { weapon: 'ironClaw', armor: 'guardArmor' },
          activity: {
            activityId: 'huntMice',
            startedAt: 2_000,
            endsAt: 302_000,
          },
        };
      }
      return {
        ...cat,
        equipment: { weapon: 'mistFang', armor: null },
        expedition: {
          zoneId: 'mistwood',
          startedAt: 3_000,
          lastProgressAt: 3_000,
          accumulatedPulses: 4.5,
        },
      };
    }),
  };

  const loaded = migrateGameSave(JSON.parse(JSON.stringify(saved)));
  assert.equal(loaded.schemaVersion, 5);
  assert.deepEqual(
    {
      ironClaw: loaded.inventory.ironClaw,
      guardArmor: loaded.inventory.guardArmor,
      mistFang: loaded.inventory.mistFang,
    },
    { ironClaw: 2, guardArmor: 3, mistFang: 1 },
  );
  assert.deepEqual(
    loaded.cats.find((cat) => cat.id === leaderId)?.equipment,
    { weapon: 'ironClaw', armor: 'guardArmor' },
  );
  assert.deepEqual(
    loaded.cats.find((cat) => cat.id === leaderId)?.activity,
    {
      activityId: 'huntMice',
      startedAt: 2_000,
      endsAt: 302_000,
    },
  );
  assert.equal(
    loaded.cats.find((cat) => cat.id === leaderId)?.expedition,
    null,
  );
  assert.deepEqual(
    loaded.cats.find((cat) => cat.id === recruitId)?.equipment,
    { weapon: 'mistFang', armor: null },
  );
  assert.equal(
    loaded.cats.find((cat) => cat.id === recruitId)?.activity,
    null,
  );
  assert.deepEqual(
    loaded.cats.find((cat) => cat.id === recruitId)?.expedition,
    {
      zoneId: 'mistwood',
      startedAt: 3_000,
      lastProgressAt: 3_000,
      accumulatedPulses: 4.5,
    },
  );
});
