import type { GameState } from '../models/save.ts';
import { addResourcesToState } from './economySystem.ts';

export type LevelResult = {
  state: GameState;
  levelsGained: number;
  coinsAwarded: number;
};

export function xpForNextLevel(level: number): number {
  return 100 + level * 50;
}

export function addXpToState(state: GameState, xp: number): LevelResult {
  if (xp <= 0) {
    return { state, levelsGained: 0, coinsAwarded: 0 };
  }

  let cat = {
    ...state.cat,
    xp: state.cat.xp + xp,
    stats: { ...state.cat.stats },
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

  let nextState = {
    ...state,
    cat,
  };

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
