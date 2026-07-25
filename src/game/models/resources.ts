export type ResourceKey =
  | 'fish'
  | 'mice'
  | 'yarn'
  | 'catnip'
  | 'coins'
  | 'cardboardBoxes'
  | 'gems';

export type Resources = Record<ResourceKey, number>;

export type SpecialItemKey = 'rareFeather' | 'goldenSardine' | 'glowingYarn';

export type ExpeditionTrophyKey =
  | 'spectralSardine'
  | 'phantomFur'
  | 'grimaldeRelic'
  | 'ancientBoneCharm'
  | 'soulAmulet'
  | 'eclipseShard';

export type InventoryItemKey = SpecialItemKey | ExpeditionTrophyKey | GearId;

export type Inventory = Record<InventoryItemKey, number>;

export type RewardBundle = {
  resources: Partial<Resources>;
  inventory: Partial<Inventory>;
  xp: number;
  energy: number;
};

export const resourceKeys: ResourceKey[] = [
  'fish',
  'mice',
  'yarn',
  'catnip',
  'coins',
  'cardboardBoxes',
  'gems',
];

export const specialItemKeys: SpecialItemKey[] = [
  'rareFeather',
  'goldenSardine',
  'glowingYarn',
];

export const trophyKeys: ExpeditionTrophyKey[] = [
  'spectralSardine',
  'phantomFur',
  'grimaldeRelic',
  'ancientBoneCharm',
  'soulAmulet',
  'eclipseShard',
];

export const gearItemKeys: GearId[] = [
  'ironClaw',
  'guardArmor',
  'mistFang',
  'grimaldeAegis',
];

export const inventoryItemKeys: InventoryItemKey[] = [
  ...specialItemKeys,
  ...trophyKeys,
  ...gearItemKeys,
];

export const resourceLabels: Record<ResourceKey, string> = {
  fish: 'Peixes',
  mice: 'Ratinhos',
  yarn: 'Novelos',
  catnip: 'Catnip',
  coins: 'Moedas',
  cardboardBoxes: 'Caixas',
  gems: 'Gemas',
};

export const specialItemLabels: Record<SpecialItemKey, string> = {
  rareFeather: 'Pena rara',
  goldenSardine: 'Sardinha dourada',
  glowingYarn: 'Novelo brilhante',
};

export const trophyLabels: Record<ExpeditionTrophyKey, string> = {
  spectralSardine: 'Sardinha espectral',
  phantomFur: 'Pelo fantasma',
  grimaldeRelic: 'Relíquia grimalde',
  ancientBoneCharm: 'Talismã de osso ancestral',
  soulAmulet: 'Amuleto das almas',
  eclipseShard: 'Fragmento do eclipse',
};

export const gearItemLabels: Record<GearId, string> = {
  ironClaw: 'Garra de Ferro',
  guardArmor: 'Armadura do Guarda',
  mistFang: 'Presa da Bruma',
  grimaldeAegis: 'Égide de Grimalde',
};

export const inventoryItemLabels: Record<InventoryItemKey, string> = {
  ...specialItemLabels,
  ...trophyLabels,
  ...gearItemLabels,
};

export function createEmptyResources(): Resources {
  return {
    fish: 0,
    mice: 0,
    yarn: 0,
    catnip: 0,
    coins: 0,
    cardboardBoxes: 0,
    gems: 0,
  };
}

export function createEmptyInventory(): Inventory {
  return {
    rareFeather: 0,
    goldenSardine: 0,
    glowingYarn: 0,
    spectralSardine: 0,
    phantomFur: 0,
    grimaldeRelic: 0,
    ancientBoneCharm: 0,
    soulAmulet: 0,
    eclipseShard: 0,
    ironClaw: 0,
    guardArmor: 0,
    mistFang: 0,
    grimaldeAegis: 0,
  };
}

export function createEmptyRewardBundle(): RewardBundle {
  return {
    resources: {},
    inventory: {},
    xp: 0,
    energy: 0,
  };
}
import type { GearId } from './gear.ts';
