import { catClassById, type CatClass } from '../models/catClass.ts';
import type { GameState } from '../models/save.ts';
import { getLeader, updateLeader } from './colonySystem.ts';

export const catNameMinLength = 2;
export const catNameMaxLength = 16;

/** A fresh colony (no progress yet) inherits the chosen class's starting stats. */
function isFreshColony(state: GameState): boolean {
  const leader = getLeader(state);
  return (
    leader.level === 1 &&
    leader.xp === 0 &&
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
  const fresh = isFreshColony(state);

  return {
    ...updateLeader(state, (cat) => ({
      ...cat,
      name,
      catClass: choice.catClass,
      stats: fresh ? { ...def.stats } : cat.stats,
    })),
    onboarded: true,
  };
}
