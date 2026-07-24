import type { Cat } from '../models/cat.ts';
import type { GameState } from '../models/save.ts';

/**
 * The cat who fronts the game — walks the world and is the target of the
 * single-cat systems today. Falls back to the first cat if `leaderId` is stale,
 * so the roster is never treated as empty.
 */
export function getLeader(state: GameState): Cat {
  return state.cats.find((cat) => cat.id === state.leaderId) ?? state.cats[0];
}

/** Return a new state with the leader cat passed through `updater`. */
export function updateLeader(state: GameState, updater: (cat: Cat) => Cat): GameState {
  const leaderId = getLeader(state).id;
  return {
    ...state,
    cats: state.cats.map((cat) => (cat.id === leaderId ? updater(cat) : cat)),
  };
}
