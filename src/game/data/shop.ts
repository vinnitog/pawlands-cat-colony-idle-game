import type { ShopDefinition, ShopId, ShopItemDefinition, ShopItemId } from '../models/shop.ts';

const jeweler: ShopDefinition = {
  id: 'jeweler',
  title: 'Balcão de Gemas',
  items: [
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
      id: 'rareFeather',
      name: 'Pena Rara',
      description: 'Leve como um segredo. +1 Pena rara.',
      gemCost: 2,
      effect: { kind: 'inventory', item: 'rareFeather', amount: 1 },
    },
    {
      id: 'glowingYarn',
      name: 'Novelo Brilhante',
      description: 'Brilha no escuro do Além. +1 Novelo brilhante.',
      gemCost: 2,
      effect: { kind: 'inventory', item: 'glowingYarn', amount: 1 },
    },
    {
      id: 'otherBlessing',
      name: 'Bênção do Além',
      description: 'Um sussurro do outro lado. +1 de Sorte, permanente.',
      gemCost: 5,
      effect: { kind: 'stat', stat: 'luck', amount: 1 },
    },
  ],
};

const blacksmith: ShopDefinition = {
  id: 'blacksmith',
  title: 'Forja de Aldric',
  items: [
    {
      id: 'steelClaw',
      name: 'Garra de Aço',
      description: 'Aço temperado nas patas. +1 de Ataque, permanente.',
      gemCost: 5,
      effect: { kind: 'stat', stat: 'attack', amount: 1 },
    },
    {
      id: 'ironScale',
      name: 'Escama de Ferro',
      description: 'Uma couraça rancorosa. +1 de Defesa, permanente.',
      gemCost: 5,
      effect: { kind: 'stat', stat: 'defense', amount: 1 },
    },
    {
      id: 'sharpPoint',
      name: 'Ponta Afiada',
      description: 'Fareja e fisga melhor. +1 de Caça, permanente.',
      gemCost: 4,
      effect: { kind: 'stat', stat: 'hunting', amount: 1 },
    },
    {
      id: 'warFang',
      name: 'Presa de Guerra',
      description: 'Aço do Além, forjado com rancor. +2 de Ataque.',
      gemCost: 9,
      effect: { kind: 'stat', stat: 'attack', amount: 2 },
    },
    {
      id: 'greatHelm',
      name: 'Elmo de Guerra',
      description: 'Uma couraça que não recua. +2 de Defesa.',
      gemCost: 9,
      effect: { kind: 'stat', stat: 'defense', amount: 2 },
    },
  ],
};

export const shopsById: Record<ShopId, ShopDefinition> = { jeweler, blacksmith };

export const shopItemById = Object.fromEntries(
  Object.values(shopsById)
    .flatMap((shop) => shop.items)
    .map((item) => [item.id, item]),
) as Record<ShopItemId, ShopItemDefinition>;
