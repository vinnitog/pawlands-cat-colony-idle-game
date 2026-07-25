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
  | 'grimaldeRelic';

export type InventoryItemKey = SpecialItemKey | ExpeditionTrophyKey;

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
];

export const inventoryItemKeys: InventoryItemKey[] = [
  ...specialItemKeys,
  ...trophyKeys,
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
};

export const inventoryItemLabels: Record<InventoryItemKey, string> = {
  ...specialItemLabels,
  ...trophyLabels,
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
