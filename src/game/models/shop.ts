import type { CatStats } from './cat.ts';
import type { ResourceKey, SpecialItemKey } from './resources.ts';

export type ShopId = 'jeweler' | 'blacksmith';

export type ShopItemId =
  // jeweler (Vittorio)
  | 'goldenSardine'
  | 'royalMeal'
  | 'otherBlessing'
  | 'coinPurse'
  // blacksmith (Aldric)
  | 'steelClaw'
  | 'ironScale'
  | 'sharpPoint';

/** What a purchase grants, reusing the existing economy/cat systems. */
export type ShopEffect =
  | { kind: 'inventory'; item: SpecialItemKey; amount: number }
  | { kind: 'energy'; amount: number }
  | { kind: 'stat'; stat: keyof CatStats; amount: number }
  | { kind: 'resource'; resource: ResourceKey; amount: number };

export type ShopItemDefinition = {
  id: ShopItemId;
  name: string;
  description: string;
  gemCost: number;
  effect: ShopEffect;
};

export type ShopDefinition = {
  id: ShopId;
  title: string;
  items: ShopItemDefinition[];
};
