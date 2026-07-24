import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { migrateGameSave } from '../src/game/storage/migrations.ts';
import { getLeader, updateLeader } from '../src/game/systems/colonySystem.ts';

/** A realistic v1 save: single `cat` + top-level `activeActivity`. */
function v1Save() {
  return {
    schemaVersion: 1,
    onboarded: true,
    cat: {
      id: 'milo',
      name: 'Nera',
      catClass: 'ninja',
      level: 4,
      xp: 55,
      energy: 21,
      maxEnergy: 46,
      stats: { attack: 6, defense: 4, hunting: 6, fishing: 4, luck: 7 },
    },
    resources: { fish: 12, mice: 8, yarn: 5, catnip: 2, coins: 133, cardboardBoxes: 1, gems: 4 },
    activeActivity: { activityId: 'fishPond', startedAt: 1_000, endsAt: 481_000, atLake: true },
    world: { x: 100, y: 120 },
    totals: { activitiesCompleted: 17, upgradesPurchased: 2, resourcesEarned: {} },
    lastSavedAt: 5_000,
  };
}

test('v1 save migrates into a one-cat roster without losing progress', () => {
  const migrated = migrateGameSave(v1Save());

  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.cats.length, 1);
  assert.equal(migrated.leaderId, 'milo');

  const leader = getLeader(migrated);
  assert.equal(leader.name, 'Nera');
  assert.equal(leader.catClass, 'ninja');
  assert.equal(leader.level, 4);
  assert.equal(leader.xp, 55);
  assert.equal(leader.energy, 21);
  assert.deepEqual(leader.stats, { attack: 6, defense: 4, hunting: 6, fishing: 4, luck: 7 });

  // The top-level activeActivity folds into the leader, lake flag included.
  assert.equal(leader.activity?.activityId, 'fishPond');
  assert.equal(leader.activity?.atLake, true);

  assert.equal(migrated.resources.coins, 133);
  assert.equal(migrated.resources.gems, 4);
  assert.equal(migrated.totals.activitiesCompleted, 17);
  assert.deepEqual(migrated.world, { x: 100, y: 120 });
});

test('v2 save round-trips through migration untouched', () => {
  const state = updateLeader(createInitialGameState(1_000), (cat) => ({
    ...cat,
    name: 'Bruma',
    level: 3,
  }));
  const migrated = migrateGameSave(JSON.parse(JSON.stringify(state)));

  assert.equal(migrated.cats.length, 1);
  assert.equal(getLeader(migrated).name, 'Bruma');
  assert.equal(getLeader(migrated).level, 3);
});

test('a stale leaderId falls back to the first cat', () => {
  const state = createInitialGameState(1_000);
  const broken = JSON.parse(JSON.stringify({ ...state, leaderId: 'ghost' }));
  const migrated = migrateGameSave(broken);

  assert.equal(migrated.leaderId, migrated.cats[0].id);
  assert.equal(getLeader(migrated).name, 'Milo');
});

test('unknown schema versions fall back to a fresh state', () => {
  const migrated = migrateGameSave({ schemaVersion: 99, cats: 'nonsense' });
  assert.equal(migrated.cats.length, 1);
  assert.equal(getLeader(migrated).name, 'Milo');
});
