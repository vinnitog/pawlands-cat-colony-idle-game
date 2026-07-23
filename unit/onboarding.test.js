import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { catClassById } from '../src/game/models/catClass.ts';
import {
  applyStarterChoice,
  isValidCatName,
  normalizeCatName,
} from '../src/game/systems/onboardingSystem.ts';

test('fresh colony inherits the chosen class starting stats', () => {
  const state = createInitialGameState(1000);
  const next = applyStarterChoice(state, { name: 'Grimwhisker', catClass: 'mage' });

  assert.equal(next.onboarded, true);
  assert.equal(next.cat.name, 'Grimwhisker');
  assert.equal(next.cat.catClass, 'mage');
  assert.deepEqual(next.cat.stats, catClassById.mage.stats);
});

test('a colony with progress keeps its stats, only records name and class', () => {
  const state = createInitialGameState(1000);
  const played = {
    ...state,
    cat: { ...state.cat, level: 4, xp: 20 },
    totals: { ...state.totals, activitiesCompleted: 5 },
  };

  const next = applyStarterChoice(played, { name: 'Ironpaw', catClass: 'archer' });

  assert.equal(next.cat.catClass, 'archer');
  assert.deepEqual(next.cat.stats, played.cat.stats);
});

test('blank name falls back to the class archetype name', () => {
  const state = createInitialGameState(1000);
  const next = applyStarterChoice(state, { name: '   ', catClass: 'knight' });

  assert.equal(next.cat.name, catClassById.knight.name);
});

test('name validation and normalization', () => {
  assert.equal(isValidCatName('a'), false);
  assert.equal(isValidCatName('  Mo  '), true);
  assert.equal(normalizeCatName('  Sir   Mittens  '), 'Sir Mittens');
  assert.equal(normalizeCatName('x'.repeat(40)).length, 16);
});
