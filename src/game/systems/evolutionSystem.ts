import {
  evolutionNodeById,
  evolutionNodeIds,
  isEvolutionNodeId,
} from '../data/evolution.ts';
import type { EvolutionNodeId } from '../models/evolution.ts';
import type { GameState } from '../models/save.ts';
import { getCurrentChronicleProgress } from './progressionSystem.ts';
import {
  hasResources,
  subtractResourcesFromState,
} from './economySystem.ts';
import { createInitialGameState } from '../data/initialGameState.ts';
import { catClassById } from '../models/catClass.ts';

export type EvolutionBonuses = {
  activityDurationMultiplier: number;
  activityXpMultiplier: number;
  rareChanceBonus: number;
  researchDurationMultiplier: number;
};

export type StartResearchResult =
  | { ok: true; state: GameState }
  | { ok: false; state: GameState; reason: string };

export type AdvanceResearchResult = {
  state: GameState;
  completedNodeId: EvolutionNodeId | null;
};

export function hasEvolution(state: GameState, nodeId: EvolutionNodeId): boolean {
  return state.evolution.unlocked.includes(nodeId);
}

export function getEvolutionBonuses(state: GameState): EvolutionBonuses {
  const unlocked = new Set(state.evolution.unlocked);
  const shardSpeedBonus = Math.min(0.1, state.timeline.shards * 0.01);
  const shardXpBonus = Math.min(0.2, state.timeline.shards * 0.02);
  const researchSpeedBonus = Math.min(0.5, state.timeline.shards * 0.05);

  const activitySpeedBonus =
    (unlocked.has('improvisedWorkshop') ? 0.1 : 0)
    + (unlocked.has('dataDen') ? 0.1 : 0)
    + (unlocked.has('bioCyborg') ? 0.05 : 0)
    + shardSpeedBonus;

  return {
    activityDurationMultiplier: Math.max(0.65, 1 - activitySpeedBonus),
    activityXpMultiplier:
      1
      + (unlocked.has('curiosityLab') ? 0.15 : 0)
      + (unlocked.has('bioCyborg') ? 0.1 : 0)
      + shardXpBonus,
    rareChanceBonus: unlocked.has('geneGarden') ? 0.05 : 0,
    researchDurationMultiplier: Math.max(0.5, 1 - researchSpeedBonus),
  };
}

export function getResearchBlockReason(
  state: GameState,
  nodeId: EvolutionNodeId,
): string | null {
  if (!isEvolutionNodeId(nodeId)) return 'Pesquisa desconhecida.';
  const node = evolutionNodeById[nodeId];
  if (hasEvolution(state, nodeId)) return 'Pesquisa já dominada.';
  if (state.evolution.activeResearch) return 'Outra pesquisa já está em andamento.';
  if (!node.prerequisites.every((id) => hasEvolution(state, id))) {
    return 'Complete as pesquisas conectadas antes desta.';
  }
  if (!hasResources(state.resources, node.cost)) return 'Recursos insuficientes.';
  return null;
}

export function startResearch(
  state: GameState,
  nodeId: EvolutionNodeId,
  now = Date.now(),
): StartResearchResult {
  const reason = getResearchBlockReason(state, nodeId);
  if (reason) return { ok: false, state, reason };

  const node = evolutionNodeById[nodeId];
  const duration = Math.max(
    1,
    Math.floor(node.durationMs * getEvolutionBonuses(state).researchDurationMultiplier),
  );
  const paid = subtractResourcesFromState(state, node.cost);

  return {
    ok: true,
    state: {
      ...paid,
      evolution: {
        ...paid.evolution,
        activeResearch: {
          nodeId,
          startedAt: now,
          endsAt: now + duration,
        },
      },
    },
  };
}

export function advanceResearch(
  state: GameState,
  now = Date.now(),
): AdvanceResearchResult {
  const active = state.evolution.activeResearch;
  if (!active || active.endsAt > now) {
    return { state, completedNodeId: null };
  }

  return {
    state: {
      ...state,
      evolution: {
        unlocked: state.evolution.unlocked.includes(active.nodeId)
          ? state.evolution.unlocked
          : [...state.evolution.unlocked, active.nodeId],
        activeResearch: null,
      },
    },
    completedNodeId: active.nodeId,
  };
}

export function getTimelineReadiness(state: GameState) {
  const chronicleComplete = getCurrentChronicleProgress(state).complete;
  const evolutionComplete = evolutionNodeIds.every((nodeId) => hasEvolution(state, nodeId));
  return {
    chronicleComplete,
    evolutionComplete,
    ready: chronicleComplete && evolutionComplete,
  };
}

export function getTimelineShardReward(state: GameState): number {
  const earnedLevels = state.cats.reduce((sum, cat) => sum + Math.max(0, cat.level - 1), 0);
  const expeditions = Object.values(state.expeditionCollections).reduce((sum, count) => sum + count, 0);
  return Math.min(5, 1 + Math.floor(earnedLevels / 10) + Math.floor(expeditions / 50));
}

export function enterNewTimeline(
  state: GameState,
  now = Date.now(),
): StartResearchResult & { shardsAwarded?: number } {
  if (!getTimelineReadiness(state).ready) {
    return { ok: false, state, reason: 'A crônica e o Protocolo Bio-Ciborgue ainda não foram concluídos.' };
  }

  const shardsAwarded = getTimelineShardReward(state);
  const leader = state.cats.find((cat) => cat.id === state.leaderId) ?? state.cats[0];
  const reset = createInitialGameState(now);
  const resetLeader = reset.cats[0];
  const starterStats = catClassById[leader.catClass].stats;

  return {
    ok: true,
    shardsAwarded,
    state: {
      ...reset,
      onboarded: true,
      cats: [{
        ...resetLeader,
        name: leader.name,
        catClass: leader.catClass,
        stats: { ...starterStats },
      }],
      timeline: {
        number: state.timeline.number + 1,
        shards: state.timeline.shards + shardsAwarded,
        totalShards: state.timeline.totalShards + shardsAwarded,
        lastShiftAt: now,
      },
    },
  };
}
