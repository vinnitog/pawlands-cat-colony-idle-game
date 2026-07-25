import type { GameState } from '../models/save.ts';

/** Idle cats recover 1 energy this often. Sleep stays ~4x faster. */
export const ENERGY_REGEN_MS_PER_POINT = 2 * 60 * 1000;

/**
 * Passive energy regen for cats that are not busy.
 *
 * The baseline advances only in whole-point steps so fractional progress is
 * never lost between ticks. Busy cats simply miss those ticks — the baseline
 * moves on, so no energy is "banked" while working.
 */
export function applyEnergyRegen(state: GameState, now = Date.now()): GameState {
  const elapsed = now - state.lastEnergyRegenAt;

  // Clock rollback: re-anchor so a future baseline can't freeze regen forever.
  if (elapsed < 0) {
    return { ...state, lastEnergyRegenAt: now };
  }

  const gained = Math.floor(elapsed / ENERGY_REGEN_MS_PER_POINT);
  if (gained < 1) return state;

  return {
    ...state,
    cats: state.cats.map((cat) =>
      cat.activity || cat.expedition || cat.energy >= cat.maxEnergy
        ? cat
        : { ...cat, energy: Math.min(cat.maxEnergy, cat.energy + gained) },
    ),
    lastEnergyRegenAt: state.lastEnergyRegenAt + gained * ENERGY_REGEN_MS_PER_POINT,
  };
}
