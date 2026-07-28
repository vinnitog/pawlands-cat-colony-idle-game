import test from 'node:test';
import assert from 'node:assert/strict';
import { expeditionTrophyById } from '../src/game/data/trophies.ts';
import { expeditionZoneById, expeditionZones } from '../src/game/data/zones.ts';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import {
  EXPEDITION_PULSE_CAP,
  EXPEDITION_PULSE_MS,
} from '../src/game/models/expedition.ts';
import { migrateGameSave } from '../src/game/storage/migrations.ts';
import {
  collectExpedition,
  isExpeditionZoneUnlocked,
  startExpedition,
} from '../src/game/systems/expeditionSystem.ts';
import { getLeader, recruitCat } from '../src/game/systems/colonySystem.ts';
import { processOfflineProgress } from '../src/game/systems/offlineSystem.ts';

const expectedLoot = {
  whisperingFields: [
    ['spectralSardine', 0.18, [1, 2]],
  ],
  mistwood: [
    ['phantomFur', 0.14, [1, 2]],
    ['spectralSardine', 0.035, [1, 1]],
  ],
  grimalkinRuins: [
    ['grimaldeRelic', 0.1, [1, 1]],
    ['phantomFur', 0.045, [1, 1]],
    ['ancientBoneCharm', 0.018, [1, 1]],
  ],
  soulMarsh: [
    ['soulAmulet', 0.075, [1, 1]],
    ['ancientBoneCharm', 0.035, [1, 1]],
    ['grimaldeRelic', 0.025, [1, 1]],
  ],
  eclipseTower: [
    ['eclipseShard', 0.055, [1, 1]],
    ['soulAmulet', 0.03, [1, 1]],
    ['ancientBoneCharm', 0.02, [1, 1]],
  ],
};

function collectWithEveryDrop(zone, pulses, quantityRoll) {
  const state = createInitialGameState(0);
  state.cats[0].expedition = {
    zoneId: zone.id,
    startedAt: 0,
    lastProgressAt: 0,
    accumulatedPulses: pulses,
  };
  const rolls = [];
  for (let pulse = 0; pulse < pulses; pulse += 1) {
    for (const loot of zone.lootTable) {
      rolls.push(0);
      if (loot.quantity[0] !== loot.quantity[1]) rolls.push(quantityRoll);
    }
    for (const _gearDrop of zone.gearTable) rolls.push(0);
    rolls.push(0);
  }

  let calls = 0;
  const result = collectExpedition(state, state.leaderId, 0, () => {
    const value = rolls[calls];
    calls += 1;
    return value;
  });
  assert.equal(calls, rolls.length, zone.id);
  return result;
}

function expectedAllDropInventory(zone, pulses, quantityIndex) {
  const expected = {};
  for (const loot of zone.lootTable) {
    expected[loot.item] =
      (expected[loot.item] ?? 0) + loot.quantity[quantityIndex] * pulses;
  }
  for (const gearDrop of zone.gearTable) {
    expected[gearDrop.item] = (expected[gearDrop.item] ?? 0) + pulses;
  }
  return expected;
}

test('E4 loot tables preserve their declared order, chances, and ranges', () => {
  for (const zone of expeditionZones) {
    assert.deepEqual(
      zone.lootTable.map((loot) => [
        loot.item,
        loot.chancePerPulse,
        [...loot.quantity],
      ]),
      expectedLoot[zone.id],
    );
  }
});

test('E4 gem chances preserve the shipped five-zone catalog', () => {
  assert.deepEqual(
    expeditionZones.map((zone) => zone.gemChance),
    [0.002, 0.004, 0.008, 0.01, 0.012],
  );
});

test('E4 nominal coin and XP hourly EV stay on the documented balance targets', () => {
  const expectedCoinsPerHour = [25.9, 48.7, 77.8, 121.8, 140.4];
  const expectedXpPerHour = [24, 48, 84, 120, 168];
  const pulsesPerHour = 60 * 60 * 1000 / EXPEDITION_PULSE_MS;

  expeditionZones.forEach((zone, index) => {
    const coinsPerPulse = zone.lootTable.reduce((total, loot) => {
      const expectedQuantity = (loot.quantity[0] + loot.quantity[1]) / 2;
      return total
        + loot.chancePerPulse
        * expectedQuantity
        * expeditionTrophyById[loot.item].sellValue;
    }, 0);
    assert.equal(
      Math.abs(coinsPerPulse * pulsesPerHour - expectedCoinsPerHour[index]) < 0.06,
      true,
      zone.id,
    );
    assert.equal(zone.xpPerPulse * pulsesPerHour, expectedXpPerHour[index]);
  });
  assert.equal(EXPEDITION_PULSE_MS, 5 * 60 * 1000);
  assert.equal(EXPEDITION_PULSE_CAP, 96);
  assert.equal(EXPEDITION_PULSE_CAP * EXPEDITION_PULSE_MS, 8 * 60 * 60 * 1000);
});

test('RNG uses loot table order and excludes exact chance boundaries', () => {
  for (const zone of expeditionZones) {
    const state = createInitialGameState(0);
    state.cats[0].expedition = {
      zoneId: zone.id,
      startedAt: 0,
      lastProgressAt: 0,
      accumulatedPulses: 1,
    };
    const rolls = [
      ...zone.lootTable.map((loot) => loot.chancePerPulse),
      ...zone.gearTable.map((drop) => drop.chancePerPulse),
      zone.gemChance,
    ];
    let calls = 0;
    const result = collectExpedition(state, getLeader(state).id, 0, () => {
      const roll = rolls[calls];
      calls += 1;
      return roll;
    });

    assert.equal(calls, rolls.length, zone.id);
    assert.deepEqual(result.reward.inventory, {}, zone.id);
    assert.deepEqual(result.reward.resources, {}, zone.id);
  }
});

test('quantity rolls occur immediately after their successful loot entry', () => {
  const state = createInitialGameState(0);
  state.cats[0].expedition = {
    zoneId: 'whisperingFields',
    startedAt: 0,
    lastProgressAt: 0,
    accumulatedPulses: 1,
  };
  const rolls = [0.179, 0.999, 0.002];
  let calls = 0;
  const result = collectExpedition(state, getLeader(state).id, 0, () => {
    const roll = rolls[calls];
    calls += 1;
    return roll;
  });

  assert.equal(calls, 3);
  assert.deepEqual(result.reward.inventory, { spectralSardine: 2 });
  assert.deepEqual(result.reward.resources, {});
});

test('all five zones deterministically award minimum and maximum loot plus gems', () => {
  for (const zone of expeditionZones) {
    for (const [quantityRoll, quantityIndex] of [[0, 0], [0.999_999, 1]]) {
      const result = collectWithEveryDrop(zone, 1, quantityRoll);

      assert.deepEqual(
        result.reward.inventory,
        expectedAllDropInventory(zone, 1, quantityIndex),
        `${zone.id}:${quantityIndex}`,
      );
      assert.deepEqual(result.reward.resources, { gems: 1 }, zone.id);
      assert.equal(result.reward.xp, zone.xpPerPulse, zone.id);
    }
  }
});

test('successful loot aggregates across pulses from catalog quantities without extra rolls', () => {
  const pulses = 3;
  for (const zone of expeditionZones) {
    const result = collectWithEveryDrop(zone, pulses, 0.999_999);

    assert.deepEqual(
      result.reward.inventory,
      expectedAllDropInventory(zone, pulses, 1),
      zone.id,
    );
    assert.deepEqual(result.reward.resources, { gems: pulses }, zone.id);
    assert.equal(result.reward.xp, zone.xpPerPulse * pulses, zone.id);
  }
});

test('zone unlock thresholds use the exact predecessor and Bosque uses the chosen cat', () => {
  const state = createInitialGameState(0);
  state.resources.gems = 10;
  const recruited = recruitCat(state, () => 0, 1_000);
  assert.equal(recruited.ok, true);
  if (!recruited.ok) return;

  const leaderId = recruited.state.leaderId;
  const recruitId = recruited.cat.id;
  const leveled = {
    ...recruited.state,
    cats: recruited.state.cats.map((cat) =>
      cat.id === recruitId ? { ...cat, level: 4 } : cat
    ),
  };
  assert.equal(isExpeditionZoneUnlocked(leveled, leaderId, 'mistwood'), false);
  assert.equal(isExpeditionZoneUnlocked(leveled, recruitId, 'mistwood'), true);

  const thresholds = [
    ['grimalkinRuins', 'whisperingFields', 5],
    ['soulMarsh', 'grimalkinRuins', 5],
    ['eclipseTower', 'soulMarsh', 8],
  ];
  for (const [zoneId, predecessorId, required] of thresholds) {
    const before = {
      ...leveled,
      expeditionCollections: {
        ...leveled.expeditionCollections,
        [predecessorId]: required - 1,
      },
    };
    assert.equal(
      isExpeditionZoneUnlocked(before, leaderId, zoneId),
      false,
      `${zoneId}:${required - 1}/${required}`,
    );
    const blocked = startExpedition(before, leaderId, zoneId, 2_000);
    assert.equal(blocked.ok, false, zoneId);
    assert.equal(blocked.state, before, zoneId);

    const atThreshold = {
      ...before,
      expeditionCollections: {
        ...before.expeditionCollections,
        [predecessorId]: required,
      },
    };
    assert.equal(
      isExpeditionZoneUnlocked(atThreshold, leaderId, zoneId),
      true,
      `${zoneId}:${required}/${required}`,
    );
  }
});

test('v1-v4 saves default E4 fields and v5 preserves new zones and carries', () => {
  for (const schemaVersion of [1, 2, 3, 4]) {
    const legacy = schemaVersion === 1
      ? { schemaVersion, cat: { id: 'legacy' } }
      : {
          schemaVersion,
          cats: [{ id: 'legacy' }],
          leaderId: 'legacy',
        };
    const migrated = migrateGameSave(legacy);
    assert.equal(migrated.schemaVersion, 6);
    assert.equal(migrated.inventory.ancientBoneCharm, 0);
    assert.equal(migrated.inventory.soulAmulet, 0);
    assert.equal(migrated.inventory.eclipseShard, 0);
    assert.equal(migrated.expeditionCollections.soulMarsh, 0);
    assert.equal(migrated.expeditionCollections.eclipseTower, 0);
  }

  const v5 = createInitialGameState(0);
  v5.expeditionCollections.soulMarsh = 9;
  v5.expeditionCollections.eclipseTower = 2;
  v5.inventory.eclipseShard = 3;
  v5.cats[0].expedition = {
    zoneId: 'eclipseTower',
    startedAt: 100,
    lastProgressAt: 200,
    accumulatedPulses: 5.5,
  };
  v5.cats[0].expeditionPulseCarry = { soulMarsh: 0.25, eclipseTower: 0.75 };
  v5.cats[0].expeditionTimeCarryMs = {
    soulMarsh: 12_345,
    eclipseTower: 23_456,
  };
  const migrated = migrateGameSave(JSON.parse(JSON.stringify(v5)));

  assert.equal(migrated.inventory.eclipseShard, 3);
  assert.equal(migrated.expeditionCollections.soulMarsh, 9);
  assert.equal(migrated.expeditionCollections.eclipseTower, 2);
  assert.equal(getLeader(migrated).expedition?.zoneId, 'eclipseTower');
  assert.deepEqual(getLeader(migrated).expeditionPulseCarry, {
    soulMarsh: 0.25,
    eclipseTower: 0.75,
  });
  assert.deepEqual(getLeader(migrated).expeditionTimeCarryMs, {
    soulMarsh: 12_345,
    eclipseTower: 23_456,
  });
});

test('v3 and v4 preserve old expedition progress while defaulting every E4 field', () => {
  for (const schemaVersion of [3, 4]) {
    const legacy = createInitialGameState(0);
    legacy.schemaVersion = schemaVersion;
    legacy.inventory.spectralSardine = 4;
    legacy.inventory.phantomFur = 3;
    legacy.inventory.grimaldeRelic = 2;
    delete legacy.inventory.ancientBoneCharm;
    delete legacy.inventory.soulAmulet;
    delete legacy.inventory.eclipseShard;
    legacy.expeditionCollections = {
      whisperingFields: 6,
      mistwood: 2,
      grimalkinRuins: 4,
    };
    legacy.cats[0].expedition = {
      zoneId: 'mistwood',
      startedAt: 100,
      lastProgressAt: 200,
      accumulatedPulses: 3.5,
    };
    legacy.cats[0].expeditionPulseCarry = {
      whisperingFields: 0.25,
      mistwood: 0.5,
    };
    legacy.cats[0].expeditionTimeCarryMs = {
      whisperingFields: 12_345,
      mistwood: 23_456,
    };

    const migrated = migrateGameSave(JSON.parse(JSON.stringify(legacy)));
    assert.equal(migrated.schemaVersion, 6);
    assert.deepEqual(
      {
        spectralSardine: migrated.inventory.spectralSardine,
        phantomFur: migrated.inventory.phantomFur,
        grimaldeRelic: migrated.inventory.grimaldeRelic,
      },
      { spectralSardine: 4, phantomFur: 3, grimaldeRelic: 2 },
      `v${schemaVersion}`,
    );
    assert.equal(migrated.inventory.ancientBoneCharm, 0);
    assert.equal(migrated.inventory.soulAmulet, 0);
    assert.equal(migrated.inventory.eclipseShard, 0);
    assert.deepEqual(migrated.expeditionCollections, {
      whisperingFields: 6,
      mistwood: 2,
      grimalkinRuins: 4,
      soulMarsh: 0,
      eclipseTower: 0,
    });
    assert.deepEqual(getLeader(migrated).expedition, {
      zoneId: 'mistwood',
      startedAt: 100,
      lastProgressAt: 200,
      accumulatedPulses: 3.5,
    });
    assert.deepEqual(getLeader(migrated).expeditionPulseCarry, {
      whisperingFields: 0.25,
      mistwood: 0.5,
    });
    assert.deepEqual(getLeader(migrated).expeditionTimeCarryMs, {
      whisperingFields: 12_345,
      mistwood: 23_456,
    });
  }
});

test('v5 migration removes unknown inventory, collections, carries, and active zones', () => {
  const saved = createInitialGameState(0);
  saved.inventory.unknownLoot = 99;
  saved.expeditionCollections.unknownZone = 77;
  saved.cats[0].expeditionPulseCarry.unknownZone = 0.5;
  saved.cats[0].expeditionTimeCarryMs.unknownZone = 12_345;
  saved.cats[0].expedition = {
    zoneId: 'unknownZone',
    startedAt: 100,
    lastProgressAt: 200,
    accumulatedPulses: 3,
  };

  const migrated = migrateGameSave(JSON.parse(JSON.stringify(saved)));
  assert.equal(Object.hasOwn(migrated.inventory, 'unknownLoot'), false);
  assert.equal(Object.hasOwn(migrated.expeditionCollections, 'unknownZone'), false);
  assert.equal(
    Object.hasOwn(getLeader(migrated).expeditionPulseCarry, 'unknownZone'),
    false,
  );
  assert.equal(
    Object.hasOwn(getLeader(migrated).expeditionTimeCarryMs, 'unknownZone'),
    false,
  );
  assert.equal(getLeader(migrated).expedition, null);
});

test('v5 migration rejects unsafe integers instead of persisting imprecise progress', () => {
  const unsafe = createInitialGameState(1_000);
  unsafe.resources.coins = Number.MAX_VALUE;
  unsafe.inventory.eclipseShard = Number.MAX_VALUE;
  unsafe.expeditionCollections.eclipseTower = Number.MAX_VALUE;
  unsafe.totals.resourcesEarned.coins = Number.MAX_VALUE;
  unsafe.cats[0].xp = Number.MAX_VALUE;

  const migrated = migrateGameSave(unsafe);

  assert.equal(migrated.resources.coins, 20);
  assert.equal(migrated.inventory.eclipseShard, 0);
  assert.equal(migrated.expeditionCollections.eclipseTower, 0);
  assert.equal(migrated.totals.resourcesEarned.coins, 0);
  assert.equal(getLeader(migrated).xp, 0);
});

test('offline progress fills and caps a new-zone expedition without overflow', () => {
  const state = createInitialGameState(0);
  state.cats[0].expedition = {
    zoneId: 'soulMarsh',
    startedAt: 0,
    lastProgressAt: 0,
    accumulatedPulses: 0,
  };
  const capAt = EXPEDITION_PULSE_CAP * 4 * EXPEDITION_PULSE_MS;
  const capped = processOfflineProgress(state, capAt);
  assert.equal(
    getLeader(capped.state).expedition?.accumulatedPulses,
    EXPEDITION_PULSE_CAP,
  );
  assert.equal(getLeader(capped.state).expeditionTimeCarryMs.soulMarsh, undefined);

  const later = processOfflineProgress(capped.state, capAt + 24 * 60 * 60 * 1000);
  assert.equal(
    getLeader(later.state).expedition?.accumulatedPulses,
    EXPEDITION_PULSE_CAP,
  );
  assert.equal(getLeader(later.state).expeditionTimeCarryMs.soulMarsh, undefined);
});

test('multi-cat expeditions cap and progress independently, then collect only the target', () => {
  const initial = createInitialGameState(0);
  initial.resources.gems = 10;
  initial.expeditionCollections.grimalkinRuins = 5;
  initial.expeditionCollections.soulMarsh = 8;
  const recruited = recruitCat(initial, () => 0, 1_000);
  assert.equal(recruited.ok, true);
  if (!recruited.ok) return;

  const leaderId = recruited.state.leaderId;
  const recruitId = recruited.cat.id;
  const firstStarted = startExpedition(
    recruited.state,
    leaderId,
    'soulMarsh',
    0,
  );
  assert.equal(firstStarted.ok, true);
  if (!firstStarted.ok) return;
  const bothStarted = startExpedition(
    firstStarted.state,
    recruitId,
    'eclipseTower',
    0,
  );
  assert.equal(bothStarted.ok, true);
  if (!bothStarted.ok) return;

  const prepared = {
    ...bothStarted.state,
    cats: bothStarted.state.cats.map((cat) => ({
      ...cat,
      expedition: cat.expedition
        ? {
            ...cat.expedition,
            accumulatedPulses: cat.id === leaderId
              ? EXPEDITION_PULSE_CAP - 1
              : 1,
          }
        : null,
    })),
  };
  const now = 4 * EXPEDITION_PULSE_MS;
  const offline = processOfflineProgress(prepared, now, () => 0.99);
  const cappedCat = offline.state.cats.find((cat) => cat.id === leaderId);
  const progressingCat = offline.state.cats.find((cat) => cat.id === recruitId);
  assert.equal(cappedCat?.expedition?.zoneId, 'soulMarsh');
  assert.equal(
    cappedCat?.expedition?.accumulatedPulses,
    EXPEDITION_PULSE_CAP,
  );
  assert.equal(progressingCat?.expedition?.zoneId, 'eclipseTower');
  assert.equal(progressingCat?.expedition?.accumulatedPulses, 2);

  const progressingBeforeCollection = progressingCat?.expedition;
  const collectionsBefore = { ...offline.state.expeditionCollections };
  const collected = collectExpedition(
    offline.state,
    leaderId,
    now,
    () => 0.99,
  );
  assert.equal(collected.collected, true);
  assert.equal(collected.resolvedPulses, EXPEDITION_PULSE_CAP);
  assert.equal(
    collected.state.cats.find((cat) => cat.id === leaderId)?.expedition,
    null,
  );
  assert.deepEqual(
    collected.state.cats.find((cat) => cat.id === recruitId)?.expedition,
    progressingBeforeCollection,
  );
  assert.equal(
    collected.state.expeditionCollections.soulMarsh,
    collectionsBefore.soulMarsh + 1,
  );
  assert.equal(
    collected.state.expeditionCollections.eclipseTower,
    collectionsBefore.eclipseTower,
  );
});
