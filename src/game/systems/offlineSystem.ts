import type { GameState } from '../models/save.ts';
import type { RewardBundle } from '../models/resources.ts';
import type { EvolutionNodeId } from '../models/evolution.ts';
import {
  completeFinishedActivities,
  type ActivityCompletionDetail,
} from './activitySystem.ts';
import { applyEnergyRegen } from './energySystem.ts';
import { advanceExpeditions } from './expeditionSystem.ts';
import { advanceResearch } from './evolutionSystem.ts';

export type OfflineProgressResult = {
  state: GameState;
  reward: RewardBundle | null;
  offlineDurationMs: number;
  activityCompleted: boolean;
  completedCount: number;
  levelsGained: number;
  levelCoins: number;
  completions: ActivityCompletionDetail[];
  completedResearchNodeId: EvolutionNodeId | null;
};

export function processOfflineProgress(
  state: GameState,
  now = Date.now(),
  random = Math.random,
): OfflineProgressResult {
  const offlineDurationMs = Math.max(0, now - state.lastSavedAt);

  const completion = completeFinishedActivities(state, now, random);
  const research = advanceResearch(completion.state, now);
  const progressed = advanceExpeditions(research.state, now);

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
    completions: completion.completions,
    completedResearchNodeId: research.completedNodeId,
  };
}
