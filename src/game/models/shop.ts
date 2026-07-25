import type { CatStats } from './cat.ts';
import type { InventoryItemKey, ResourceKey } from './resources.ts';

export type ShopId = 'jeweler' | 'blacksmith';

export type ShopItemId =
  // jeweler (Vittorio)
  | 'goldenSardine'
  | 'rareFeather'
  | 'glowingYarn'
  | 'royalMeal'
  | 'otherBlessing'
  | 'coinPurse'
  // blacksmith (Aldric)
  | 'steelClaw'
  | 'ironScale'
  | 'sharpPoint'
  | 'warFang'
  | 'greatHelm'
  | 'ironClaw'
  | 'guardArmor';

/** What a purchase grants, reusing the existing economy/cat systems. */
export type ShopEffect =
  | { kind: 'inventory'; item: InventoryItemKey; amount: number }
  | { kind: 'energy'; amount: number }
  | { kind: 'stat'; stat: keyof CatStats; amount: number }
  | { kind: 'resource'; resource: ResourceKey; amount: number };

type GemPrice = {
  gemCost: number;
  coinCost?: never;
};

type CoinPrice = {
  coinCost: number;
  gemCost?: never;
};

export type ShopItemDefinition = {
  id: ShopItemId;
  name: string;
  description: string;
  effect: ShopEffect;
} & (GemPrice | CoinPrice);

export type ShopDefinition = {
  id: ShopId;
  title: string;
  items: ShopItemDefinition[];
};
