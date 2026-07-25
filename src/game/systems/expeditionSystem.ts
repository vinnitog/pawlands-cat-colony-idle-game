import type { Cat } from '../models/cat.ts';

function getEquipmentPower(_cat: Cat): number {
  return 0;
}

export function getCatPower(cat: Cat): number {
  const attributePower = cat.stats.attack * 2 + cat.stats.defense + cat.level * 1.5;
  return attributePower + getEquipmentPower(cat);
}
