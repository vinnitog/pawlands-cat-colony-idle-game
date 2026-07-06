import type { UpgradeDefinition } from '../models/upgrades.ts';

export const upgrades: UpgradeDefinition[] = [
  {
    id: 'cardboardBox',
    name: 'Caixa de Papelão',
    description: 'A base da colônia. Simples, honesta e muito disputada.',
    maxLevel: 3,
    costsByNextLevel: {
      2: { coins: 40, cardboardBoxes: 1 },
      3: { coins: 90, cardboardBoxes: 2, yarn: 10 },
    },
    effectTextByLevel: {
      1: 'Abrigo inicial.',
      2: '+10 energia máxima.',
      3: '+10 energia máxima e +10% XP.',
    },
  },
  {
    id: 'foodBowl',
    name: 'Tigela de Comida',
    description: 'Dormir rende mais quando a tigela está cheia.',
    maxLevel: 3,
    costsByNextLevel: {
      2: { coins: 50, fish: 8 },
      3: { coins: 120, fish: 18 },
    },
    effectTextByLevel: {
      1: 'Recuperação normal ao dormir.',
      2: '+10 energia ao dormir.',
      3: '+20 energia ao dormir.',
    },
  },
  {
    id: 'scratcher',
    name: 'Arranhador',
    description: 'Treino de foco, patinhas e autoestima.',
    maxLevel: 3,
    costsByNextLevel: {
      2: { coins: 60, yarn: 12 },
      3: { coins: 150, yarn: 28 },
    },
    effectTextByLevel: {
      1: 'Ganho de XP normal.',
      2: '+10% XP em atividades.',
      3: '+20% XP em atividades.',
    },
  },
  {
    id: 'fishingCorner',
    name: 'Cantinho de Pesca',
    description: 'Um lugar melhor para observar água e fingir paciência.',
    maxLevel: 3,
    costsByNextLevel: {
      2: { coins: 70, fish: 12 },
      3: { coins: 180, fish: 30 },
    },
    effectTextByLevel: {
      1: 'Peixes normais.',
      2: '+20% peixes.',
      3: '+40% peixes.',
    },
  },
  {
    id: 'catnipGarden',
    name: 'Jardim de Catnip',
    description: 'Pequenas folhas, grandes decisões.',
    maxLevel: 3,
    costsByNextLevel: {
      2: { coins: 80, catnip: 6 },
      3: { coins: 220, catnip: 16 },
    },
    effectTextByLevel: {
      1: 'Chance rara normal.',
      2: '+5% chance de item raro.',
      3: '+10% chance de item raro.',
    },
  },
];

export const upgradeById = Object.fromEntries(
  upgrades.map((upgrade) => [upgrade.id, upgrade]),
) as Record<UpgradeDefinition['id'], UpgradeDefinition>;
