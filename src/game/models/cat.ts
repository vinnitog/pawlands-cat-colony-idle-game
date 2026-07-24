import type { ActiveActivity } from './activity.ts';
import type { CatClass } from './catClass.ts';

export type CatStats = {
  attack: number;
  defense: number;
  hunting: number;
  fishing: number;
  luck: number;
};

export type Cat = {
  id: string;
  name: string;
  catClass: CatClass;
  level: number;
  xp: number;
  energy: number;
  maxEnergy: number;
  stats: CatStats;
  /** The activity this cat is currently busy with, or null when free. */
  activity: ActiveActivity | null;
};
