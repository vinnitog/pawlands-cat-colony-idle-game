import { expeditionZoneById } from '../data/zones.ts';
import type { Cat } from '../models/cat.ts';
import {
  EXPEDITION_PULSE_CAP,
  EXPEDITION_PULSE_MS,
  type ExpeditionZone,
  type ExpeditionZoneId,
} from '../models/expedition.ts';
import { createEmptyRewardBundle, type RewardBundle } from '../models/resources.ts';
import type { GameState } from '../models/save.ts';
import { updateCat } from './colonySystem.ts';
import { addInventoryToState, addResourcesToState } from './economySystem.ts';
import { addXpToCat } from './levelSystem.ts';
import { refreshMissionProgress } from './missionSystem.ts';

function getEquipmentPower(_cat: Cat): number {
  return 0;
}

export function getCatPower(cat: Cat): number {
  const attributePower = cat.stats.attack * 2 + cat.stats.defense + cat.level * 1.5;
  return attributePower + getEquipmentPower(cat);
}

export function getExpeditionEfficiency(cat: Cat, zoneId: ExpeditionZoneId): number {
  const efficiency = getCatPower(cat) / expeditionZoneById[zoneId].recommendedPower;
  return Math.min(1.5, Math.max(0.25, efficiency));
}

export function isExpeditionZoneUnlocked(
  state: GameState,
  catId: string,
  zoneId: ExpeditionZoneId,
): boolean {
  const cat = state.cats.find((candidate) => candidate.id === catId);
  if (!cat) return false;

  const unlock = expeditionZoneById[zoneId].unlock;
  if (unlock.kind === 'always') return true;
  if (unlock.kind === 'catLevel') return cat.level >= unlock.level;
  return state.expeditionCollections[unlock.zoneId] >= unlock.collections;
}

export type StartExpeditionResult =
  | { ok: true; state: GameState }
  | { ok: false; state: GameState; reason: string };

export function startExpedition(
  state: GameState,
  catId: string,
  zoneId: ExpeditionZoneId,
  now = Date.now(),
): StartExpeditionResult {
  const cat = state.cats.find((candidate) => candidate.id === catId);
  if (!cat) {
    return { ok: false, state, reason: 'Esse gato não faz parte da colônia.' };
  }
  if (cat.activity || cat.expedition) {
    return { ok: false, state, reason: `${cat.name} já está ocupado.` };
  }
  if (!isExpeditionZoneUnlocked(state, catId, zoneId)) {
    return { ok: false, state, reason: 'Essa zona ainda está bloqueada.' };
  }

  const carriedPulses = cat.expeditionPulseCarry[zoneId] ?? 0;
  const { [zoneId]: _consumedCarry, ...remainingCarry } = cat.expeditionPulseCarry;

  return {
    ok: true,
    state: updateCat(state, catId, (current) => ({
      ...current,
      expedition: {
        zoneId,
        startedAt: now,
        lastProgressAt: now,
        accumulatedPulses: carriedPulses,
      },
      expeditionPulseCarry: remainingCarry,
    })),
  };
}

function advanceCatExpedition(cat: Cat, now: number): Cat {
  const expedition = cat.expedition;
  if (!expedition) return cat;

  const zoneId = expedition.zoneId;
  const carriedMs = cat.expeditionTimeCarryMs[zoneId] ?? 0;
  const clearTimeCarry = () => {
    const { [zoneId]: _consumedCarry, ...remainingCarry } = cat.expeditionTimeCarryMs;
    return remainingCarry;
  };
  const elapsedMs = now - expedition.lastProgressAt;
  if (elapsedMs < 0) {
    return {
      ...cat,
      expedition: {
        ...expedition,
        startedAt: now,
        lastProgressAt: now,
      },
      expeditionTimeCarryMs:
        expedition.accumulatedPulses >= EXPEDITION_PULSE_CAP
          ? clearTimeCarry()
          : cat.expeditionTimeCarryMs,
    };
  }

  if (expedition.accumulatedPulses >= EXPEDITION_PULSE_CAP) {
    return {
      ...cat,
      expedition: {
        ...expedition,
        lastProgressAt: now,
      },
      expeditionTimeCarryMs: clearTimeCarry(),
    };
  }

  if (elapsedMs === 0) return cat;

  const totalElapsedMs = carriedMs + elapsedMs;
  const wholeBasePulses = Math.floor(totalElapsedMs / EXPEDITION_PULSE_MS);
  const remainingMs = totalElapsedMs % EXPEDITION_PULSE_MS;
  const gainedPulses = wholeBasePulses * getExpeditionEfficiency(cat, expedition.zoneId);
  const accumulatedPulses = Math.min(
    EXPEDITION_PULSE_CAP,
    expedition.accumulatedPulses + gainedPulses,
  );
  const reachedCap = accumulatedPulses >= EXPEDITION_PULSE_CAP;

  return {
    ...cat,
    expedition: {
      ...expedition,
      lastProgressAt: now,
      accumulatedPulses,
    },
    expeditionTimeCarryMs:
      reachedCap || remainingMs === 0
        ? clearTimeCarry()
        : { ...cat.expeditionTimeCarryMs, [zoneId]: remainingMs },
  };
}

export function advanceExpeditions(state: GameState, now = Date.now()): GameState {
  let changed = false;
  const cats = state.cats.map((cat) => {
    const advanced = advanceCatExpedition(cat, now);
    if (advanced !== cat) changed = true;
    return advanced;
  });
  return changed ? { ...state, cats } : state;
}

function rollRange(range: readonly [number, number], random: () => number): number {
  const [min, max] = range;
  if (min === max) return min;
  return min + Math.floor(random() * (max - min + 1));
}

function createExpeditionReward(
  zone: ExpeditionZone,
  wholePulses: number,
  random: () => number,
): RewardBundle {
  const reward = createEmptyRewardBundle();
  reward.xp = wholePulses * zone.xpPerPulse;

  for (let pulse = 0; pulse < wholePulses; pulse += 1) {
    for (const loot of zone.lootTable) {
      if (random() < loot.chancePerPulse) {
        reward.inventory[loot.item] =
          (reward.inventory[loot.item] ?? 0) + rollRange(loot.quantity, random);
      }
    }
    if (random() < zone.gemChance) {
      reward.resources.gems = (reward.resources.gems ?? 0) + 1;
    }
  }

  return reward;
}

function normalizePulses(pulses: number): number {
  return Number(pulses.toFixed(12));
}

export type CollectExpeditionResult = {
  collected: boolean;
  state: GameState;
  reward: RewardBundle;
  resolvedPulses: number;
  levelsGained: number;
  levelCoins: number;
};

export function collectExpedition(
  state: GameState,
  catId: string,
  now = Date.now(),
  random = Math.random,
): CollectExpeditionResult {
  const advancedState = advanceExpeditions(state, now);
  const cat = advancedState.cats.find((candidate) => candidate.id === catId);
  const expedition = cat?.expedition;
  if (!cat || !expedition) {
    return {
      collected: false,
      state,
      reward: createEmptyRewardBundle(),
      resolvedPulses: 0,
      levelsGained: 0,
      levelCoins: 0,
    };
  }

  const normalizedPulses = normalizePulses(expedition.accumulatedPulses);
  const resolvedPulses = Math.floor(normalizedPulses);
  const carriedPulses = normalizedPulses - resolvedPulses;
  const reward = createExpeditionReward(
    expeditionZoneById[expedition.zoneId],
    resolvedPulses,
    random,
  );

  let nextState = addResourcesToState(advancedState, reward.resources);
  nextState = addInventoryToState(nextState, reward.inventory);
  const levelResult = addXpToCat(nextState, catId, reward.xp);
  nextState = updateCat(levelResult.state, catId, (current) => ({
    ...current,
    expedition: null,
    expeditionPulseCarry:
      carriedPulses > 0
        ? { ...current.expeditionPulseCarry, [expedition.zoneId]: carriedPulses }
        : current.expeditionPulseCarry,
  }));

  if (resolvedPulses > 0) {
    nextState = {
      ...nextState,
      expeditionCollections: {
        ...nextState.expeditionCollections,
        [expedition.zoneId]: nextState.expeditionCollections[expedition.zoneId] + 1,
      },
    };
  }
  nextState = refreshMissionProgress(nextState);

  return {
    collected: true,
    state: nextState,
    reward,
    resolvedPulses,
    levelsGained: levelResult.levelsGained,
    levelCoins: levelResult.coinsAwarded,
  };
}
