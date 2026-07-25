import type { ExpeditionTrophyKey } from './resources.ts';
import type { GearId } from './gear.ts';
import { getRuntimeDurationMs } from '../config/runtimeTiming.ts';

export type ExpeditionZoneId =
  | 'whisperingFields'
  | 'mistwood'
  | 'grimalkinRuins'
  | 'soulMarsh'
  | 'eclipseTower';

export type ActiveExpedition = {
  zoneId: ExpeditionZoneId;
  startedAt: number;
  lastProgressAt: number;
  accumulatedPulses: number;
};

export type ExpeditionPulseCarry = Partial<Record<ExpeditionZoneId, number>>;
export type ExpeditionTimeCarry = Partial<Record<ExpeditionZoneId, number>>;

/** Balanced interval used by production, tests and save validation. */
export const OFFICIAL_EXPEDITION_PULSE_MS = 5 * 60 * 1000;
/** One base hunting opportunity per runtime interval. */
export const EXPEDITION_PULSE_MS = getRuntimeDurationMs(OFFICIAL_EXPEDITION_PULSE_MS);
/** Eight hours of effective hunting at the nominal 1.0 efficiency. */
export const EXPEDITION_PULSE_CAP = 96;

export type ExpeditionUnlock =
  | { kind: 'always' }
  | { kind: 'catLevel'; level: number }
  | {
      kind: 'zoneCollections';
      zoneId: ExpeditionZoneId;
      collections: number;
    };

export type ExpeditionLootEntry = {
  item: ExpeditionTrophyKey;
  chancePerPulse: number;
  quantity: readonly [number, number];
};

export type ExpeditionGearEntry = {
  item: GearId;
  chancePerPulse: number;
};

export type ExpeditionZone = {
  id: ExpeditionZoneId;
  name: string;
  description: string;
  recommendedPower: number;
  unlock: ExpeditionUnlock;
  lootTable: readonly ExpeditionLootEntry[];
  gearTable: readonly ExpeditionGearEntry[];
  xpPerPulse: number;
  gemChance: number;
};
