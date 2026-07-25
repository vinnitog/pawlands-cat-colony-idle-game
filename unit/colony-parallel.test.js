import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import {
  completeFinishedActivities,
  startActivity,
} from '../src/game/systems/activitySystem.ts';
import { getLeader, recruitCat, setLeader } from '../src/game/systems/colonySystem.ts';
import { createEmptyRewardBundle } from '../src/game/models/resources.ts';
import { startExpedition } from '../src/game/systems/expeditionSystem.ts';
import { processOfflineProgress } from '../src/game/systems/offlineSystem.ts';

const MIN = 60_000;

/** Colony with Milo (leader) + one recruited knight, at t=0-ish. */
function twoCatColony() {
  const state = createInitialGameState(1000);
  state.resources.gems = 10;
  const recruited = recruitCat(state, () => 0, 2000);
  assert.equal(recruited.ok, true);
  return { state: recruited.state, recruitId: recruited.cat.id };
}

function threeCatColony() {
  const state = createInitialGameState(1000);
  state.resources.gems = 100;

  const first = recruitCat(state, () => 0, 2000);
  assert.equal(first.ok, true);
  if (!first.ok) throw new Error(first.reason);

  const second = recruitCat(first.state, () => 0, 3000);
  assert.equal(second.ok, true);
  if (!second.ok) throw new Error(second.reason);

  return {
    state: second.state,
    firstRecruitId: first.cat.id,
    secondRecruitId: second.cat.id,
  };
}

function sumCompletionRewards(completions) {
  const total = createEmptyRewardBundle();

  for (const { reward } of completions) {
    total.xp += reward.xp;
    total.energy += reward.energy;

    for (const [key, amount] of Object.entries(reward.resources)) {
      total.resources[key] = (total.resources[key] ?? 0) + amount;
    }

    for (const [key, amount] of Object.entries(reward.inventory)) {
      total.inventory[key] = (total.inventory[key] ?? 0) + amount;
    }
  }

  return total;
}

test('two cats can run activities in parallel', () => {
  const { state, recruitId } = twoCatColony();

  const leaderStart = startActivity(state, 'huntMice', 1000);
  assert.equal(leaderStart.ok, true);
  if (!leaderStart.ok) return;

  const recruitStart = startActivity(leaderStart.state, 'searchYarn', 1000, { catId: recruitId });
  assert.equal(recruitStart.ok, true);
  if (!recruitStart.ok) return;

  const busy = recruitStart.state.cats.filter((cat) => cat.activity !== null);
  assert.equal(busy.length, 2);

  // A busy leader no longer blocks a free recruit (and vice versa).
  const third = startActivity(recruitStart.state, 'fishPond', 1000, { catId: recruitId });
  assert.equal(third.ok, false);
});

test('a free leader can start an activity while another cat is on expedition', () => {
  const { state, recruitId } = twoCatColony();
  const leaderBefore = getLeader(state);
  const sent = startExpedition(state, recruitId, 'whisperingFields', 3_000);

  assert.equal(sent.ok, true);
  if (!sent.ok) return;
  assert.equal(getLeader(sent.state).id, leaderBefore.id);
  assert.equal(getLeader(sent.state).expedition, null);

  const started = startActivity(sent.state, 'huntMice', 4_000);

  assert.equal(started.ok, true);
  if (!started.ok) return;
  assert.equal(getLeader(started.state).activity?.activityId, 'huntMice');
  assert.equal(
    started.state.cats.find((cat) => cat.id === recruitId)?.expedition?.zoneId,
    'whisperingFields',
  );
});

test('switching leadership away from an expedition cat keeps activities available', () => {
  const { state, recruitId } = twoCatColony();
  const expeditionCatId = getLeader(state).id;
  const sent = startExpedition(state, expeditionCatId, 'whisperingFields', 5_000);

  assert.equal(sent.ok, true);
  if (!sent.ok) return;
  const switched = setLeader(sent.state, recruitId);
  assert.equal(switched.ok, true);
  if (!switched.ok) return;
  assert.equal(getLeader(switched.state).id, recruitId);
  assert.equal(getLeader(switched.state).expedition, null);

  const started = startActivity(switched.state, 'searchYarn', 6_000);

  assert.equal(started.ok, true);
  if (!started.ok) return;
  assert.equal(getLeader(started.state).activity?.activityId, 'searchYarn');
  assert.equal(
    started.state.cats.find((cat) => cat.id === expeditionCatId)?.expedition?.zoneId,
    'whisperingFields',
  );
});

test('completing the colony harvests every finished activity at once', () => {
  const { state, recruitId } = twoCatColony();

  let current = startActivity(state, 'huntMice', 1000).state; // 5 min
  current = startActivity(current, 'searchYarn', 1000, { catId: recruitId }).state; // 3 min

  const harvest = completeFinishedActivities(current, 1000 + 6 * MIN, () => 0);

  assert.equal(harvest.completedCount, 2);
  assert.equal(harvest.state.totals.activitiesCompleted, 2);
  // Rewards merged into one bundle: mice from the hunt + yarn from the search.
  assert.ok((harvest.reward.resources.mice ?? 0) > 0);
  assert.ok((harvest.reward.resources.yarn ?? 0) > 0);
  assert.equal(harvest.state.cats.every((cat) => cat.activity === null), true);
  assert.deepEqual(
    harvest.completions.map(({ catId, catName, activityId, activityName }) => ({
      catId,
      catName,
      activityId,
      activityName,
    })),
    [
      {
        catId: 'milo',
        catName: 'Milo',
        activityId: 'huntMice',
        activityName: 'Caçar Ratinhos',
      },
      {
        catId: recruitId,
        catName: harvest.state.cats.find((cat) => cat.id === recruitId)?.name,
        activityId: 'searchYarn',
        activityName: 'Procurar Novelos',
      },
    ],
  );
});

test('each cat earns its own XP and rolls with its own stats', () => {
  const { state, recruitId } = twoCatColony();

  // Day 1 (UTC): fishPond is the daily bonus, so huntMice pays plain XP here.
  const DAY1 = 24 * 60 * MIN + 1000;
  // Milo (hunting 3) and the knight recruit (hunting 2) both hunt mice.
  let current = startActivity(state, 'huntMice', DAY1).state;
  current = startActivity(current, 'huntMice', DAY1, { catId: recruitId }).state;

  const harvest = completeFinishedActivities(current, DAY1 + 6 * MIN, () => 0);
  assert.equal(harvest.completedCount, 2);

  const leader = getLeader(harvest.state);
  const recruit = harvest.state.cats.find((cat) => cat.id === recruitId);
  // XP landed on both cats individually (base roll 14 each).
  assert.equal(leader.xp, 14);
  assert.equal(recruit.xp, 14);
  // Milo's hunting 3 grants +1 mouse (floor(3/3)); the recruit's 2 grants none.
  // Pool total: (2+1) + (2+0) = 5 mice.
  assert.equal(harvest.state.resources.mice, 5);
});

test('offline progress completes multiple cats and reports the merged reward', () => {
  const { state, recruitId } = twoCatColony();

  let current = startActivity(state, 'huntMice', 1000).state;
  current = startActivity(current, 'searchYarn', 1000, { catId: recruitId }).state;

  const offline = processOfflineProgress(current, 1000 + 30 * MIN, () => 0);

  assert.equal(offline.activityCompleted, true);
  assert.equal(offline.completedCount, 2);
  assert.ok((offline.reward.resources.mice ?? 0) > 0);
  assert.ok((offline.reward.resources.yarn ?? 0) > 0);
  assert.equal(offline.state.totals.activitiesCompleted, 2);
  assert.equal(offline.completions.length, 2);
  assert.equal(offline.completions[0].catName, 'Milo');
  assert.equal(offline.completions[1].activityName, 'Procurar Novelos');
});

test('unfinished activities stay put while finished ones are harvested', () => {
  const { state, recruitId } = twoCatColony();

  let current = startActivity(state, 'searchYarn', 1000).state; // 3 min
  current = startActivity(current, 'exploreYard', 1000, { catId: recruitId }).state; // 20 min

  const harvest = completeFinishedActivities(current, 1000 + 5 * MIN, () => 0);

  assert.equal(harvest.completedCount, 1);
  assert.equal(getLeader(harvest.state).activity, null);
  const recruit = harvest.state.cats.find((cat) => cat.id === recruitId);
  assert.equal(recruit.activity?.activityId, 'exploreYard');
});

test('aggregate reward exactly matches finished cats and excludes unfinished work', () => {
  const { state, firstRecruitId, secondRecruitId } = threeCatColony();
  const startedAt = 24 * 60 * MIN + 1000;

  let current = startActivity(state, 'huntMice', startedAt).state;
  current = startActivity(current, 'searchYarn', startedAt, {
    catId: firstRecruitId,
  }).state;
  current = startActivity(current, 'exploreYard', startedAt, {
    catId: secondRecruitId,
  }).state;

  const harvest = completeFinishedActivities(current, startedAt + 6 * MIN, () => 0);

  assert.equal(harvest.completedCount, 2);
  assert.deepEqual(
    harvest.completions.map((completion) => completion.catId),
    ['milo', firstRecruitId],
  );
  assert.deepEqual(harvest.reward, sumCompletionRewards(harvest.completions));
  assert.deepEqual(harvest.reward.inventory, {});
  assert.equal(harvest.reward.resources.gems ?? 0, 0);
  assert.equal(
    harvest.state.cats.find((cat) => cat.id === secondRecruitId)?.activity?.activityId,
    'exploreYard',
  );
});
