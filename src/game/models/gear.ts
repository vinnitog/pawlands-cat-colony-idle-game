import type { ExpeditionZoneId } from './expedition.ts';

export type GearId =
  | 'ironClaw'
  | 'guardArmor'
  | 'ironHelm'
  | 'scoutBoots'
  | 'mistFang'
  | 'grimaldeAegis'
  | 'soulwalkerBoots'
  | 'eclipseCrown';

export type GearSlot = 'weapon' | 'armor' | 'head' | 'feet';
export type GearTier = 'basic' | 'rare';
export type GearIcon = 'helmet' | 'boots';
export type GearVisual =
  | { kind: 'image'; src: string }
  | { kind: 'icon'; name: GearIcon };

export type CatEquipment = Record<GearSlot, GearId | null>;

export function isGearSlot(value: unknown): value is GearSlot {
  return value === 'weapon' || value === 'armor' || value === 'head' || value === 'feet';
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
  visual: GearVisual;
};

export function createEmptyEquipment(): CatEquipment {
  return { weapon: null, armor: null, head: null, feet: null };
}
