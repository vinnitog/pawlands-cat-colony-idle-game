import type {
  GearDefinition,
  GearId,
  GearSlot,
  GearTier,
} from '../models/gear.ts';

export const gearTierLabels: Record<GearTier, string> = {
  basic: 'Básico',
  rare: 'Raro',
};

export const gear = [
  {
    id: 'ironClaw',
    name: 'Garra de Ferro',
    description: 'Uma lâmina curta e confiável, forjada por Aldric.',
    slot: 'weapon',
    tier: 'basic',
    power: 2,
    price: { coins: 100 },
    origin: { kind: 'blacksmith' },
    art: 'art/superpowers/items/short-sword.png',
  },
  {
    id: 'guardArmor',
    name: 'Armadura do Guarda',
    description: 'Proteção sólida usada pelos guardas de Grimalkin.',
    slot: 'armor',
    tier: 'basic',
    power: 2,
    price: { coins: 140 },
    origin: { kind: 'blacksmith' },
    art: 'art/superpowers/items/crimson-shield.png',
  },
  {
    id: 'mistFang',
    name: 'Presa da Bruma',
    description: 'Uma presa espectral que corta a névoa sem fazer som.',
    slot: 'weapon',
    tier: 'rare',
    power: 5,
    price: null,
    origin: { kind: 'expedition', zoneId: 'mistwood' },
    art: 'art/superpowers/items/short-sword.png',
  },
  {
    id: 'grimaldeAegis',
    name: 'Égide de Grimalde',
    description: 'Um escudo antigo marcado pelo poder das ruínas.',
    slot: 'armor',
    tier: 'rare',
    power: 4,
    price: null,
    origin: { kind: 'expedition', zoneId: 'grimalkinRuins' },
    art: 'art/superpowers/items/crimson-shield.png',
  },
] as const satisfies readonly GearDefinition[];

export const gearById = Object.fromEntries(
  gear.map((item) => [item.id, item]),
) as Record<GearId, GearDefinition>;

export const gearIds = gear.map((item) => item.id) as GearId[];

export const gearBySlot: Record<GearSlot, readonly GearDefinition[]> = {
  weapon: gear.filter((item) => item.slot === 'weapon'),
  armor: gear.filter((item) => item.slot === 'armor'),
};

export function isGearId(value: unknown): value is GearId {
  return typeof value === 'string' && Object.hasOwn(gearById, value);
}
