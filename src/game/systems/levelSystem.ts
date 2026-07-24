import type { GameState } from '../models/save.ts';
import { addResourcesToState } from './economySystem.ts';
import { getLeader, updateCat } from './colonySystem.ts';

export type LevelResult = {
  state: GameState;
  levelsGained: number;
  coinsAwarded: number;
};

export function xpForNextLevel(level: number): number {
  return 100 + level * 50;
}

export function addXpToCat(state: GameState, catId: string, xp: number): LevelResult {
  const target = state.cats.find((cat) => cat.id === catId);
  if (xp <= 0 || !target) {
    return { state, levelsGained: 0, coinsAwarded: 0 };
  }

  let cat = {
    ...target,
    xp: target.xp + xp,
    stats: { ...target.stats },
  };
  let levelsGained = 0;

  while (cat.xp >= xpForNextLevel(cat.level)) {
    cat.xp -= xpForNextLevel(cat.level);
    cat.level += 1;
    cat.maxEnergy += 2;
    cat.energy = Math.min(cat.maxEnergy, cat.energy + 8);
    cat.stats = {
      attack: cat.stats.attack + 1,
      defense: cat.stats.defense + 1,
      hunting: cat.stats.hunting + 1,
      fishing: cat.stats.fishing + 1,
      luck: cat.stats.luck + 1,
    };
    levelsGained += 1;
  }

  let nextState = updateCat(state, catId, () => cat);

  const coinsAwarded = levelsGained * 15;
  if (coinsAwarded > 0) {
    nextState = addResourcesToState(nextState, { coins: coinsAwarded });
  }

  return {
    state: nextState,
    levelsGained,
    coinsAwarded,
  };
}

/** XP for the leader — the single-cat era entry point, kept for mission rewards. */
export function addXpToState(state: GameState, xp: number): LevelResult {
  return addXpToCat(state, getLeader(state).id, xp);
}
