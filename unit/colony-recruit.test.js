import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import {
  getLeader,
  getRecruitCost,
  MAX_COLONY_SIZE,
  recruitCat,
  setLeader,
} from '../src/game/systems/colonySystem.ts';

function withGems(n) {
  const state = createInitialGameState(1000);
  state.resources.gems = n;
  return state;
}

test('recruit cost escalates with roster size and stops at the cap', () => {
  let state = withGems(500);
  assert.equal(getRecruitCost(state), 10);

  const costs = [];
  while (getRecruitCost(state) !== null) {
    costs.push(getRecruitCost(state));
    const result = recruitCat(state, () => 0, 2000 + state.cats.length);
    assert.equal(result.ok, true);
    state = result.state;
  }

  assert.deepEqual(costs, [10, 15, 20, 25, 30, 35, 40]);
  assert.equal(state.cats.length, MAX_COLONY_SIZE);

  const full = recruitCat(state, () => 0, 9999);
  assert.equal(full.ok, false);
});

test('recruiting spends gems and adds a rested level-1 cat of a rolled class', () => {
  const state = withGems(10);
  // random()=0 → first class (knight) and first available name.
  const result = recruitCat(state, () => 0, 5000);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.state.resources.gems, 0);
  assert.equal(result.state.cats.length, 2);
  assert.equal(result.cat.catClass, 'knight');
  assert.equal(result.cat.level, 1);
  assert.equal(result.cat.energy, 40);
  assert.equal(result.cat.activity, null);
  assert.notEqual(result.cat.id, result.state.cats[0].id);
  // Leader unchanged: the newcomer joins, doesn't take over.
  assert.equal(getLeader(result.state).name, 'Milo');
});

test('recruiting without enough gems fails and changes nothing', () => {
  const state = withGems(9);
  const result = recruitCat(state, () => 0, 5000);
  assert.equal(result.ok, false);
  assert.equal(state.cats.length, 1);
  assert.equal(state.resources.gems, 9);
});

test('recruit names avoid duplicates within the roster', () => {
  let state = withGems(500);
  for (let i = 0; i < 4; i += 1) {
    const result = recruitCat(state, () => 0, 3000 + i);
    assert.equal(result.ok, true);
    state = result.state;
  }

  const names = state.cats.map((cat) => cat.name);
  assert.equal(new Set(names).size, names.length);
});

test('setLeader switches to a roster cat and rejects strangers', () => {
  const recruited = recruitCat(withGems(10), () => 0, 5000);
  assert.equal(recruited.ok, true);
  if (!recruited.ok) return;

  const switched = setLeader(recruited.state, recruited.cat.id);
  assert.equal(switched.ok, true);
  if (!switched.ok) return;
  assert.equal(getLeader(switched.state).id, recruited.cat.id);

  const stranger = setLeader(switched.state, 'ghost');
  assert.equal(stranger.ok, false);
});

test('a multi-cat roster survives the save migration round-trip', async () => {
  const { migrateGameSave } = await import('../src/game/storage/migrations.ts');
  const recruited = recruitCat(withGems(10), () => 0.9, 5000);
  assert.equal(recruited.ok, true);
  if (!recruited.ok) return;

  const migrated = migrateGameSave(JSON.parse(JSON.stringify(recruited.state)));
  assert.equal(migrated.cats.length, 2);
  assert.equal(migrated.cats[1].name, recruited.cat.name);
  assert.equal(migrated.cats[1].catClass, recruited.cat.catClass);
});
