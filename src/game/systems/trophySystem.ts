import {
  expeditionTrophyById,
  isExpeditionTrophyKey,
} from '../data/trophies.ts';
import type { ExpeditionTrophyKey } from '../models/resources.ts';
import type { GameState } from '../models/save.ts';
import { addResourcesToState } from './economySystem.ts';
import { refreshMissionProgress } from './missionSystem.ts';

export type TrophySaleMode = 'one' | 'all';

export type SellTrophyResult =
  | {
      ok: true;
      state: GameState;
      quantity: number;
      coins: number;
    }
  | {
      ok: false;
      state: GameState;
      reason: string;
    };

function isSafeNonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

export function sellTrophy(
  state: GameState,
  trophyId: ExpeditionTrophyKey,
  mode: TrophySaleMode,
): SellTrophyResult {
  if (!isExpeditionTrophyKey(trophyId)) {
    return { ok: false, state, reason: 'Esse item não é um troféu vendável.' };
  }
  if (mode !== 'one' && mode !== 'all') {
    return { ok: false, state, reason: 'Quantidade de venda inválida.' };
  }

  const available = state.inventory[trophyId];
  if (!isSafeNonNegativeInteger(available)) {
    return { ok: false, state, reason: 'A quantidade desse troféu é inválida.' };
  }
  if (available <= 0) {
    return { ok: false, state, reason: 'Você não possui esse troféu.' };
  }

  const quantity = mode === 'all' ? available : 1;
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    return { ok: false, state, reason: 'A quantidade de venda é inválida.' };
  }

  const coins = quantity * expeditionTrophyById[trophyId].sellValue;
  if (!Number.isSafeInteger(coins) || coins <= 0) {
    return { ok: false, state, reason: 'O valor total da venda excede o limite seguro.' };
  }

  if (
    !isSafeNonNegativeInteger(state.resources.coins)
    || !isSafeNonNegativeInteger(state.totals.resourcesEarned.coins)
  ) {
    return { ok: false, state, reason: 'O saldo atual está fora do limite seguro de moedas.' };
  }

  const projectedCoins = state.resources.coins + coins;
  const projectedEarnedCoins = state.totals.resourcesEarned.coins + coins;
  if (
    !isSafeNonNegativeInteger(projectedCoins)
    || !isSafeNonNegativeInteger(projectedEarnedCoins)
  ) {
    return { ok: false, state, reason: 'A venda excederia o limite seguro de moedas.' };
  }

  const stateWithoutTrophies: GameState = {
    ...state,
    inventory: {
      ...state.inventory,
      [trophyId]: available - quantity,
    },
  };
  const nextState = refreshMissionProgress(
    addResourcesToState(stateWithoutTrophies, { coins }),
  );

  return {
    ok: true,
    state: nextState,
    quantity,
    coins,
  };
}
