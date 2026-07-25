import type { ActiveActivity } from './activity.ts';
import type { CatClass } from './catClass.ts';
import type {
  ActiveExpedition,
  ExpeditionPulseCarry,
  ExpeditionTimeCarry,
} from './expedition.ts';
import type { CatEquipment } from './gear.ts';

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
  /** Equipped gear is stored by id; its derived power is never persisted. */
  equipment: CatEquipment;
  /** The activity this cat is currently busy with, or null when free. */
  activity: ActiveActivity | null;
  /** The continuous expedition this cat is assigned to, or null when home. */
  expedition: ActiveExpedition | null;
  /** Unresolved sub-pulse progress, retained independently for each zone. */
  expeditionPulseCarry: ExpeditionPulseCarry;
  /** Raw time below one base pulse, retained independently for each zone. */
  expeditionTimeCarryMs: ExpeditionTimeCarry;
};
