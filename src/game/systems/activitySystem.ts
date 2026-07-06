import { activityById } from '../data/activities.ts';
import type { ActivityId, RewardRange } from '../models/activity.ts';
import type { GameState } from '../models/save.ts';
import type { RewardBundle } from '../models/resources.ts';
import { createEmptyRewardBundle, resourceKeys } from '../models/resources.ts';
import { addInventoryToState, addResourcesToState } from './economySystem.ts';
import { addXpToState } from './levelSystem.ts';
import { refreshMissionProgress } from './missionSystem.ts';
import { getUpgradeBonuses } from './upgradeSystem.ts';

export type ActivityStartResult =
  | { ok: true; state: GameState }
  | { ok: false; state: GameState; reason: string };

export type ActivityCompletionResult = {
  completed: boolean;
  state: GameState;
  reward: RewardBundle;
  levelsGained: number;
  levelCoins: number;
};

function rollRange(range: RewardRange, random: () => number): number {
  const [min, max] = range;
  return min + Math.floor(random() * (max - min + 1));
}

function createActivityReward(state: GameState, activityId: ActivityId, random: () => number): RewardBundle {
  const activity = activityById[activityId];
  const bonuses = getUpgradeBonuses(state);
  const reward = createEmptyRewardBundle();

  for (const key of resourceKeys) {
    const range = activity.rewards.resources?.[key];
    if (!range) continue;

    let amount = rollRange(range, random);

    if (activity.relatedStat && key !== 'coins') {
      amount += Math.floor(state.cat.stats[activity.relatedStat] / 3);
    }

    if (key === 'fish') {
      amount = Math.floor(amount * bonuses.fishMultiplier);
    }

    if (amount > 0) reward.resources[key] = amount;
  }

  if (activity.rewards.xp) {
    reward.xp = Math.floor(rollRange(activity.rewards.xp, random) * bonuses.xpMultiplier);
  }

  if (activity.rewards.energy) {
    reward.energy = rollRange(activity.rewards.energy, random) + bonuses.sleepEnergyBonus;
  }

  for (const rareReward of activity.rewards.rareItems ?? []) {
    const luckBonus = state.cat.stats.luck * 0.005;
    if (random() <= rareReward.chance + bonuses.rareChanceBonus + luckBonus) {
      reward.inventory[rareReward.item] = (reward.inventory[rareReward.item] ?? 0) + 1;
    }
  }

  return reward;
}

export function startActivity(state: GameState, activityId: ActivityId, now = Date.now()): ActivityStartResult {
  const activity = activityById[activityId];

  if (state.activeActivity) {
    return { ok: false, state, reason: 'Milo já está ocupado com outra atividade.' };
  }

  if (state.cat.energy < activity.energyCost) {
    return { ok: false, state, reason: 'Energia insuficiente. Coloque Milo para dormir.' };
  }

  return {
    ok: true,
    state: {
      ...state,
      cat: {
        ...state.cat,
        energy: state.cat.energy - activity.energyCost,
      },
      activeActivity: {
        activityId,
        startedAt: now,
        endsAt: now + activity.durationMs,
      },
    },
  };
}

export function completeCurrentActivity(
  state: GameState,
  now = Date.now(),
  random = Math.random,
): ActivityCompletionResult {
  if (!state.activeActivity || state.activeActivity.endsAt > now) {
    return {
      completed: false,
      state,
      reward: createEmptyRewardBundle(),
      levelsGained: 0,
      levelCoins: 0,
    };
  }

  const reward = createActivityReward(state, state.activeActivity.activityId, random);
  let nextState = addResourcesToState(state, reward.resources);
  nextState = addInventoryToState(nextState, reward.inventory);

  if (reward.energy > 0) {
    nextState = {
      ...nextState,
      cat: {
        ...nextState.cat,
        energy: Math.min(nextState.cat.maxEnergy, nextState.cat.energy + reward.energy),
      },
    };
  }

  const levelResult = addXpToState(nextState, reward.xp);
  nextState = {
    ...levelResult.state,
    activeActivity: null,
    totals: {
      ...levelResult.state.totals,
      activitiesCompleted: levelResult.state.totals.activitiesCompleted + 1,
    },
  };

  return {
    completed: true,
    state: refreshMissionProgress(nextState),
    reward,
    levelsGained: levelResult.levelsGained,
    levelCoins: levelResult.coinsAwarded,
  };
}

export function getRemainingActivityMs(state: GameState, now = Date.now()): number {
  if (!state.activeActivity) return 0;
  return Math.max(0, state.activeActivity.endsAt - now);
}
