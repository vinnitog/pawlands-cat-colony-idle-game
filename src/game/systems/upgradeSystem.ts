import { upgradeById } from '../data/upgrades.ts';
import type { GameState } from '../models/save.ts';
import type { Resources } from '../models/resources.ts';
import type { UpgradeId } from '../models/upgrades.ts';
import { hasResources, subtractResourcesFromState } from './economySystem.ts';
import { refreshMissionProgress } from './missionSystem.ts';

export type UpgradeBonuses = {
  xpMultiplier: number;
  fishMultiplier: number;
  sleepEnergyBonus: number;
  rareChanceBonus: number;
};

export type UpgradePurchaseResult =
  | { ok: true; state: GameState }
  | { ok: false; state: GameState; reason: string };

export function getUpgradeCost(state: GameState, upgradeId: UpgradeId): Partial<Resources> | null {
  const current = state.upgrades[upgradeId];
  const definition = upgradeById[upgradeId];
  const nextLevel = current.level + 1;

  if (nextLevel > definition.maxLevel) {
    return null;
  }

  return definition.costsByNextLevel[nextLevel] ?? null;
}

export function getUpgradeBonuses(state: GameState): UpgradeBonuses {
  const cardboardLevel = state.upgrades.cardboardBox.level;
  const scratcherLevel = state.upgrades.scratcher.level;
  const fishingLevel = state.upgrades.fishingCorner.level;
  const bowlLevel = state.upgrades.foodBowl.level;
  const gardenLevel = state.upgrades.catnipGarden.level;

  return {
    xpMultiplier: 1 + (scratcherLevel - 1) * 0.1 + (cardboardLevel >= 3 ? 0.1 : 0),
    fishMultiplier: 1 + (fishingLevel - 1) * 0.2,
    sleepEnergyBonus: (bowlLevel - 1) * 10,
    rareChanceBonus: (gardenLevel - 1) * 0.05,
  };
}

export function buyUpgrade(state: GameState, upgradeId: UpgradeId): UpgradePurchaseResult {
  const definition = upgradeById[upgradeId];
  const current = state.upgrades[upgradeId];
  const cost = getUpgradeCost(state, upgradeId);

  if (!cost) {
    return { ok: false, state, reason: `${definition.name} já está no nível máximo.` };
  }

  if (!hasResources(state.resources, cost)) {
    return { ok: false, state, reason: 'Recursos insuficientes para essa melhoria.' };
  }

  let nextState = subtractResourcesFromState(state, cost);
  const nextLevel = current.level + 1;

  nextState = {
    ...nextState,
    upgrades: {
      ...nextState.upgrades,
      [upgradeId]: {
        ...current,
        level: nextLevel,
      },
    },
    totals: {
      ...nextState.totals,
      upgradesPurchased: nextState.totals.upgradesPurchased + 1,
    },
  };

  if (upgradeId === 'cardboardBox') {
    nextState = {
      ...nextState,
      cat: {
        ...nextState.cat,
        maxEnergy: nextState.cat.maxEnergy + 10,
      },
    };
  }

  return {
    ok: true,
    state: refreshMissionProgress(nextState),
  };
}
