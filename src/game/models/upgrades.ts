import type { Resources } from './resources.ts';

export type UpgradeId =
  | 'cardboardBox'
  | 'foodBowl'
  | 'scratcher'
  | 'fishingCorner'
  | 'catnipGarden';

export type UpgradeState = {
  id: UpgradeId;
  level: number;
};

export type UpgradeDefinition = {
  id: UpgradeId;
  name: string;
  description: string;
  maxLevel: number;
  costsByNextLevel: Partial<Record<number, Partial<Resources>>>;
  effectTextByLevel: Record<number, string>;
};
