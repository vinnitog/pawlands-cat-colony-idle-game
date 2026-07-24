import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { startActivity, completeCurrentActivity } from '../src/game/systems/activitySystem.ts';
import {
  getDailyBonusActivityId,
  isDailyBonusActivity,
} from '../src/game/systems/dailyBonusSystem.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

// Timestamps inside each UTC day so start and completion land on the same day.
const DAY0 = 60_000; // huntMice
const DAY1 = DAY_MS + 60_000; // fishPond

test('daily bonus rotates deterministically across UTC days', () => {
  assert.equal(getDailyBonusActivityId(DAY0), 'huntMice');
  assert.equal(getDailyBonusActivityId(DAY1), 'fishPond');
  assert.equal(getDailyBonusActivityId(2 * DAY_MS), 'searchYarn');
  assert.equal(getDailyBonusActivityId(3 * DAY_MS), 'exploreYard');
  // wraps back around
  assert.equal(getDailyBonusActivityId(4 * DAY_MS), 'huntMice');
});

test('daily bonus never resolves to a non-XP activity', () => {
  for (let day = 0; day < 8; day += 1) {
    assert.notEqual(getDailyBonusActivityId(day * DAY_MS), 'sleep');
  }
});

test('featured activity grants double XP and an extra gem chance', () => {
  assert.equal(isDailyBonusActivity('huntMice', DAY0), true);

  const state = createInitialGameState(DAY0);
  const started = startActivity(state, 'huntMice', DAY0);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  // random()=0 makes every chance-based roll fire.
  const done = completeCurrentActivity(started.state, DAY0 + 5 * 60_000 + 1, () => 0);
  assert.equal(done.completed, true);
  // huntMice XP range [14,20] -> min 14, doubled by the daily bonus.
  assert.equal(done.reward.xp, 28);
  // huntMice has no native gem drop; the daily bonus supplies one.
  assert.equal(done.reward.resources.gems, 1);
});

test('bonus is decided by the start day, honored even if it finishes next day', () => {
  const startNearMidnight = DAY_MS - 60_000; // still huntMice's day
  const state = createInitialGameState(startNearMidnight);
  const started = startActivity(state, 'huntMice', startNearMidnight);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  // Completes after the UTC day rolled over into fishPond's day.
  const finishAt = startNearMidnight + 5 * 60_000 + 1;
  assert.ok(finishAt > DAY_MS, 'sanity: completion lands on the next day');

  const done = completeCurrentActivity(started.state, finishAt, () => 0);
  assert.equal(done.completed, true);
  assert.equal(done.reward.xp, 28);
  assert.equal(done.reward.resources.gems, 1);
});

test('same activity on a non-featured day keeps base XP and no bonus gem', () => {
  assert.equal(isDailyBonusActivity('huntMice', DAY1), false);

  const state = createInitialGameState(DAY1);
  const started = startActivity(state, 'huntMice', DAY1);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const done = completeCurrentActivity(started.state, DAY1 + 5 * 60_000 + 1, () => 0);
  assert.equal(done.completed, true);
  assert.equal(done.reward.xp, 14);
  assert.equal(done.reward.resources.gems ?? 0, 0);
});
