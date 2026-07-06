import type { GameState } from '../models/save.ts';
import type { Inventory, Resources, RewardBundle } from '../models/resources.ts';
import { createEmptyRewardBundle, resourceKeys, specialItemKeys } from '../models/resources.ts';

export function hasResources(current: Resources, cost: Partial<Resources>): boolean {
  return resourceKeys.every((key) => (current[key] ?? 0) >= (cost[key] ?? 0));
}

export function addResourcesToState(state: GameState, gains: Partial<Resources>): GameState {
  const resources = { ...state.resources };
  const resourcesEarned = { ...state.totals.resourcesEarned };

  for (const key of resourceKeys) {
    const amount = gains[key] ?? 0;
    if (amount <= 0) continue;
    resources[key] += amount;
    resourcesEarned[key] += amount;
  }

  return {
    ...state,
    resources,
    totals: {
      ...state.totals,
      resourcesEarned,
    },
  };
}

export function subtractResourcesFromState(state: GameState, cost: Partial<Resources>): GameState {
  const resources = { ...state.resources };

  for (const key of resourceKeys) {
    const amount = cost[key] ?? 0;
    if (amount <= 0) continue;
    resources[key] = Math.max(0, resources[key] - amount);
  }

  return {
    ...state,
    resources,
  };
}

export function addInventoryToState(state: GameState, gains: Partial<Inventory>): GameState {
  const inventory = { ...state.inventory };

  for (const key of specialItemKeys) {
    const amount = gains[key] ?? 0;
    if (amount <= 0) continue;
    inventory[key] += amount;
  }

  return {
    ...state,
    inventory,
  };
}

export function mergeRewardBundles(a: RewardBundle, b: RewardBundle): RewardBundle {
  const merged = createEmptyRewardBundle();
  merged.xp = a.xp + b.xp;
  merged.energy = a.energy + b.energy;

  for (const key of resourceKeys) {
    const amount = (a.resources[key] ?? 0) + (b.resources[key] ?? 0);
    if (amount > 0) merged.resources[key] = amount;
  }

  for (const key of specialItemKeys) {
    const amount = (a.inventory[key] ?? 0) + (b.inventory[key] ?? 0);
    if (amount > 0) merged.inventory[key] = amount;
  }

  return merged;
}
