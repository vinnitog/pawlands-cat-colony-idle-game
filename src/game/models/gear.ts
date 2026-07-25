import type { ExpeditionZoneId } from './expedition.ts';

export type GearId =
  | 'ironClaw'
  | 'guardArmor'
  | 'mistFang'
  | 'grimaldeAegis';

export type GearSlot = 'weapon' | 'armor';
export type GearTier = 'basic' | 'rare';

export type CatEquipment = Record<GearSlot, GearId | null>;

export function isGearSlot(value: unknown): value is GearSlot {
  return value === 'weapon' || value === 'armor';
}

export type GearOrigin =
  | { kind: 'blacksmith' }
  | { kind: 'expedition'; zoneId: ExpeditionZoneId };

export type GearDefinition = {
  id: GearId;
  name: string;
  description: string;
  slot: GearSlot;
  tier: GearTier;
  power: number;
  price: { coins: number } | null;
  origin: GearOrigin;
  art: string;
};

export function createEmptyEquipment(): CatEquipment {
  return { weapon: null, armor: null };
}
