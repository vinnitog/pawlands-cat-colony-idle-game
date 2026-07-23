import type { ShopItemDefinition } from '../models/shop.ts';

// Vittorio's wares — paid for in Gems.
export const shopItems: ShopItemDefinition[] = [
  {
    id: 'royalMeal',
    name: 'Refeição Real',
    description: 'Um banquete digno de Grimalkin. Restaura toda a energia.',
    gemCost: 1,
    effect: { kind: 'energy', amount: 9999 },
  },
  {
    id: 'coinPurse',
    name: 'Bolsa de Moedas',
    description: 'O joalheiro "avalia" suas gemas. +150 moedas.',
    gemCost: 3,
    effect: { kind: 'resource', resource: 'coins', amount: 150 },
  },
  {
    id: 'goldenSardine',
    name: 'Sardinha Dourada',
    description: 'Uma relíquia rara do balcão dele. +1 Sardinha dourada.',
    gemCost: 2,
    effect: { kind: 'inventory', item: 'goldenSardine', amount: 1 },
  },
  {
    id: 'otherBlessing',
    name: 'Bênção do Além',
    description: 'Um sussurro do outro lado. +1 de Sorte, permanente.',
    gemCost: 5,
    effect: { kind: 'stat', stat: 'luck', amount: 1 },
  },
];

export const shopItemById = Object.fromEntries(
  shopItems.map((item) => [item.id, item]),
) as Record<ShopItemDefinition['id'], ShopItemDefinition>;
