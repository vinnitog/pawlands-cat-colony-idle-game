import { recruitNames } from '../data/catNames.ts';
import type { Cat } from '../models/cat.ts';
import { catClasses } from '../models/catClass.ts';
import type { GameState } from '../models/save.ts';
import { subtractResourcesFromState } from './economySystem.ts';
import { refreshMissionProgress } from './missionSystem.ts';

/** Roster cap: keeps the UI sane and the gem cost curve meaningful. */
export const MAX_COLONY_SIZE = 8;

/**
 * Gem cost of the next recruit, indexed by current roster size - 1.
 * Increments escalate (5, 10, 15, ...) because each recruit multiplies the
 * colony's permanent parallel income — a flat step would trivialize late hires.
 */
const RECRUIT_COSTS = [10, 15, 25, 40, 60, 85, 115] as const;

/**
 * The cat who fronts the game — walks the world and is the target of the
 * single-cat systems today. Falls back to the first cat if `leaderId` is stale,
 * so the roster is never treated as empty.
 */
export function getLeader(state: GameState): Cat {
  return state.cats.find((cat) => cat.id === state.leaderId) ?? state.cats[0];
}

/** Return a new state with the cat `catId` passed through `updater`. */
export function updateCat(state: GameState, catId: string, updater: (cat: Cat) => Cat): GameState {
  return {
    ...state,
    cats: state.cats.map((cat) => (cat.id === catId ? updater(cat) : cat)),
  };
}

/** Return a new state with the leader cat passed through `updater`. */
export function updateLeader(state: GameState, updater: (cat: Cat) => Cat): GameState {
  return updateCat(state, getLeader(state).id, updater);
}

/** Gem cost to recruit the next cat. Null when the roster is full. */
export function getRecruitCost(state: GameState): number | null {
  if (state.cats.length >= MAX_COLONY_SIZE) return null;
  return RECRUIT_COSTS[state.cats.length - 1] ?? null;
}

export type RecruitResult =
  | { ok: true; state: GameState; cat: Cat }
  | { ok: false; state: GameState; reason: string };

/** Recruit a random-class cat for gems. The newcomer arrives rested, level 1. */
export function recruitCat(state: GameState, random = Math.random, now = Date.now()): RecruitResult {
  const cost = getRecruitCost(state);
  if (cost === null) {
    return { ok: false, state, reason: 'A colônia está cheia.' };
  }

  if (state.resources.gems < cost) {
    return { ok: false, state, reason: `Gemas insuficientes: recrutar custa ${cost}.` };
  }

  const classDef = catClasses[Math.floor(random() * catClasses.length)];
  const taken = new Set(state.cats.map((cat) => cat.name));
  const available = recruitNames.filter((name) => !taken.has(name));
  const name =
    available.length > 0
      ? available[Math.floor(random() * available.length)]
      : `${recruitNames[Math.floor(random() * recruitNames.length)]} ${state.cats.length + 1}`;

  const cat: Cat = {
    id: `cat-${now}-${state.cats.length}`,
    name,
    catClass: classDef.id,
    level: 1,
    xp: 0,
    energy: 40,
    maxEnergy: 40,
    stats: { ...classDef.stats },
    activity: null,
    expedition: null,
    expeditionPulseCarry: {},
    expeditionTimeCarryMs: {},
  };

  const nextState = {
    ...subtractResourcesFromState(state, { gems: cost }),
  };

  return {
    ok: true,
    state: refreshMissionProgress({ ...nextState, cats: [...nextState.cats, cat] }),
    cat,
  };
}

export type SetLeaderResult =
  | { ok: true; state: GameState }
  | { ok: false; state: GameState; reason: string };

export function setLeader(state: GameState, catId: string): SetLeaderResult {
  const cat = state.cats.find((candidate) => candidate.id === catId);
  if (!cat) {
    return { ok: false, state, reason: 'Esse gato não faz parte da colônia.' };
  }

  if (cat.expedition) {
    return { ok: false, state, reason: `${cat.name} está no Além e não pode liderar agora.` };
  }

  if (state.leaderId === catId) {
    return { ok: true, state };
  }

  return { ok: true, state: { ...state, leaderId: catId } };
}
