import { catClassById, type CatClass } from '../models/catClass.ts';
import type { GameState } from '../models/save.ts';

export const catNameMinLength = 2;
export const catNameMaxLength = 16;

/** A fresh colony (no progress yet) inherits the chosen class's starting stats. */
function isFreshColony(state: GameState): boolean {
  return (
    state.cat.level === 1 &&
    state.cat.xp === 0 &&
    state.totals.activitiesCompleted === 0 &&
    state.totals.upgradesPurchased === 0
  );
}

export function normalizeCatName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, catNameMaxLength);
}

export function isValidCatName(raw: string): boolean {
  return normalizeCatName(raw).length >= catNameMinLength;
}

/**
 * Applies the starter choice from the intro screen. Non-destructive: it only
 * sets the name, class and onboarding flag, and — for a brand-new colony —
 * the class's starting stats. Existing progress (level, xp, resources) is kept.
 */
export function applyStarterChoice(
  state: GameState,
  choice: { name: string; catClass: CatClass },
): GameState {
  const def = catClassById[choice.catClass];
  const name = normalizeCatName(choice.name) || def.name;

  return {
    ...state,
    onboarded: true,
    cat: {
      ...state.cat,
      name,
      catClass: choice.catClass,
      stats: isFreshColony(state) ? { ...def.stats } : state.cat.stats,
    },
  };
}
