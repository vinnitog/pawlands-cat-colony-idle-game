import { shopItemById } from '../data/shop.ts';
import type { GameState } from '../models/save.ts';
import type { ShopEffect, ShopItemId } from '../models/shop.ts';
import {
  addInventoryToState,
  addResourcesToState,
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
      return {
        ...state,
        cat: {
          ...state.cat,
          energy: Math.min(state.cat.maxEnergy, state.cat.energy + effect.amount),
        },
      };
    case 'stat':
      return {
        ...state,
        cat: {
          ...state.cat,
          stats: {
            ...state.cat.stats,
            [effect.stat]: state.cat.stats[effect.stat] + effect.amount,
          },
        },
      };
  }
}

export function buyShopItem(state: GameState, itemId: ShopItemId): ShopPurchaseResult {
  const item = shopItemById[itemId];

  if (state.resources.gems < item.gemCost) {
    return { ok: false, state, reason: 'Gemas insuficientes.' };
  }

  let nextState = subtractResourcesFromState(state, { gems: item.gemCost });
  nextState = applyEffect(nextState, item.effect);

  return { ok: true, state: refreshMissionProgress(nextState) };
}
