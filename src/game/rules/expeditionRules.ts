import { expeditionZoneById } from '../data/zones.ts';
import type { Cat } from '../models/cat.ts';
import type { ExpeditionZoneId } from '../models/expedition.ts';
import { getCatAttributePower, getEquipmentPower } from './powerRules.ts';

export function getCatPower(cat: Cat): number {
  return getCatAttributePower(cat) + getEquipmentPower(cat);
}

export function getExpeditionEfficiency(cat: Cat, zoneId: ExpeditionZoneId): number {
  const efficiency = getCatPower(cat) / expeditionZoneById[zoneId].recommendedPower;
  return Math.min(1.5, Math.max(0.25, efficiency));
}
