import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { evolutionNodeIds } from '../src/game/data/evolution.ts';
import { missions } from '../src/game/data/missions.ts';
import { upgrades } from '../src/game/data/upgrades.ts';
import { migrateGameSave } from '../src/game/storage/migrations.ts';
import { startActivity, completeCurrentActivity } from '../src/game/systems/activitySystem.ts';
import { processOfflineProgress } from '../src/game/systems/offlineSystem.ts';
import {
  advanceResearch,
  enterNewTimeline,
  getEvolutionBonuses,
  getTimelineReadiness,
  getTimelineShardReward,
  startResearch,
} from '../src/game/systems/evolutionSystem.ts';

test('fresh Catvolution save starts in timeline one with empty modular research', () => {
  const state = createInitialGameState(1_000);
  assert.equal(state.schemaVersion, 7);
  assert.deepEqual(state.evolution, { unlocked: [], activeResearch: null });
  assert.deepEqual(state.timeline, {
    number: 1,
    shards: 0,
    totalShards: 0,
    lastShiftAt: null,
  });
});

test('research spends once, respects prerequisites, and completes on the exact boundary', () => {
  const initial = createInitialGameState(1_000);
  initial.resources.coins = 100;
  initial.resources.yarn = 20;

  const blocked = startResearch(initial, 'dataDen', 1_000);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.state, initial);

  const started = startResearch(initial, 'improvisedWorkshop', 1_000);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  assert.equal(started.state.resources.coins, 75);
  assert.equal(started.state.resources.yarn, 17);
  assert.equal(started.state.evolution.activeResearch?.endsAt, 181_000);

  assert.equal(advanceResearch(started.state, 180_999).completedNodeId, null);
  const completed = advanceResearch(started.state, 181_000);
  assert.equal(completed.completedNodeId, 'improvisedWorkshop');
  assert.deepEqual(completed.state.evolution.unlocked, ['improvisedWorkshop']);
  assert.equal(completed.state.evolution.activeResearch, null);
});

test('research completion is processed offline without rerolling resources', () => {
  const state = createInitialGameState(1_000);
  state.resources.coins = 50;
  state.resources.fish = 4;
  const started = startResearch(state, 'curiosityLab', 1_000);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const offline = processOfflineProgress(started.state, 181_000, () => 0);
  assert.equal(offline.completedResearchNodeId, 'curiosityLab');
  assert.deepEqual(offline.state.evolution.unlocked, ['curiosityLab']);
  assert.equal(offline.state.resources.coins, 25);
  assert.equal(offline.state.resources.fish, 2);
});

test('evolution bonuses are additive, capped, and affect future activities', () => {
  const state = createInitialGameState(1_000);
  state.evolution.unlocked = [...evolutionNodeIds];
  state.timeline.shards = 99;
  const bonuses = getEvolutionBonuses(state);

  assert.equal(bonuses.activityDurationMultiplier, 0.65);
  assert.equal(bonuses.activityXpMultiplier, 1.45);
  assert.equal(bonuses.rareChanceBonus, 0.05);
  assert.equal(bonuses.researchDurationMultiplier, 0.5);

  state.timeline.shards = 0;
  state.evolution.unlocked = ['improvisedWorkshop', 'curiosityLab'];
  const started = startActivity(state, 'searchYarn', 1_000);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  assert.equal(started.state.cats[0].activity?.endsAt, 163_000);

  const completed = completeCurrentActivity(started.state, 163_000, () => 0);
  assert.equal(completed.reward.xp, 11);
});

test('v6 saves default Catvolution state and current saves sanitize research dependencies', () => {
  const legacy = createInitialGameState(1_000);
  legacy.schemaVersion = 6;
  delete legacy.evolution;
  delete legacy.timeline;
  const migratedLegacy = migrateGameSave(JSON.parse(JSON.stringify(legacy)));
  assert.deepEqual(migratedLegacy.evolution, { unlocked: [], activeResearch: null });
  assert.equal(migratedLegacy.timeline.number, 1);

  const migrated = migrateGameSave({
    ...createInitialGameState(1_000),
    evolution: {
      unlocked: ['dataDen', 'improvisedWorkshop', 'unknown', 'bioCyborg'],
      activeResearch: { nodeId: 'geneGarden', startedAt: 2_000, endsAt: 4_000 },
    },
    timeline: { number: 3, shards: 4, totalShards: 2, lastShiftAt: 'bad' },
  });
  assert.deepEqual(migrated.evolution.unlocked, ['improvisedWorkshop', 'dataDen']);
  assert.equal(migrated.evolution.activeResearch, null);
  assert.deepEqual(migrated.timeline, {
    number: 3,
    shards: 4,
    totalShards: 4,
    lastShiftAt: null,
  });
});

test('new timeline requires both gates, resets era progress, and preserves permanent identity', () => {
  const state = createInitialGameState(1_000);
  state.onboarded = true;
  state.cats[0].name = 'Nebulosa';
  state.cats[0].catClass = 'mage';
  state.cats[0].level = 11;
  state.resources.coins = 9_999;
  state.evolution.unlocked = [...evolutionNodeIds];
  for (const mission of missions) state.missions[mission.id].claimed = true;
  for (const upgrade of upgrades) state.upgrades[upgrade.id].level = upgrade.maxLevel;

  assert.deepEqual(getTimelineReadiness(state), {
    chronicleComplete: true,
    evolutionComplete: true,
    ready: true,
  });
  assert.equal(getTimelineShardReward(state), 2);

  const shifted = enterNewTimeline(state, 5_000);
  assert.equal(shifted.ok, true);
  if (!shifted.ok) return;
  assert.equal(shifted.shardsAwarded, 2);
  assert.equal(shifted.state.timeline.number, 2);
  assert.equal(shifted.state.timeline.shards, 2);
  assert.equal(shifted.state.resources.coins, 20);
  assert.deepEqual(shifted.state.evolution.unlocked, []);
  assert.equal(shifted.state.cats.length, 1);
  assert.equal(shifted.state.cats[0].name, 'Nebulosa');
  assert.equal(shifted.state.cats[0].catClass, 'mage');
  assert.equal(shifted.state.cats[0].level, 1);
});

test('timeline shard reward caps at five even for extreme colonies', () => {
  const state = createInitialGameState(1_000);
  state.cats[0].level = 999;
  for (const zoneId of Object.keys(state.expeditionCollections)) {
    state.expeditionCollections[zoneId] = 10_000;
  }
  assert.equal(getTimelineShardReward(state), 5);
});
