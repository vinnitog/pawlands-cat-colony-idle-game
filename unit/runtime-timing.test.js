import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import { build, createServer } from 'vite';
import { activities as officialActivities } from '../src/game/data/activities.ts';
import {
  EXPEDITION_PULSE_MS as NODE_EXPEDITION_PULSE_MS,
  OFFICIAL_EXPEDITION_PULSE_MS,
} from '../src/game/models/expedition.ts';
import { getRuntimeDurationMs as getNodeRuntimeDurationMs } from '../src/game/config/runtimeTiming.ts';

const LOCAL_TEST_DURATION_MS = 10_000;
const OFFICIAL_ACTIVITY_DURATIONS_MS = [
  5 * 60_000,
  8 * 60_000,
  3 * 60_000,
  15 * 60_000,
  20 * 60_000,
];

let devServer;
let devModules;

before(async () => {
  devServer = await createServer({
    configFile: false,
    logLevel: 'silent',
    appType: 'custom',
    server: { middlewareMode: true },
  });

  const [
    activityData,
    expeditionModel,
    initialGameState,
    activitySystem,
    colonySystem,
    expeditionSystem,
    migrations,
  ] = await Promise.all([
    devServer.ssrLoadModule('/src/game/data/activities.ts'),
    devServer.ssrLoadModule('/src/game/models/expedition.ts'),
    devServer.ssrLoadModule('/src/game/data/initialGameState.ts'),
    devServer.ssrLoadModule('/src/game/systems/activitySystem.ts'),
    devServer.ssrLoadModule('/src/game/systems/colonySystem.ts'),
    devServer.ssrLoadModule('/src/game/systems/expeditionSystem.ts'),
    devServer.ssrLoadModule('/src/game/storage/migrations.ts'),
  ]);

  devModules = {
    activityData,
    expeditionModel,
    initialGameState,
    activitySystem,
    colonySystem,
    expeditionSystem,
    migrations,
  };
});

after(async () => {
  await devServer?.close();
});

test('Vite development gives every activity and expedition pulse a 10-second runtime', () => {
  assert.deepEqual(
    devModules.activityData.activities.map((activity) => activity.durationMs),
    Array(5).fill(LOCAL_TEST_DURATION_MS),
  );
  assert.equal(devModules.expeditionModel.EXPEDITION_PULSE_MS, LOCAL_TEST_DURATION_MS);
  assert.equal(
    devModules.expeditionModel.OFFICIAL_EXPEDITION_PULSE_MS,
    OFFICIAL_EXPEDITION_PULSE_MS,
  );
});

test('Vite development expedition advances only at the exact 10-second boundary', () => {
  const { createInitialGameState } = devModules.initialGameState;
  const { getLeader } = devModules.colonySystem;
  const {
    advanceExpeditions,
    getExpeditionEfficiency,
    startExpedition,
  } = devModules.expeditionSystem;

  const state = createInitialGameState(0);
  const catId = getLeader(state).id;
  const started = startExpedition(state, catId, 'whisperingFields', 0);
  assert.equal(started.ok, true);

  const beforePulse = advanceExpeditions(started.state, LOCAL_TEST_DURATION_MS - 1);
  assert.equal(getLeader(beforePulse).expedition.accumulatedPulses, 0);

  const atPulse = advanceExpeditions(started.state, LOCAL_TEST_DURATION_MS);
  assert.equal(
    getLeader(atPulse).expedition.accumulatedPulses,
    getExpeditionEfficiency(getLeader(state), 'whisperingFields'),
  );
});

test('Vite development completes a saved official activity at 10 seconds', () => {
  const { createInitialGameState } = devModules.initialGameState;
  const { completeCurrentActivity, getEffectiveActivityEndsAt } = devModules.activitySystem;
  const { getLeader } = devModules.colonySystem;
  const state = createInitialGameState(0);
  state.cats[0].activity = {
    activityId: 'huntMice',
    startedAt: 0,
    endsAt: OFFICIAL_ACTIVITY_DURATIONS_MS[0],
  };

  assert.equal(getEffectiveActivityEndsAt(getLeader(state).activity), LOCAL_TEST_DURATION_MS);
  assert.equal(
    completeCurrentActivity(state, LOCAL_TEST_DURATION_MS - 1, () => 0.99).completed,
    false,
  );
  assert.equal(
    completeCurrentActivity(state, LOCAL_TEST_DURATION_MS, () => 0.99).completed,
    true,
  );
});

test('save migration validates expedition carry against the official five-minute pulse', () => {
  const { createInitialGameState } = devModules.initialGameState;
  const { getLeader } = devModules.colonySystem;
  const { migrateGameSave } = devModules.migrations;

  const preservedSave = createInitialGameState(0);
  preservedSave.cats[0].expeditionTimeCarryMs = { whisperingFields: 299_999 };
  assert.equal(
    getLeader(migrateGameSave(preservedSave)).expeditionTimeCarryMs.whisperingFields,
    299_999,
  );

  const rejectedSave = createInitialGameState(0);
  rejectedSave.cats[0].expeditionTimeCarryMs = { whisperingFields: 300_000 };
  assert.equal(
    getLeader(migrateGameSave(rejectedSave)).expeditionTimeCarryMs.whisperingFields,
    undefined,
  );
});

test('plain Node keeps the official activity catalog and five-minute expedition pulse', () => {
  assert.deepEqual(
    officialActivities.map((activity) => activity.durationMs),
    OFFICIAL_ACTIVITY_DURATIONS_MS,
  );
  assert.equal(NODE_EXPEDITION_PULSE_MS, OFFICIAL_EXPEDITION_PULSE_MS);
  assert.equal(NODE_EXPEDITION_PULSE_MS, 300_000);
  assert.equal(getNodeRuntimeDurationMs(987_654), 987_654);
});

test('Vite production bundle keeps official timings without writing build artifacts', async () => {
  const result = await build({
    configFile: false,
    mode: 'production',
    logLevel: 'silent',
    build: {
      write: false,
      lib: {
        entry: resolve('src/game/config/runtimeTiming.ts'),
        formats: ['es'],
        fileName: 'runtime-timing',
      },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  const entryChunk = outputs
    .flatMap((output) => output.output)
    .find((output) => output.type === 'chunk' && output.isEntry);

  assert.ok(entryChunk);
  const bundledModule = await import(
    `data:text/javascript;base64,${Buffer.from(entryChunk.code).toString('base64')}`
  );
  assert.equal(bundledModule.getRuntimeDurationMs(300_000), 300_000);
});
