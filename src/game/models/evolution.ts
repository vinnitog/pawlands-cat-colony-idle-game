import type { Resources } from './resources.ts';

export type EvolutionBranch = 'cyber' | 'science' | 'hybrid';

export type EvolutionNodeId =
  | 'improvisedWorkshop'
  | 'dataDen'
  | 'curiosityLab'
  | 'geneGarden'
  | 'bioCyborg';

export type EvolutionNodeDefinition = {
  id: EvolutionNodeId;
  branch: EvolutionBranch;
  tier: number;
  name: string;
  archetype: string;
  description: string;
  effectText: string;
  durationMs: number;
  cost: Partial<Resources>;
  prerequisites: EvolutionNodeId[];
};

export type ActiveResearch = {
  nodeId: EvolutionNodeId;
  startedAt: number;
  endsAt: number;
};

export type EvolutionState = {
  unlocked: EvolutionNodeId[];
  activeResearch: ActiveResearch | null;
};

export type TimelineState = {
  number: number;
  shards: number;
  totalShards: number;
  lastShiftAt: number | null;
};

export function createEmptyEvolutionState(): EvolutionState {
  return { unlocked: [], activeResearch: null };
}

export function createInitialTimelineState(): TimelineState {
  return { number: 1, shards: 0, totalShards: 0, lastShiftAt: null };
}
