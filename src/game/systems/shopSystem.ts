import { shopItemById } from '../data/shop.ts';
import type { GameState } from '../models/save.ts';
import type { Resources } from '../models/resources.ts';
import type { ShopEffect, ShopItemDefinition, ShopItemId } from '../models/shop.ts';
import { updateLeader } from './colonySystem.ts';
import {
  addInventoryToState,
  addResourcesToState,
  hasResources,
  subtractResourcesFromState,
} from './economySystem.ts';
import { refreshMissionProgress } from './missionSystem.ts';

export type ShopPurchaseResult =
  | { ok: true; state: GameState }
  | { ok: false; state: GameState; reason: string };

function applyEffect(state: GameState, effect: ShopEffect): GameState {
  switch (effect.kind) {
    case 'inventory':
      return addInventoryToState(state, { [effect.item]: effect.amount });
    case 'resource':
      return addResourcesToState(state, { [effect.resource]: effect.amount });
    case 'energy':
      return updateLeader(state, (cat) => ({
        ...cat,
        energy: Math.min(cat.maxEnergy, cat.energy + effect.amount),
      }));
    case 'stat':
      return updateLeader(state, (cat) => ({
        ...cat,
        stats: {
          ...cat.stats,
          [effect.stat]: cat.stats[effect.stat] + effect.amount,
        },
      }));
  }
}

export function getShopItemCost(item: ShopItemDefinition): Partial<Resources> {
  if (item.gemCost !== undefined) return { gems: item.gemCost };
  return { coins: item.coinCost };
}

export function buyShopItem(state: GameState, itemId: ShopItemId): ShopPurchaseResult {
  const item = shopItemById[itemId];
  if (!item) {
    return { ok: false, state, reason: 'Este item não está disponível.' };
  }
  const cost = getShopItemCost(item);

  if (!hasResources(state.resources, cost)) {
    if ((cost.coins ?? 0) > state.resources.coins) {
      return { ok: false, state, reason: 'Moedas insuficientes.' };
    }
    return { ok: false, state, reason: 'Gemas insuficientes.' };
  }

  let nextState = subtractResourcesFromState(state, cost);
  nextState = applyEffect(nextState, item.effect);

  return { ok: true, state: refreshMissionProgress(nextState) };
}
