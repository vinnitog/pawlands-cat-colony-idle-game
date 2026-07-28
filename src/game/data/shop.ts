import type { ShopDefinition, ShopId, ShopItemDefinition, ShopItemId } from '../models/shop.ts';
import { gearById } from './gear.ts';

const jeweler: ShopDefinition = {
  id: 'jeweler',
  title: 'Balcão de Gemas',
  items: [
    {
      id: 'royalMeal',
      name: 'Refeição Real',
      description: 'Um banquete digno de Grimalkin. Restaura toda a energia.',
      category: 'supplies',
      icon: 'energy',
      gemCost: 1,
      effect: { kind: 'energy', amount: 9999 },
    },
    {
      id: 'coinPurse',
      name: 'Bolsa de Moedas',
      description: 'O joalheiro "avalia" suas gemas. +150 moedas.',
      category: 'supplies',
      icon: 'coins',
      gemCost: 3,
      effect: { kind: 'resource', resource: 'coins', amount: 150 },
    },
    {
      id: 'goldenSardine',
      name: 'Sardinha Dourada',
      description: 'Uma relíquia rara do balcão dele. +1 Sardinha dourada.',
      category: 'supplies',
      icon: 'goldenSardine',
      gemCost: 2,
      effect: { kind: 'inventory', item: 'goldenSardine', amount: 1 },
    },
    {
      id: 'rareFeather',
      name: 'Pena Rara',
      description: 'Leve como um segredo. +1 Pena rara.',
      category: 'supplies',
      icon: 'rareFeather',
      gemCost: 2,
      effect: { kind: 'inventory', item: 'rareFeather', amount: 1 },
    },
    {
      id: 'glowingYarn',
      name: 'Novelo Brilhante',
      description: 'Brilha no escuro do Além. +1 Novelo brilhante.',
      category: 'supplies',
      icon: 'glowingYarn',
      gemCost: 2,
      effect: { kind: 'inventory', item: 'glowingYarn', amount: 1 },
    },
    {
      id: 'otherBlessing',
      name: 'Bênção do Além',
      description: 'Um sussurro do outro lado. +1 de Sorte, permanente.',
      category: 'improvement',
      icon: 'luck',
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
      id: 'ironClaw',
      name: 'Garra de Ferro',
      description: 'Arma básica. +2 de poder quando equipada.',
      category: 'equipment',
      icon: 'ironClaw',
      coinCost: gearById.ironClaw.price!.coins,
      effect: { kind: 'inventory', item: 'ironClaw', amount: 1 },
    },
    {
      id: 'guardArmor',
      name: 'Armadura do Guarda',
      description: 'Armadura básica. +2 de poder quando equipada.',
      category: 'equipment',
      icon: 'guardArmor',
      coinCost: gearById.guardArmor.price!.coins,
      effect: { kind: 'inventory', item: 'guardArmor', amount: 1 },
    },
    {
      id: 'ironHelm',
      name: 'Elmo de Ferro',
      description: 'Elmo básico. +1 de poder quando equipado.',
      category: 'equipment',
      icon: 'ironHelm',
      coinCost: gearById.ironHelm.price!.coins,
      effect: { kind: 'inventory', item: 'ironHelm', amount: 1 },
    },
    {
      id: 'scoutBoots',
      name: 'Botas de Batedor',
      description: 'Botas básicas. +1 de poder quando equipadas.',
      category: 'equipment',
      icon: 'scoutBoots',
      coinCost: gearById.scoutBoots.price!.coins,
      effect: { kind: 'inventory', item: 'scoutBoots', amount: 1 },
    },
    {
      id: 'steelClaw',
      name: 'Garra de Aço',
      description: 'Aço temperado nas patas. +1 de Ataque, permanente.',
      category: 'improvement',
      icon: 'attack',
      gemCost: 5,
      effect: { kind: 'stat', stat: 'attack', amount: 1 },
    },
    {
      id: 'ironScale',
      name: 'Escama de Ferro',
      description: 'Uma couraça rancorosa. +1 de Defesa, permanente.',
      category: 'improvement',
      icon: 'defense',
      gemCost: 5,
      effect: { kind: 'stat', stat: 'defense', amount: 1 },
    },
    {
      id: 'sharpPoint',
      name: 'Ponta Afiada',
      description: 'Fareja e fisga melhor. +1 de Caça, permanente.',
      category: 'improvement',
      icon: 'hunting',
      gemCost: 4,
      effect: { kind: 'stat', stat: 'hunting', amount: 1 },
    },
    {
      id: 'warFang',
      name: 'Presa de Guerra',
      description: 'Aço do Além, forjado com rancor. +2 de Ataque.',
      category: 'improvement',
      icon: 'attack',
      gemCost: 9,
      effect: { kind: 'stat', stat: 'attack', amount: 2 },
    },
    {
      id: 'greatHelm',
      name: 'Postura de Guerra',
      description: 'Treino para não recuar. +2 de Defesa, permanente.',
      category: 'improvement',
      icon: 'defense',
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
