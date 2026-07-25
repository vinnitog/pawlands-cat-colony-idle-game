import type { GameState } from '../models/save.ts';
import type { RewardBundle } from '../models/resources.ts';
import { completeFinishedActivities } from './activitySystem.ts';
import { applyEnergyRegen } from './energySystem.ts';
import { advanceExpeditions } from './expeditionSystem.ts';

export type OfflineProgressResult = {
  state: GameState;
  reward: RewardBundle | null;
  offlineDurationMs: number;
  activityCompleted: boolean;
  completedCount: number;
  levelsGained: number;
  levelCoins: number;
};

export function processOfflineProgress(
  state: GameState,
  now = Date.now(),
  random = Math.random,
): OfflineProgressResult {
  const offlineDurationMs = Math.max(0, now - state.lastSavedAt);

  const completion = completeFinishedActivities(state, now, random);
  const progressed = advanceExpeditions(completion.state, now);

  return {
    state: {
      ...applyEnergyRegen(progressed, now),
      lastSavedAt: now,
    },
    reward: completion.completedCount > 0 ? completion.reward : null,
    offlineDurationMs,
    activityCompleted: completion.completedCount > 0,
    completedCount: completion.completedCount,
    levelsGained: completion.levelsGained,
    levelCoins: completion.levelCoins,
  };
}
