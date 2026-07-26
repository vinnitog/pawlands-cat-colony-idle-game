import { gearById } from '../data/gear.ts';
import type { Cat } from '../models/cat.ts';

export function getCatAttributePower(cat: Cat): number {
  return cat.stats.attack * 2 + cat.stats.defense + cat.level * 1.5;
}

export function getEquipmentPower(cat: Cat): number {
  return Object.values(cat.equipment).reduce(
    (total, gearId) => total + (gearId ? gearById[gearId].power : 0),
    0,
  );
}
