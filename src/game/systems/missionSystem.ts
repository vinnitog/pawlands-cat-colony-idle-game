import { missionById, missions } from '../data/missions.ts';
import type { GameState } from '../models/save.ts';
import type { MissionCondition, MissionId } from '../models/missions.ts';
import { addResourcesToState } from './economySystem.ts';
import { addXpToState } from './levelSystem.ts';

export type MissionClaimResult =
  | { ok: true; state: GameState; coins: number; xp: number }
  | { ok: false; state: GameState; reason: string };

function getMissionProgress(state: GameState, condition: MissionCondition): number {
  switch (condition.kind) {
    case 'activitiesCompleted':
      return state.totals.activitiesCompleted;
    case 'resourceEarned':
      return state.totals.resourcesEarned[condition.resource];
    case 'resourceCurrent':
      return state.resources[condition.resource];
    case 'upgradeLevel':
      return state.upgrades[condition.upgradeId].level;
    case 'catLevel':
      return state.cat.level;
  }
}

export function refreshMissionProgress(state: GameState): GameState {
  const missionsState = { ...state.missions };

  for (const definition of missions) {
    const current = missionsState[definition.id];
    const rawProgress = getMissionProgress(state, definition.condition);
    const progress = Math.min(rawProgress, definition.condition.target);

    missionsState[definition.id] = {
      ...current,
      progress,
      completed: current.completed || progress >= definition.condition.target,
    };
  }

  return {
    ...state,
    missions: missionsState,
  };
}

export function claimMission(state: GameState, missionId: MissionId): MissionClaimResult {
  const mission = state.missions[missionId];
  const definition = missionById[missionId];

  if (!mission.completed) {
    return { ok: false, state, reason: 'Missão ainda não concluída.' };
  }

  if (mission.claimed) {
    return { ok: false, state, reason: 'Recompensa já coletada.' };
  }

  let nextState = {
    ...state,
    missions: {
      ...state.missions,
      [missionId]: {
        ...mission,
        claimed: true,
      },
    },
  };

  nextState = addResourcesToState(nextState, { coins: definition.reward.coins });
  nextState = addXpToState(nextState, definition.reward.xp).state;

  return {
    ok: true,
    state: refreshMissionProgress(nextState),
    coins: definition.reward.coins,
    xp: definition.reward.xp,
  };
}

export function getPendingMissionCount(state: GameState): number {
  return Object.values(state.missions).filter((mission) => mission.completed && !mission.claimed).length;
}
