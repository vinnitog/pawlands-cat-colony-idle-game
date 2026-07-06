import type { GameState } from '../models/save.ts';
import type { RewardBundle } from '../models/resources.ts';
import { completeCurrentActivity } from './activitySystem.ts';

export type OfflineProgressResult = {
  state: GameState;
  reward: RewardBundle | null;
  offlineDurationMs: number;
  activityCompleted: boolean;
  levelsGained: number;
  levelCoins: number;
};

export function processOfflineProgress(
  state: GameState,
  now = Date.now(),
  random = Math.random,
): OfflineProgressResult {
  const offlineDurationMs = Math.max(0, now - state.lastSavedAt);

  if (!state.activeActivity || state.activeActivity.endsAt > now) {
    return {
      state: {
        ...state,
        lastSavedAt: now,
      },
      reward: null,
      offlineDurationMs,
      activityCompleted: false,
      levelsGained: 0,
      levelCoins: 0,
    };
  }

  const completion = completeCurrentActivity(state, now, random);

  return {
    state: {
      ...completion.state,
      lastSavedAt: now,
    },
    reward: completion.reward,
    offlineDurationMs,
    activityCompleted: completion.completed,
    levelsGained: completion.levelsGained,
    levelCoins: completion.levelCoins,
  };
}
