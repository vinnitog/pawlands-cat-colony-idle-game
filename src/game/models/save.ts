import type { Cat } from './cat.ts';
import type { MissionId, MissionState } from './missions.ts';
import type { Inventory, Resources } from './resources.ts';
import type { UpgradeId, UpgradeState } from './upgrades.ts';

export const saveSchemaVersion = 2;

export type GameTotals = {
  activitiesCompleted: number;
  resourcesEarned: Resources;
  upgradesPurchased: number;
};

export type GameState = {
  schemaVersion: number;
  /** False until the player has chosen a starter on the intro screen. */
  onboarded: boolean;
  /** The colony roster. Never empty. Each cat carries its own activity. */
  cats: Cat[];
  /** Id of the cat who walks the world and fronts the game. */
  leaderId: string;
  resources: Resources;
  inventory: Inventory;
  upgrades: Record<UpgradeId, UpgradeState>;
  missions: Record<MissionId, MissionState>;
  totals: GameTotals;
  /** Last position of the player in the Grimalkin world, in world pixels. */
  world: { x: number; y: number };
  lastSavedAt: number;
};
