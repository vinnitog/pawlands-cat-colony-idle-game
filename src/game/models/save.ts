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
  /** False until the player has chosen a starter on the intro screen. */
  onboarded: boolean;
  cat: Cat;
  resources: Resources;
  inventory: Inventory;
  upgrades: Record<UpgradeId, UpgradeState>;
  missions: Record<MissionId, MissionState>;
  totals: GameTotals;
  activeActivity: ActiveActivity | null;
  /** Last position of the player in the Grimalkin world, in world pixels. */
  world: { x: number; y: number };
  lastSavedAt: number;
};
