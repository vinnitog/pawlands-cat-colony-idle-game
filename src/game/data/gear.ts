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
    visual: { kind: 'image', src: 'art/superpowers/items/short-sword.png' },
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
    visual: { kind: 'image', src: 'art/superpowers/items/crimson-shield.png' },
  },
  {
    id: 'ironHelm',
    name: 'Elmo de Ferro',
    description: 'Proteção simples para quem guarda as muralhas.',
    slot: 'head',
    tier: 'basic',
    power: 1,
    price: { coins: 90 },
    origin: { kind: 'blacksmith' },
    visual: { kind: 'icon', name: 'helmet' },
  },
  {
    id: 'scoutBoots',
    name: 'Botas de Batedor',
    description: 'Passos firmes para atravessar as trilhas de Grimalkin.',
    slot: 'feet',
    tier: 'basic',
    power: 1,
    price: { coins: 80 },
    origin: { kind: 'blacksmith' },
    visual: { kind: 'icon', name: 'boots' },
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
    visual: { kind: 'image', src: 'art/superpowers/items/short-sword.png' },
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
    visual: { kind: 'image', src: 'art/superpowers/items/crimson-shield.png' },
  },
  {
    id: 'soulwalkerBoots',
    name: 'Passos das Almas',
    description: 'Botas silenciosas que não afundam no pântano espectral.',
    slot: 'feet',
    tier: 'rare',
    power: 2,
    price: null,
    origin: { kind: 'expedition', zoneId: 'soulMarsh' },
    visual: { kind: 'icon', name: 'boots' },
  },
  {
    id: 'eclipseCrown',
    name: 'Coroa do Eclipse',
    description: 'Um elmo régio marcado pela fronteira entre luz e sombra.',
    slot: 'head',
    tier: 'rare',
    power: 2,
    price: null,
    origin: { kind: 'expedition', zoneId: 'eclipseTower' },
    visual: { kind: 'icon', name: 'helmet' },
  },
] as const satisfies readonly GearDefinition[];

export const gearById = Object.fromEntries(
  gear.map((item) => [item.id, item]),
) as Record<GearId, GearDefinition>;

export const gearIds = gear.map((item) => item.id) as GearId[];

export const gearBySlot: Record<GearSlot, readonly GearDefinition[]> = {
  weapon: gear.filter((item) => item.slot === 'weapon'),
  armor: gear.filter((item) => item.slot === 'armor'),
  head: gear.filter((item) => item.slot === 'head'),
  feet: gear.filter((item) => item.slot === 'feet'),
};

export function isGearId(value: unknown): value is GearId {
  return typeof value === 'string' && Object.hasOwn(gearById, value);
}
