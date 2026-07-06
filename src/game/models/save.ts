import type { ActiveActivity } from './activity.ts';
import type { Cat } from './cat.ts';
import type { MissionId, MissionState } from './missions.ts';
import type { Inventory, Resources } from './resources.ts';
import type { UpgradeId, UpgradeState } from './upgrades.ts';

export const saveSchemaVersion = 1;

export type GameTotals = {
  activitiesCompleted: number;
  resourcesEarned: Resources;
  upgradesPurchased: number;
};

export type GameState = {
  schemaVersion: number;
  cat: Cat;
  resources: Resources;
  inventory: Inventory;
  upgrades: Record<UpgradeId, UpgradeState>;
  missions: Record<MissionId, MissionState>;
  totals: GameTotals;
  activeActivity: ActiveActivity | null;
  lastSavedAt: number;
};
