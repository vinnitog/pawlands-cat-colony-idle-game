import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { migrateGameSave } from '../src/game/storage/migrations.ts';
import { startActivity } from '../src/game/systems/activitySystem.ts';
import { getLeader, recruitCat, setLeader } from '../src/game/systems/colonySystem.ts';
import {
  advanceExpeditions,
  collectExpedition,
  getExpeditionEfficiency,
  isExpeditionZoneUnlocked,
  startExpedition,
} from '../src/game/systems/expeditionSystem.ts';
import { processOfflineProgress } from '../src/game/systems/offlineSystem.ts';
import {
  EXPEDITION_PULSE_CAP,
  EXPEDITION_PULSE_MS,
} from '../src/game/models/expedition.ts';

function weakCatState(now = 0) {
  const state = createInitialGameState(now);
  return {
    ...state,
    cats: state.cats.map((cat) => ({
      ...cat,
      level: 1,
      stats: { ...cat.stats, attack: 0, defense: 0 },
    })),
  };
}

function activeExpedition(state, accumulatedPulses, now = 0) {
  return {
    ...state,
    cats: state.cats.map((cat) => ({
      ...cat,
      expedition: {
        zoneId: 'whisperingFields',
        startedAt: now,
        lastProgressAt: now,
        accumulatedPulses,
      },
    })),
  };
}

test('efficiency is power divided by recommendation with lower and upper clamps', () => {
  const initial = getLeader(createInitialGameState(0));
  const weak = getLeader(weakCatState());
  const strong = {
    ...initial,
    level: 20,
    stats: { ...initial.stats, attack: 20, defense: 20 },
  };

  assert.equal(getExpeditionEfficiency(weak, 'whisperingFields'), 0.25);
  assert.equal(getExpeditionEfficiency(initial, 'whisperingFields'), 1.25);
  assert.equal(getExpeditionEfficiency(strong, 'whisperingFields'), 1.5);
});

test('zone unlocks use the assigned cat level and reward-bearing collection totals', () => {
  const state = createInitialGameState(0);
  const catId = getLeader(state).id;

  assert.equal(isExpeditionZoneUnlocked(state, catId, 'whisperingFields'), true);
  assert.equal(isExpeditionZoneUnlocked(state, catId, 'mistwood'), false);
  assert.equal(isExpeditionZoneUnlocked(state, catId, 'grimalkinRuins'), false);

  const progressed = {
    ...state,
    cats: state.cats.map((cat) => ({ ...cat, level: 4 })),
    expeditionCollections: { ...state.expeditionCollections, whisperingFields: 5 },
  };
  assert.equal(isExpeditionZoneUnlocked(progressed, catId, 'mistwood'), true);
  assert.equal(isExpeditionZoneUnlocked(progressed, catId, 'grimalkinRuins'), true);
});

test('starting an expedition occupies only that cat and never spends energy', () => {
  const state = createInitialGameState(1_000);
  const cat = getLeader(state);
  const started = startExpedition(state, cat.id, 'whisperingFields', 2_000);

  assert.equal(started.ok, true);
  if (!started.ok) return;
  assert.equal(getLeader(started.state).energy, cat.energy);
  assert.deepEqual(getLeader(started.state).expedition, {
    zoneId: 'whisperingFields',
    startedAt: 2_000,
    lastProgressAt: 2_000,
    accumulatedPulses: 0,
  });

  assert.equal(startExpedition(started.state, cat.id, 'whisperingFields', 3_000).ok, false);
  assert.equal(startActivity(started.state, 'huntMice', 3_000).ok, false);

  const working = startActivity(state, 'huntMice', 2_000);
  assert.equal(working.ok, true);
  assert.equal(startExpedition(working.state, cat.id, 'whisperingFields', 3_000).ok, false);
  assert.equal(startExpedition(state, 'stranger', 'whisperingFields', 3_000).ok, false);
  assert.equal(startExpedition(state, cat.id, 'mistwood', 3_000).ok, false);
});

test('an expedition cat cannot be appointed colony leader', () => {
  const state = createInitialGameState(0);
  state.resources.gems = 10;
  const recruited = recruitCat(state, () => 0, 1_000);
  assert.equal(recruited.ok, true);
  if (!recruited.ok) return;

  const started = startExpedition(
    recruited.state,
    recruited.cat.id,
    'whisperingFields',
    2_000,
  );
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const result = setLeader(started.state, recruited.cat.id);
  assert.equal(result.ok, false);
  assert.equal(result.state, started.state);
  assert.equal(result.state.leaderId, state.leaderId);
});

test('sending the leader can promote a free replacement without touching the hunter', () => {
  const state = createInitialGameState(0);
  state.resources.gems = 10;
  const recruited = recruitCat(state, () => 0, 1_000);
  assert.equal(recruited.ok, true);
  if (!recruited.ok) return;

  const leaderId = getLeader(recruited.state).id;
  const started = startExpedition(recruited.state, leaderId, 'whisperingFields', 2_000);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const replacement = started.state.cats.find(
    (cat) => cat.id !== leaderId && !cat.activity && !cat.expedition,
  );
  assert.equal(replacement?.id, recruited.cat.id);
  const switched = setLeader(started.state, replacement.id);
  assert.equal(switched.ok, true);
  if (!switched.ok) return;

  assert.equal(switched.state.leaderId, replacement.id);
  assert.equal(
    switched.state.cats.find((cat) => cat.id === leaderId)?.expedition?.zoneId,
    'whisperingFields',
  );
});

test('a single-cat roster keeps its away leader until the expedition is collected', () => {
  const state = createInitialGameState(0);
  const leaderId = getLeader(state).id;
  const started = startExpedition(state, leaderId, 'whisperingFields', 1_000);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  assert.equal(started.state.leaderId, leaderId);
  assert.equal(getLeader(started.state).expedition?.zoneId, 'whisperingFields');
  assert.equal(
    started.state.cats.some(
      (cat) => cat.id !== leaderId && !cat.activity && !cat.expedition,
    ),
    false,
  );
});

test('zone unlock follows the chosen cat instead of the colony leader', () => {
  const state = createInitialGameState(0);
  state.resources.gems = 10;
  const recruited = recruitCat(state, () => 0, 1_000);
  assert.equal(recruited.ok, true);
  if (!recruited.ok) return;

  const leveled = {
    ...recruited.state,
    cats: recruited.state.cats.map((cat) =>
      cat.id === recruited.cat.id ? { ...cat, level: 4 } : cat,
    ),
  };

  assert.equal(isExpeditionZoneUnlocked(leveled, leveled.leaderId, 'mistwood'), false);
  assert.equal(isExpeditionZoneUnlocked(leveled, recruited.cat.id, 'mistwood'), true);
});

test('progress preserves partial base time across ticks and re-anchors clock rollback', () => {
  const state = weakCatState(0);
  const catId = getLeader(state).id;
  const started = startExpedition(state, catId, 'whisperingFields', 0);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const afterSevenMinutes = advanceExpeditions(
    started.state,
    EXPEDITION_PULSE_MS + 2 * 60_000,
  );
  assert.equal(getLeader(afterSevenMinutes).expedition?.accumulatedPulses, 0.25);
  assert.equal(
    getLeader(afterSevenMinutes).expedition?.lastProgressAt,
    EXPEDITION_PULSE_MS + 2 * 60_000,
  );
  assert.equal(
    getLeader(afterSevenMinutes).expeditionTimeCarryMs.whisperingFields,
    2 * 60_000,
  );

  const afterTenMinutes = advanceExpeditions(afterSevenMinutes, 2 * EXPEDITION_PULSE_MS);
  assert.equal(getLeader(afterTenMinutes).expedition?.accumulatedPulses, 0.5);
  assert.equal(getLeader(afterTenMinutes).expedition?.lastProgressAt, 2 * EXPEDITION_PULSE_MS);
  assert.equal(getLeader(afterTenMinutes).expeditionTimeCarryMs.whisperingFields, undefined);

  const rolledBack = advanceExpeditions(afterTenMinutes, EXPEDITION_PULSE_MS);
  assert.equal(getLeader(rolledBack).expedition?.accumulatedPulses, 0.5);
  assert.equal(getLeader(rolledBack).expedition?.lastProgressAt, EXPEDITION_PULSE_MS);

  const recovered = advanceExpeditions(rolledBack, 2 * EXPEDITION_PULSE_MS);
  assert.equal(getLeader(recovered).expedition?.accumulatedPulses, 0.75);
});

test('clock rollback re-anchor survives a save round-trip', () => {
  const state = createInitialGameState(100_000);
  const catId = getLeader(state).id;
  const started = startExpedition(state, catId, 'whisperingFields', 100_000);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const partial = advanceExpeditions(started.state, 100_000 + 4 * 60_000);
  assert.equal(getLeader(partial).expeditionTimeCarryMs.whisperingFields, 4 * 60_000);

  const rolledBack = advanceExpeditions(partial, 50_000);
  assert.equal(getLeader(rolledBack).expedition?.startedAt, 50_000);
  assert.equal(getLeader(rolledBack).expedition?.lastProgressAt, 50_000);
  assert.equal(
    getLeader(rolledBack).expeditionTimeCarryMs.whisperingFields,
    4 * 60_000,
  );

  const loaded = migrateGameSave(JSON.parse(JSON.stringify(rolledBack)));
  assert.equal(getLeader(loaded).expedition?.startedAt, 50_000);
  assert.equal(getLeader(loaded).expedition?.lastProgressAt, 50_000);
  assert.equal(getLeader(loaded).expeditionTimeCarryMs.whisperingFields, 4 * 60_000);

  const recovered = advanceExpeditions(loaded, 50_000 + 60_000);
  assert.equal(getLeader(recovered).expedition?.accumulatedPulses, 1.25);
  assert.equal(getLeader(recovered).expeditionTimeCarryMs.whisperingFields, undefined);
});

test('bag caps effective pulses but consumes elapsed whole base pulses', () => {
  const state = createInitialGameState(0);
  const catId = getLeader(state).id;
  const started = startExpedition(state, catId, 'whisperingFields', 0);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const elapsedBasePulses = EXPEDITION_PULSE_CAP * 10;
  const now = elapsedBasePulses * EXPEDITION_PULSE_MS + 2 * 60_000;
  const capped = advanceExpeditions(started.state, now);
  assert.equal(getLeader(capped).expedition?.accumulatedPulses, EXPEDITION_PULSE_CAP);
  assert.equal(
    getLeader(capped).expedition?.lastProgressAt,
    now,
  );
  assert.equal(getLeader(capped).expeditionTimeCarryMs.whisperingFields, undefined);

  const stillCapped = advanceExpeditions(capped, now + EXPEDITION_PULSE_MS);
  assert.equal(getLeader(stillCapped).expedition?.accumulatedPulses, EXPEDITION_PULSE_CAP);
  assert.equal(
    getLeader(stillCapped).expedition?.lastProgressAt,
    now + EXPEDITION_PULSE_MS,
  );
  assert.equal(getLeader(stillCapped).expeditionTimeCarryMs.whisperingFields, undefined);
});

test('offline progress advances every expedition in the roster independently', () => {
  const state = createInitialGameState(0);
  state.resources.gems = 10;
  const recruited = recruitCat(state, () => 0, 1_000);
  assert.equal(recruited.ok, true);
  if (!recruited.ok) return;

  const leaderId = getLeader(recruited.state).id;
  let current = startExpedition(
    recruited.state,
    leaderId,
    'whisperingFields',
    2_000,
  ).state;
  current = startExpedition(
    current,
    recruited.cat.id,
    'whisperingFields',
    2_000,
  ).state;

  const offline = processOfflineProgress(
    current,
    2_000 + 4 * EXPEDITION_PULSE_MS,
    () => 0.99,
  );
  assert.deepEqual(
    offline.state.cats.map((cat) => cat.expedition?.accumulatedPulses),
    current.cats.map((cat) => 4 * getExpeditionEfficiency(cat, 'whisperingFields')),
  );
  assert.equal(offline.reward, null);
  assert.equal(offline.completedCount, 0);
});

test('collection resolves whole pulses into XP, loot and gems then brings cat home', () => {
  const state = activeExpedition(createInitialGameState(0), 2);
  const before = getLeader(state);
  const collected = collectExpedition(state, before.id, 0, () => 0);

  assert.equal(collected.collected, true);
  assert.equal(collected.resolvedPulses, 2);
  assert.deepEqual(collected.reward, {
    resources: { gems: 2 },
    inventory: { spectralSardine: 2 },
    xp: 4,
    energy: 0,
  });
  assert.equal(getLeader(collected.state).xp, before.xp + 4);
  assert.equal(getLeader(collected.state).expedition, null);
  assert.equal(collected.state.inventory.spectralSardine, 2);
  assert.equal(collected.state.resources.gems, 2);
  assert.equal(collected.state.expeditionCollections.whisperingFields, 1);
});

test('collection refreshes gem and cat-level mission progress after all gains', () => {
  const base = createInitialGameState(0);
  const ready = {
    ...base,
    cats: base.cats.map((cat) => ({
      ...cat,
      level: 2,
      xp: 199,
    })),
  };
  const state = activeExpedition(ready, 3);
  const collected = collectExpedition(state, getLeader(state).id, 0, () => 0);

  assert.equal(collected.levelsGained, 1);
  assert.equal(collected.state.missions.collectGems3.progress, 3);
  assert.equal(collected.state.missions.collectGems3.completed, true);
  assert.equal(collected.state.missions.reachCatLevel3.progress, 3);
  assert.equal(collected.state.missions.reachCatLevel3.completed, true);
});

test('empty collection is safe, returns the cat, and does not count as zone progress', () => {
  const state = createInitialGameState(0);
  const catId = getLeader(state).id;
  const noExpedition = collectExpedition(state, catId, 0, () => {
    throw new Error('must not roll');
  });
  assert.equal(noExpedition.collected, false);
  assert.equal(noExpedition.state, state);

  const started = startExpedition(state, catId, 'whisperingFields', 0);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const empty = collectExpedition(started.state, catId, EXPEDITION_PULSE_MS - 1, () => {
    throw new Error('must not roll');
  });
  assert.equal(empty.collected, true);
  assert.equal(empty.resolvedPulses, 0);
  assert.deepEqual(empty.reward, { resources: {}, inventory: {}, xp: 0, energy: 0 });
  assert.equal(getLeader(empty.state).expedition, null);
  assert.equal(
    getLeader(empty.state).expeditionTimeCarryMs.whisperingFields,
    EXPEDITION_PULSE_MS - 1,
  );
  assert.equal(empty.state.expeditionCollections.whisperingFields, 0);
});

test('early collection preserves raw time and matches one continuous base pulse', () => {
  const initial = createInitialGameState(0);
  const catId = getLeader(initial).id;

  const continuousStart = startExpedition(initial, catId, 'whisperingFields', 0);
  assert.equal(continuousStart.ok, true);
  if (!continuousStart.ok) return;
  let continuousCalls = 0;
  const continuous = collectExpedition(
    continuousStart.state,
    catId,
    EXPEDITION_PULSE_MS,
    () => {
      continuousCalls += 1;
      return 0;
    },
  );

  const earlyStart = startExpedition(initial, catId, 'whisperingFields', 0);
  assert.equal(earlyStart.ok, true);
  if (!earlyStart.ok) return;
  let splitCalls = 0;
  const early = collectExpedition(
    earlyStart.state,
    catId,
    4 * 60_000,
    () => {
      splitCalls += 1;
      return 0;
    },
  );
  assert.equal(early.resolvedPulses, 0);
  assert.equal(splitCalls, 0);
  assert.equal(
    getLeader(early.state).expeditionTimeCarryMs.whisperingFields,
    4 * 60_000,
  );

  const resumed = startExpedition(
    early.state,
    catId,
    'whisperingFields',
    4 * 60_000,
  );
  assert.equal(resumed.ok, true);
  if (!resumed.ok) return;
  const split = collectExpedition(
    resumed.state,
    catId,
    EXPEDITION_PULSE_MS,
    () => {
      splitCalls += 1;
      return 0;
    },
  );

  assert.equal(split.resolvedPulses, continuous.resolvedPulses);
  assert.deepEqual(split.reward, continuous.reward);
  assert.equal(getLeader(split.state).xp, getLeader(continuous.state).xp);
  assert.equal(splitCalls, continuousCalls);
  assert.equal(splitCalls, 2);
});

test('four quarter-pulse collections equal one whole collection without rerolls', () => {
  let state = weakCatState(0);
  const catId = getLeader(state).id;
  let randomCalls = 0;
  const random = () => {
    randomCalls += 1;
    return 0;
  };

  for (let cycle = 0; cycle < 4; cycle += 1) {
    const startAt = cycle * EXPEDITION_PULSE_MS;
    const started = startExpedition(state, catId, 'whisperingFields', startAt);
    assert.equal(started.ok, true);
    if (!started.ok) return;
    const collected = collectExpedition(
      started.state,
      catId,
      startAt + EXPEDITION_PULSE_MS,
      random,
    );
    state = collected.state;

    assert.equal(collected.resolvedPulses, cycle === 3 ? 1 : 0);
    assert.equal(randomCalls, cycle === 3 ? 2 : 0);
  }

  assert.equal(getLeader(state).expeditionPulseCarry.whisperingFields, undefined);
  assert.equal(getLeader(state).xp, 2);
  assert.equal(state.inventory.spectralSardine, 1);
  assert.equal(state.resources.gems, 1);
  assert.equal(state.expeditionCollections.whisperingFields, 1);
});

test('v3 migration defaults and sanitizes collection totals and per-zone pulse carry', () => {
  const oldV3 = createInitialGameState(0);
  delete oldV3.expeditionCollections;
  delete oldV3.cats[0].expeditionPulseCarry;
  delete oldV3.cats[0].expeditionTimeCarryMs;

  const defaults = migrateGameSave(oldV3);
  assert.deepEqual(defaults.expeditionCollections, {
    whisperingFields: 0,
    mistwood: 0,
    grimalkinRuins: 0,
  });
  assert.deepEqual(getLeader(defaults).expeditionPulseCarry, {});
  assert.deepEqual(getLeader(defaults).expeditionTimeCarryMs, {});

  const saved = createInitialGameState(0);
  saved.expeditionCollections = {
    whisperingFields: 5.9,
    mistwood: -3,
    grimalkinRuins: Number.POSITIVE_INFINITY,
  };
  saved.cats[0].expeditionPulseCarry = {
    whisperingFields: 0.25,
    mistwood: 1,
    grimalkinRuins: Number.NaN,
    nowhere: 0.5,
  };
  saved.cats[0].expeditionTimeCarryMs = {
    whisperingFields: 1_234.9,
    mistwood: EXPEDITION_PULSE_MS,
    grimalkinRuins: -1,
    nowhere: 500,
  };
  saved.cats[0].expedition = {
    zoneId: 'whisperingFields',
    startedAt: 0,
    lastProgressAt: 0,
    accumulatedPulses: EXPEDITION_PULSE_CAP + 50,
  };
  const migrated = migrateGameSave(saved);
  assert.deepEqual(migrated.expeditionCollections, {
    whisperingFields: 5,
    mistwood: 0,
    grimalkinRuins: 0,
  });
  assert.deepEqual(getLeader(migrated).expeditionPulseCarry, {
    whisperingFields: 0.25,
  });
  assert.deepEqual(getLeader(migrated).expeditionTimeCarryMs, {
    whisperingFields: 1_234,
  });
  assert.equal(
    getLeader(migrated).expedition?.accumulatedPulses,
    EXPEDITION_PULSE_CAP,
  );
});

test('migration keeps an established activity and clears a conflicting expedition', () => {
  const activeExpeditionValue = {
    zoneId: 'whisperingFields',
    startedAt: 0,
    lastProgressAt: 0,
    accumulatedPulses: 4,
  };
  const activity = {
    activityId: 'huntMice',
    startedAt: 0,
    endsAt: 300_000,
  };

  const current = createInitialGameState(0);
  current.cats[0].activity = activity;
  current.cats[0].expedition = activeExpeditionValue;
  const migratedCurrent = migrateGameSave(current);
  assert.deepEqual(getLeader(migratedCurrent).activity, activity);
  assert.equal(getLeader(migratedCurrent).expedition, null);

  const migratedLegacy = migrateGameSave({
    schemaVersion: 1,
    cat: {
      id: 'legacy',
      expedition: activeExpeditionValue,
    },
    activeActivity: activity,
  });
  assert.deepEqual(getLeader(migratedLegacy).activity, activity);
  assert.equal(getLeader(migratedLegacy).expedition, null);
});

test('efficiency and bag cap hold at the exact 0.25 and 1.5 extremes', () => {
  const weakState = weakCatState(0);
  const weakId = getLeader(weakState).id;
  const weakStart = startExpedition(weakState, weakId, 'whisperingFields', 0);
  assert.equal(weakStart.ok, true);
  if (!weakStart.ok) return;

  const weakBefore = advanceExpeditions(
    weakStart.state,
    (EXPEDITION_PULSE_CAP * 4 - 1) * EXPEDITION_PULSE_MS,
  );
  assert.equal(getExpeditionEfficiency(getLeader(weakState), 'whisperingFields'), 0.25);
  assert.equal(getLeader(weakBefore).expedition?.accumulatedPulses, 95.75);
  const weakAtCap = advanceExpeditions(
    weakBefore,
    EXPEDITION_PULSE_CAP * 4 * EXPEDITION_PULSE_MS,
  );
  assert.equal(getLeader(weakAtCap).expedition?.accumulatedPulses, EXPEDITION_PULSE_CAP);

  const strongBase = createInitialGameState(0);
  const strongState = {
    ...strongBase,
    cats: strongBase.cats.map((cat) => ({
      ...cat,
      level: 20,
      stats: { ...cat.stats, attack: 20, defense: 20 },
    })),
  };
  const strongId = getLeader(strongState).id;
  const strongStart = startExpedition(strongState, strongId, 'whisperingFields', 0);
  assert.equal(strongStart.ok, true);
  if (!strongStart.ok) return;

  const strongBefore = advanceExpeditions(strongStart.state, 63 * EXPEDITION_PULSE_MS);
  assert.equal(getExpeditionEfficiency(getLeader(strongState), 'whisperingFields'), 1.5);
  assert.equal(getLeader(strongBefore).expedition?.accumulatedPulses, 94.5);
  const strongAtCap = advanceExpeditions(strongBefore, 64 * EXPEDITION_PULSE_MS);
  assert.equal(getLeader(strongAtCap).expedition?.accumulatedPulses, EXPEDITION_PULSE_CAP);
});

test('pulse and temporal carry stay isolated between expedition zones', () => {
  const base = createInitialGameState(0);
  const state = {
    ...base,
    cats: base.cats.map((cat) => ({
      ...cat,
      level: 4,
      expeditionPulseCarry: { whisperingFields: 0.25, mistwood: 0.5 },
      expeditionTimeCarryMs: {
        whisperingFields: 60_000,
        mistwood: 2 * 60_000,
      },
    })),
  };
  const catId = getLeader(state).id;
  const started = startExpedition(state, catId, 'whisperingFields', 0);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  assert.equal(getLeader(started.state).expedition?.accumulatedPulses, 0.25);
  assert.equal(getLeader(started.state).expeditionPulseCarry.whisperingFields, undefined);
  assert.equal(getLeader(started.state).expeditionPulseCarry.mistwood, 0.5);

  const advanced = advanceExpeditions(started.state, 4 * 60_000);
  assert.equal(getLeader(advanced).expedition?.accumulatedPulses, 1.75);
  assert.equal(getLeader(advanced).expeditionTimeCarryMs.whisperingFields, undefined);
  assert.equal(getLeader(advanced).expeditionTimeCarryMs.mistwood, 2 * 60_000);

  const collected = collectExpedition(advanced, catId, 4 * 60_000, () => 0.99);
  assert.equal(getLeader(collected.state).expeditionPulseCarry.whisperingFields, 0.75);
  assert.equal(getLeader(collected.state).expeditionPulseCarry.mistwood, 0.5);
  assert.equal(getLeader(collected.state).expeditionTimeCarryMs.mistwood, 2 * 60_000);
});

test('expedition RNG gives no drop above or exactly on each chance boundary', () => {
  const state = activeExpedition(createInitialGameState(0), 1);
  const catId = getLeader(state).id;
  const noDrop = collectExpedition(state, catId, 0, () => 0.99);
  assert.deepEqual(noDrop.reward.inventory, {});
  assert.deepEqual(noDrop.reward.resources, {});

  const rolls = [0.18, 0.002];
  let calls = 0;
  const boundary = collectExpedition(state, catId, 0, () => {
    const value = rolls[calls];
    calls += 1;
    return value;
  });
  assert.equal(calls, 2);
  assert.deepEqual(boundary.reward.inventory, {});
  assert.deepEqual(boundary.reward.resources, {});
});

test('minimal realistic v2 save defaults every E1 expedition field', () => {
  const migrated = migrateGameSave({
    schemaVersion: 2,
    onboarded: true,
    cats: [
      {
        id: 'legacy-leader',
        name: 'Bruma',
        catClass: 'archer',
        level: 4,
        xp: 37,
        energy: 19,
        maxEnergy: 44,
        stats: { attack: 5, defense: 3, hunting: 6, fishing: 2, luck: 2 },
        activity: null,
      },
    ],
    leaderId: 'legacy-leader',
    resources: {
      fish: 12,
      mice: 8,
      yarn: 4,
      catnip: 1,
      coins: 90,
      cardboardBoxes: 2,
      gems: 3,
    },
    inventory: { rareFeather: 1, goldenSardine: 0, glowingYarn: 2 },
    lastSavedAt: 9_000,
  });

  assert.equal(migrated.schemaVersion, 3);
  assert.equal(getLeader(migrated).name, 'Bruma');
  assert.equal(getLeader(migrated).xp, 37);
  assert.equal(getLeader(migrated).expedition, null);
  assert.deepEqual(getLeader(migrated).expeditionPulseCarry, {});
  assert.deepEqual(getLeader(migrated).expeditionTimeCarryMs, {});
  assert.deepEqual(migrated.expeditionCollections, {
    whisperingFields: 0,
    mistwood: 0,
    grimalkinRuins: 0,
  });
});
