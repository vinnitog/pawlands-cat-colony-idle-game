import type { ExpeditionTrophyKey } from './resources.ts';

export type ExpeditionZoneId =
  | 'whisperingFields'
  | 'mistwood'
  | 'grimalkinRuins';

export type ActiveExpedition = {
  zoneId: ExpeditionZoneId;
  startedAt: number;
  lastProgressAt: number;
  accumulatedPulses: number;
};

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

export type ExpeditionZone = {
  id: ExpeditionZoneId;
  name: string;
  description: string;
  recommendedPower: number;
  unlock: ExpeditionUnlock;
  lootTable: readonly ExpeditionLootEntry[];
  xpPerPulse: number;
  gemChance: number;
};
