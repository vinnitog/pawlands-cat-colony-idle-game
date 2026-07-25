import test from 'node:test';
import assert from 'node:assert/strict';
import { expeditionTrophyById, expeditionTrophies } from '../src/game/data/trophies.ts';
import {
  expeditionZoneById,
  expeditionZones,
  isExpeditionZoneId,
} from '../src/game/data/zones.ts';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { migrateGameSave } from '../src/game/storage/migrations.ts';
import {
  addInventoryToState,
  mergeRewardBundles,
} from '../src/game/systems/economySystem.ts';
import { getCatPower } from '../src/game/systems/expeditionSystem.ts';
import { getLeader, recruitCat } from '../src/game/systems/colonySystem.ts';
import { getInventoryLabel } from '../src/ui/formatters.ts';
import { gearById } from '../src/game/data/gear.ts';

test('expedition zones expose a valid catalog and lookup for the five planned tiers', () => {
  assert.deepEqual(
    expeditionZones.map((zone) => [zone.name, zone.recommendedPower]),
    [
      ['Campos Sussurrantes', 6],
      ['Bosque das Brumas', 14],
      ['Ruínas de Grimalkin', 26],
      ['Pântano das Almas', 40],
      ['Limiar do Eclipse', 60],
    ],
  );
  assert.equal(expeditionZoneById.whisperingFields.unlock.kind, 'always');
  assert.deepEqual(expeditionZoneById.mistwood.unlock, { kind: 'catLevel', level: 4 });
  assert.deepEqual(expeditionZoneById.grimalkinRuins.unlock, {
    kind: 'zoneCollections',
    zoneId: 'whisperingFields',
    collections: 5,
  });
  assert.deepEqual(expeditionZoneById.soulMarsh.unlock, {
    kind: 'zoneCollections',
    zoneId: 'grimalkinRuins',
    collections: 5,
  });
  assert.deepEqual(expeditionZoneById.eclipseTower.unlock, {
    kind: 'zoneCollections',
    zoneId: 'soulMarsh',
    collections: 8,
  });

  assert.equal(new Set(expeditionZones.map((zone) => zone.id)).size, expeditionZones.length);
  for (const zone of expeditionZones) {
    assert.equal(expeditionZoneById[zone.id], zone);
    assert.equal(isExpeditionZoneId(zone.id), true);
    assert.equal(zone.recommendedPower > 0, true);
    assert.equal(zone.xpPerPulse > 0, true);
    assert.equal(zone.gemChance >= 0 && zone.gemChance <= 1, true);
    assert.equal(zone.lootTable.length > 0, true);

    for (const loot of zone.lootTable) {
      assert.equal(loot.chancePerPulse >= 0 && loot.chancePerPulse <= 1, true);
      assert.equal(loot.quantity[0] > 0, true);
      assert.equal(loot.quantity[1] >= loot.quantity[0], true);
      assert.equal(expeditionTrophyById[loot.item] !== undefined, true);
    }
    for (const drop of zone.gearTable) {
      assert.equal(drop.chancePerPulse > 0 && drop.chancePerPulse <= 1, true);
      assert.equal(gearById[drop.item].origin.kind, 'expedition');
      assert.equal(gearById[drop.item].origin.zoneId, zone.id);
    }
  }
  assert.deepEqual(expeditionZoneById.whisperingFields.gearTable, []);
  assert.deepEqual(expeditionZoneById.mistwood.gearTable, [
    { item: 'mistFang', chancePerPulse: 0.0015 },
  ]);
  assert.deepEqual(expeditionZoneById.grimalkinRuins.gearTable, [
    { item: 'grimaldeAegis', chancePerPulse: 0.001 },
  ]);
  assert.deepEqual(expeditionZoneById.soulMarsh.gearTable, []);
  assert.deepEqual(expeditionZoneById.eclipseTower.gearTable, []);
  assert.equal(isExpeditionZoneId('unknownZone'), false);
});

test('expedition trophies have unique ids and positive sale values', () => {
  assert.deepEqual(
    expeditionTrophies.map((trophy) => trophy.id),
    [
      'spectralSardine',
      'phantomFur',
      'grimaldeRelic',
      'ancientBoneCharm',
      'soulAmulet',
      'eclipseShard',
    ],
  );
  assert.equal(new Set(expeditionTrophies.map((trophy) => trophy.id)).size, expeditionTrophies.length);
  assert.equal(expeditionTrophies.every((trophy) => trophy.sellValue > 0), true);
  assert.equal(expeditionTrophyById.grimaldeRelic.sellValue, 45);
  assert.equal(expeditionTrophyById.ancientBoneCharm.sellValue, 65);
  assert.equal(expeditionTrophyById.soulAmulet.sellValue, 90);
  assert.equal(expeditionTrophyById.eclipseShard.sellValue, 140);
  assert.deepEqual(
    expeditionTrophies.map((trophy) => [trophy.id, trophy.rarity]),
    [
      ['spectralSardine', 'common'],
      ['phantomFur', 'common'],
      ['grimaldeRelic', 'uncommon'],
      ['ancientBoneCharm', 'uncommon'],
      ['soulAmulet', 'rare'],
      ['eclipseShard', 'legendary'],
    ],
  );
});

test('cat power uses attack twice, defense, level, and zero gear power in E0', () => {
  const cat = {
    ...getLeader(createInitialGameState(1_000)),
    level: 5,
    stats: {
      attack: 7,
      defense: 4,
      hunting: 1,
      fishing: 1,
      luck: 1,
    },
  };

  assert.equal(getCatPower(cat), 25.5);
});

test('fresh cats start home with an empty expedition trophy inventory', () => {
  const state = createInitialGameState(1_000);

  assert.equal(state.schemaVersion, 5);
  assert.equal(getLeader(state).expedition, null);
  assert.equal(state.inventory.spectralSardine, 0);
  assert.equal(state.inventory.phantomFur, 0);
  assert.equal(state.inventory.grimaldeRelic, 0);
  assert.equal(state.inventory.ancientBoneCharm, 0);
  assert.equal(state.inventory.soulAmulet, 0);
  assert.equal(state.inventory.eclipseShard, 0);
});

test('v1 cats and new recruits default to no expedition', () => {
  const migrated = migrateGameSave({
    schemaVersion: 1,
    cat: { id: 'legacy-cat', name: 'Nina' },
  });
  const state = createInitialGameState(1_000);
  state.resources.gems = 10;
  const recruited = recruitCat(state, () => 0, 2_000);

  assert.equal(getLeader(migrated).expedition, null);
  assert.equal(migrated.inventory.spectralSardine, 0);
  assert.equal(migrated.inventory.phantomFur, 0);
  assert.equal(migrated.inventory.grimaldeRelic, 0);
  assert.equal(recruited.ok, true);
  if (recruited.ok) assert.equal(recruited.cat.expedition, null);
});

test('economy adds and merges expedition trophies without losing existing inventory', () => {
  const state = createInitialGameState(1_000);
  state.inventory.rareFeather = 2;
  state.inventory.spectralSardine = 1;

  const added = addInventoryToState(state, {
    spectralSardine: 3,
    phantomFur: 2,
  });
  const merged = mergeRewardBundles(
    {
      resources: {},
      inventory: { spectralSardine: 2, phantomFur: 1, goldenSardine: 1 },
      xp: 4,
      energy: 0,
    },
    {
      resources: {},
      inventory: { spectralSardine: 3, grimaldeRelic: 1, goldenSardine: 2 },
      xp: 6,
      energy: 0,
    },
  );

  assert.equal(added.inventory.rareFeather, 2);
  assert.equal(added.inventory.spectralSardine, 4);
  assert.equal(added.inventory.phantomFur, 2);
  assert.equal(state.inventory.spectralSardine, 1);
  assert.deepEqual(merged.inventory, {
    spectralSardine: 5,
    phantomFur: 1,
    grimaldeRelic: 1,
    goldenSardine: 3,
  });
  assert.equal(merged.xp, 10);
});

test('expedition trophies expose inventory labels', () => {
  assert.equal(getInventoryLabel('rareFeather'), 'Pena rara');
  assert.equal(getInventoryLabel('goldenSardine'), 'Sardinha dourada');
  assert.equal(getInventoryLabel('glowingYarn'), 'Novelo brilhante');
  assert.equal(getInventoryLabel('spectralSardine'), 'Sardinha espectral');
  assert.equal(getInventoryLabel('phantomFur'), 'Pelo fantasma');
  assert.equal(getInventoryLabel('grimaldeRelic'), 'Relíquia grimalde');
});

test('v3 migration preserves a valid active expedition and trophy counts', () => {
  const state = createInitialGameState(1_000);
  const saved = {
    ...state,
    cats: state.cats.map((cat) => ({
      ...cat,
      expedition: {
        zoneId: 'mistwood',
        startedAt: 2_000,
        lastProgressAt: 3_000,
        accumulatedPulses: 7.5,
      },
    })),
    inventory: {
      ...state.inventory,
      phantomFur: 4,
    },
  };

  const migrated = migrateGameSave(JSON.parse(JSON.stringify(saved)));

  assert.deepEqual(getLeader(migrated).expedition, {
    zoneId: 'mistwood',
    startedAt: 2_000,
    lastProgressAt: 3_000,
    accumulatedPulses: 7.5,
  });
  assert.equal(migrated.inventory.phantomFur, 4);
});

test('v3 migration sanitizes expedition values while preserving fractional pulses', () => {
  const state = createInitialGameState(1_000);
  const saved = {
    ...state,
    cats: state.cats.map((cat) => ({
      ...cat,
      expedition: {
        zoneId: 'mistwood',
        startedAt: 2_000.9,
        lastProgressAt: 1_500,
        accumulatedPulses: 7.25,
      },
    })),
  };

  assert.deepEqual(getLeader(migrateGameSave(saved)).expedition, {
    zoneId: 'mistwood',
    startedAt: 2_000,
    lastProgressAt: 2_000,
    accumulatedPulses: 7.25,
  });

  for (const accumulatedPulses of [-1, Number.NaN, Number.POSITIVE_INFINITY, '4.5']) {
    saved.cats[0].expedition.accumulatedPulses = accumulatedPulses;
    assert.equal(getLeader(migrateGameSave(saved)).expedition?.accumulatedPulses, 0);
  }

  saved.cats[0].expedition = {
    zoneId: 'mistwood',
    startedAt: Number.NaN,
    lastProgressAt: Number.POSITIVE_INFINITY,
    accumulatedPulses: 1,
  };
  assert.deepEqual(getLeader(migrateGameSave(saved)).expedition, {
    zoneId: 'mistwood',
    startedAt: 0,
    lastProgressAt: 0,
    accumulatedPulses: 1,
  });
});

test('v3 migration keeps each cat expedition independent', () => {
  const state = createInitialGameState(1_000);
  const cats = [
    {
      ...state.cats[0],
      id: 'first',
      expedition: {
        zoneId: 'whisperingFields',
        startedAt: 2_000,
        lastProgressAt: 2_500,
        accumulatedPulses: 1.5,
      },
    },
    {
      ...state.cats[0],
      id: 'second',
      expedition: {
        zoneId: 'grimalkinRuins',
        startedAt: 3_000,
        lastProgressAt: 4_000,
        accumulatedPulses: 9.75,
      },
    },
  ];

  const migrated = migrateGameSave({ ...state, cats, leaderId: 'second' });

  assert.deepEqual(migrated.cats.map((cat) => cat.expedition), cats.map((cat) => cat.expedition));
  assert.notEqual(migrated.cats[0].expedition, migrated.cats[1].expedition);
  assert.equal(migrated.leaderId, 'second');
});

test('v3 migration rejects unknown and inherited object property zone ids', () => {
  const state = createInitialGameState(1_000);
  for (const zoneId of ['nowhere', 'toString', '__proto__']) {
    const saved = {
      ...state,
      cats: state.cats.map((cat) => ({
        ...cat,
        expedition: {
          zoneId,
          startedAt: 2_000,
          lastProgressAt: 3_000,
          accumulatedPulses: 7,
        },
      })),
    };

    assert.equal(getLeader(migrateGameSave(saved)).expedition, null);
  }
});
