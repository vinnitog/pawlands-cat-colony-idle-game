import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { activityById } from '../src/game/data/activities.ts';
import {
  EXPEDITION_PULSE_CAP,
  EXPEDITION_PULSE_MS,
} from '../src/game/models/expedition.ts';
import * as activityRules from '../src/game/rules/activityRules.ts';
import * as expeditionRules from '../src/game/rules/expeditionRules.ts';
import * as powerRules from '../src/game/rules/powerRules.ts';
import * as activitySystem from '../src/game/systems/activitySystem.ts';
import * as equipmentSystem from '../src/game/systems/equipmentSystem.ts';
import { advanceExpeditions } from '../src/game/systems/expeditionSystem.ts';
import * as expeditionSystem from '../src/game/systems/expeditionSystem.ts';
import { processOfflineProgress } from '../src/game/systems/offlineSystem.ts';
import { getWorldIdleSignals } from '../src/game/world/worldIdleSignals.ts';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');

function cloneCat(cat, id, name) {
  return {
    ...structuredClone(cat),
    id,
    name,
  };
}

function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freezeDeep(child);
  return Object.freeze(value);
}

test('G3.3 expedition preview changes at the exact pulse and bag limits', () => {
  const base = createInitialGameState(0);
  const quiet = getWorldIdleSignals(base, 0);
  assert.equal(quiet.expedition.status, 'quiet');
  assert.equal(quiet.activities.status, 'quiet');

  const expedition = {
    zoneId: 'whisperingFields',
    startedAt: 0,
    lastProgressAt: 0,
    accumulatedPulses: 0,
  };
  const active = {
    ...base,
    cats: [{ ...base.cats[0], expedition }],
  };

  assert.equal(
    getWorldIdleSignals(active, EXPEDITION_PULSE_MS - 1).expedition.status,
    'active',
  );

  const ready = getWorldIdleSignals(active, EXPEDITION_PULSE_MS).expedition;
  assert.equal(ready.status, 'ready');
  assert.equal(ready.cats[0].accumulatedPulses, 1.25);

  const nearlyFull = {
    ...active,
    cats: [{
      ...active.cats[0],
      expedition: { ...expedition, accumulatedPulses: EXPEDITION_PULSE_CAP - 0.5 },
    }],
  };
  const full = getWorldIdleSignals(nearlyFull, EXPEDITION_PULSE_MS).expedition;
  assert.equal(full.status, 'full');
  assert.equal(full.cats[0].accumulatedPulses, EXPEDITION_PULSE_CAP);
  assert.equal(full.cats[0].capacity, EXPEDITION_PULSE_CAP);
});

test('G3.3 expedition preview includes carried time and every roster cat', () => {
  const state = createInitialGameState(0);
  const second = cloneCat(state.cats[0], 'luna', 'Luna');
  const cats = [state.cats[0], second].map((cat, index) => ({
    ...cat,
    expedition: {
      zoneId: index === 0 ? 'whisperingFields' : 'mistwood',
      startedAt: 0,
      lastProgressAt: 0,
      accumulatedPulses: index === 0 ? 0 : EXPEDITION_PULSE_CAP,
    },
    expeditionTimeCarryMs: index === 0
      ? { whisperingFields: EXPEDITION_PULSE_MS - 1 }
      : {},
  }));
  const signals = getWorldIdleSignals(
    { ...state, cats },
    1,
  ).expedition;

  assert.equal(signals.status, 'full');
  assert.deepEqual(signals.cats.map((cat) => cat.catName), ['Milo', 'Luna']);
  assert.equal(signals.cats[0].status, 'ready');
  assert.equal(signals.cats[1].status, 'full');
});

test('G3.3 expedition preview matches authoritative rollback, carry, clamps and cap', async (t) => {
  const base = createInitialGameState(0);
  const defaultCat = base.cats[0];
  const weakCat = {
    ...defaultCat,
    level: 1,
    stats: { ...defaultCat.stats, attack: 0, defense: 0 },
  };
  const strongCat = {
    ...defaultCat,
    level: 20,
    stats: { ...defaultCat.stats, attack: 20, defense: 20 },
  };
  const cases = [
    {
      name: 'clock rollback',
      cat: defaultCat,
      lastProgressAt: 100,
      now: 99,
      carriedMs: 0,
      accumulatedPulses: 2.75,
      expected: 2.75,
    },
    {
      name: 'zero carry before a whole pulse',
      cat: defaultCat,
      lastProgressAt: 0,
      now: EXPEDITION_PULSE_MS - 1,
      carriedMs: 0,
      accumulatedPulses: 0,
      expected: 0,
    },
    {
      name: 'one millisecond carry completes a pulse',
      cat: defaultCat,
      lastProgressAt: 0,
      now: EXPEDITION_PULSE_MS - 1,
      carriedMs: 1,
      accumulatedPulses: 0,
      expected: 1.25,
    },
    {
      name: 'pulse minus one carry completes a pulse',
      cat: defaultCat,
      lastProgressAt: 0,
      now: 1,
      carriedMs: EXPEDITION_PULSE_MS - 1,
      accumulatedPulses: 0,
      expected: 1.25,
    },
    {
      name: 'weak cat uses the 0.25 efficiency clamp',
      cat: weakCat,
      lastProgressAt: 0,
      now: EXPEDITION_PULSE_MS,
      carriedMs: 0,
      accumulatedPulses: 0,
      expected: 0.25,
    },
    {
      name: 'strong cat uses the 1.5 efficiency clamp',
      cat: strongCat,
      lastProgressAt: 0,
      now: EXPEDITION_PULSE_MS,
      carriedMs: 0,
      accumulatedPulses: 0,
      expected: 1.5,
    },
    {
      name: 'preview and engine stop at the offline cap',
      cat: strongCat,
      lastProgressAt: 0,
      now: EXPEDITION_PULSE_MS,
      carriedMs: 0,
      accumulatedPulses: EXPEDITION_PULSE_CAP - 0.5,
      expected: EXPEDITION_PULSE_CAP,
    },
  ];

  for (const scenario of cases) {
    await t.test(scenario.name, () => {
      const cat = {
        ...scenario.cat,
        expedition: {
          zoneId: 'whisperingFields',
          startedAt: scenario.lastProgressAt,
          lastProgressAt: scenario.lastProgressAt,
          accumulatedPulses: scenario.accumulatedPulses,
        },
        expeditionTimeCarryMs: scenario.carriedMs > 0
          ? { whisperingFields: scenario.carriedMs }
          : {},
      };
      const active = { ...base, cats: [cat] };
      const preview = getWorldIdleSignals(active, scenario.now).expedition.cats[0];
      const advanced = advanceExpeditions(active, scenario.now).cats[0].expedition;

      assert.equal(preview.accumulatedPulses, scenario.expected);
      assert.equal(preview.accumulatedPulses, advanced?.accumulatedPulses);
    });
  }
});

test('G3.3 activity posts group cats by type and finish on the effective limit', () => {
  const state = createInitialGameState(0);
  const duration = activityById.exploreYard.durationMs;
  const activity = {
    activityId: 'exploreYard',
    startedAt: 100,
    endsAt: 100 + duration * 10,
  };
  const cats = [
    { ...state.cats[0], activity },
    {
      ...cloneCat(state.cats[0], 'nina', 'Nina'),
      activity: { ...activity, startedAt: 100 + duration / 2 },
    },
  ];
  const before = getWorldIdleSignals(
    { ...state, cats },
    100 + duration - 1,
  ).activities;
  const atLimit = getWorldIdleSignals(
    { ...state, cats },
    100 + duration,
  ).activities;
  const yardBefore = before.posts.find((post) => post.activityId === 'exploreYard');
  const yardAtLimit = atLimit.posts.find((post) => post.activityId === 'exploreYard');

  assert.equal(before.posts.length, 5);
  assert.equal(yardBefore?.stationName, 'Praça e eixo cívico');
  assert.deepEqual(
    yardBefore?.assignments.map(({ catName, status }) => [catName, status]),
    [['Milo', 'active'], ['Nina', 'active']],
  );
  assert.equal(yardBefore?.status, 'active');
  assert.equal(atLimit.status, 'ready');
  assert.equal(yardAtLimit?.status, 'ready');
  assert.deepEqual(
    yardAtLimit?.assignments.map(({ catName, status }) => [catName, status]),
    [['Milo', 'ready'], ['Nina', 'active']],
  );
});

test('G3.3 exposes all five saved upgrade phases without changing save shape', () => {
  const state = createInitialGameState(0);
  delete state.upgrades.cardboardBox;
  state.upgrades.foodBowl.level = 1;
  state.upgrades.scratcher.level = 2;
  state.upgrades.fishingCorner.level = 3;
  state.upgrades.catnipGarden.level = 99;
  const signals = getWorldIdleSignals(state, 0);
  const byId = Object.fromEntries(
    signals.upgrades.map((upgrade) => [upgrade.upgradeId, upgrade]),
  );

  assert.equal(signals.upgrades.length, 5);
  assert.deepEqual(
    Object.values(byId).map(({ level, phase }) => [level, phase]),
    [
      [1, 'base'],
      [1, 'base'],
      [2, 'improved'],
      [3, 'complete'],
      [3, 'complete'],
    ],
  );
  assert.equal(Object.hasOwn(state, 'worldIdleSignals'), false);
});

test('G3.3 activity posts keep quiet stations and independent activity types', () => {
  const state = createInitialGameState(0);
  const now = 50_000;
  const assignment = (activityId, offsetMs = 0) => ({
    activityId,
    startedAt: now - activityById[activityId].durationMs + offsetMs,
    endsAt: now + 1_000_000,
  });
  const cats = [
    { ...state.cats[0], activity: assignment('fishPond') },
    {
      ...cloneCat(state.cats[0], 'luna', 'Luna'),
      activity: assignment('huntMice', 1),
    },
    {
      ...cloneCat(state.cats[0], 'tito', 'Tito'),
      activity: assignment('searchYarn'),
    },
  ];
  const signals = getWorldIdleSignals({ ...state, cats }, now).activities;
  const byId = Object.fromEntries(
    signals.posts.map((post) => [post.activityId, post]),
  );

  assert.equal(signals.status, 'ready');
  assert.equal(byId.fishPond.status, 'ready');
  assert.deepEqual(byId.fishPond.assignments.map((item) => item.catName), ['Milo']);
  assert.equal(byId.huntMice.status, 'active');
  assert.deepEqual(byId.huntMice.assignments.map((item) => item.catName), ['Luna']);
  assert.equal(byId.searchYarn.status, 'ready');
  assert.deepEqual(byId.searchYarn.assignments.map((item) => item.catName), ['Tito']);
  assert.equal(byId.sleep.status, 'quiet');
  assert.equal(byId.exploreYard.status, 'quiet');
  assert.deepEqual(byId.sleep.assignments, []);
});

test('G3.3 selector sees the whole roster while the leader is away', () => {
  const state = createInitialGameState(0);
  const leader = {
    ...state.cats[0],
    expedition: {
      zoneId: 'whisperingFields',
      startedAt: 0,
      lastProgressAt: 0,
      accumulatedPulses: 0,
    },
  };
  const worker = {
    ...cloneCat(state.cats[0], 'luna', 'Luna'),
    activity: {
      activityId: 'searchYarn',
      startedAt: 0,
      endsAt: activityById.searchYarn.durationMs,
    },
  };
  const idle = cloneCat(state.cats[0], 'tito', 'Tito');
  const away = freezeDeep({ ...state, cats: [leader, worker, idle] });
  const signals = getWorldIdleSignals(away, 0);

  assert.equal(away.leaderId, leader.id);
  assert.deepEqual(signals.expedition.cats.map((cat) => cat.catName), ['Milo']);
  assert.deepEqual(
    signals.activities.posts
      .flatMap((post) => post.assignments)
      .map((assignment) => assignment.catName),
    ['Luna'],
  );
  assert.equal(
    signals.activities.posts.some((post) =>
      post.assignments.some((assignment) => assignment.catName === 'Tito')),
    false,
  );
});

test('G3.3 public systems reexport the shared rule functions by identity', () => {
  assert.equal(
    activitySystem.getEffectiveActivityEndsAt,
    activityRules.getEffectiveActivityEndsAt,
  );
  assert.equal(equipmentSystem.getCatAttributePower, powerRules.getCatAttributePower);
  assert.equal(equipmentSystem.getEquipmentPower, powerRules.getEquipmentPower);
  assert.equal(expeditionSystem.getCatPower, expeditionRules.getCatPower);
  assert.equal(
    expeditionSystem.getExpeditionEfficiency,
    expeditionRules.getExpeditionEfficiency,
  );
});

test('G3.3 preview call cannot change offline progression, economy or save state', () => {
  const base = createInitialGameState(0);
  const hunter = {
    ...cloneCat(base.cats[0], 'luna', 'Luna'),
    expedition: {
      zoneId: 'whisperingFields',
      startedAt: 0,
      lastProgressAt: 0,
      accumulatedPulses: 0,
    },
    expeditionTimeCarryMs: {
      whisperingFields: EXPEDITION_PULSE_MS - 1,
    },
  };
  const prepared = {
    ...base,
    cats: [
      {
        ...base.cats[0],
        activity: {
          activityId: 'huntMice',
          startedAt: 0,
          endsAt: activityById.huntMice.durationMs,
        },
      },
      hunter,
    ],
  };
  const controlInput = freezeDeep(structuredClone(prepared));
  const previewInput = freezeDeep(structuredClone(prepared));
  const controlBefore = JSON.stringify(controlInput);
  const previewBefore = JSON.stringify(previewInput);
  const now = Math.max(activityById.huntMice.durationMs, 1);
  const fixedRandom = () => 0.99;

  const control = processOfflineProgress(controlInput, now, fixedRandom);
  getWorldIdleSignals(previewInput, now);
  const afterPreview = processOfflineProgress(previewInput, now, fixedRandom);

  assert.deepEqual(afterPreview, control);
  assert.deepEqual(afterPreview.state.resources, control.state.resources);
  assert.deepEqual(afterPreview.state.inventory, control.state.inventory);
  assert.equal(
    afterPreview.state.cats.find((cat) => cat.id === hunter.id)?.expedition?.accumulatedPulses,
    control.state.cats.find((cat) => cat.id === hunter.id)?.expedition?.accumulatedPulses,
  );
  assert.equal(afterPreview.state.lastSavedAt, control.state.lastSavedAt);
  assert.equal(JSON.stringify(controlInput), controlBefore);
  assert.equal(JSON.stringify(previewInput), previewBefore);
});

test('G3.3 selector is pure and does not import reward, storage or offline systems', () => {
  const state = freezeDeep(createInitialGameState(0));
  const before = JSON.stringify(state);

  const first = getWorldIdleSignals(state, EXPEDITION_PULSE_MS);
  const second = getWorldIdleSignals(state, EXPEDITION_PULSE_MS);
  assert.deepEqual(second, first);
  assert.equal(JSON.stringify(state), before);

  const source = read('src/game/world/worldIdleSignals.ts');
  assert.doesNotMatch(source, /\/systems\//);
  assert.doesNotMatch(source, /systems\/(economy|expedition|offline|activity|upgrade)System/);
  assert.doesNotMatch(source, /storage|localStorage|saveGame|Math\.random/);
});

test('G3.3 bulletin remains available with an away leader and has three direct routes', () => {
  const screen = read('src/ui/screens/WorldScreen.tsx');
  const css = read('src/styles/global.css');
  const awayStart = screen.indexOf('if (activeExpedition)');
  const normalStart = screen.indexOf('\n  return (', awayStart + 1);

  assert.match(screen.slice(awayStart, normalStart), /<WorldColonyBulletin/);
  assert.match(screen.slice(normalStart), /<WorldColonyBulletin/);
  assert.match(screen, /Boletim da colônia/);
  assert.match(screen, /goTo\('expedition'\)/);
  assert.match(screen, /goTo\('activities'\)/);
  assert.match(screen, /goTo\('upgrades'\)/);
  assert.match(screen, /signals\.expedition\.cats[\s\S]*?\.map\(\(cat\)/);
  assert.match(screen, /\{cat\.catName\} em \{cat\.zoneName\}/);
  assert.match(screen, /Concluindo/);
  assert.match(screen, /\{post\.stationName\} — \{post\.activityName\}/);
  assert.match(screen, /post\.assignments\.map\(\(assignment, index\)/);
  assert.match(screen, /activitySignalLabels\[assignment\.status\]/);
  assert.match(screen, /nível \{upgrade\.level\}\/\{upgrade\.maxLevel\}/);
  assert.match(screen, /Ver Expedição/);
  assert.match(screen, /Ver Atividades/);
  assert.match(screen, /Ver Melhorias/);
  assert.match(screen, /aria-describedby="world-away-description"/);
  assert.doesNotMatch(screen, /aria-label="Abrir (Expedição|Atividades|Melhorias)"/);
  assert.doesNotMatch(screen, /aria-live/);
  assert.match(css, /\.world-bulletin-card:focus-visible/);
  assert.match(css, /@media \(max-width: 759px\)/);
  assert.match(
    css,
    /\.world-screen-layout:not\(\.world-screen-layout--away\) \.world-bulletin\s*\{\s*order: -1;/,
  );
  assert.match(css, /@media \(min-width: 760px\) and \(max-width: 1099px\)/);
  assert.match(css, /\.world-bulletin \.signal-upgrades\s*\{\s*grid-column: 1 \/ -1;/);
  assert.match(css, /\.world-upgrade-marks\s*\{\s*display: grid;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
