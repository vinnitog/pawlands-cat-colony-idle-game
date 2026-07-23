import type { ActivityDefinition } from '../models/activity.ts';

const minute = 60 * 1000;

export const activities: ActivityDefinition[] = [
  {
    id: 'huntMice',
    name: 'Caçar Ratinhos',
    description: 'Milo fareja cantinhos suspeitos e volta orgulhoso.',
    durationMs: 5 * minute,
    energyCost: 5,
    relatedStat: 'hunting',
    rewards: {
      resources: { mice: [2, 4], coins: [6, 10] },
      xp: [14, 20],
    },
  },
  {
    id: 'fishPond',
    name: 'Pescar',
    description: 'Uma pescaria calma, com bigodes em modo antena.',
    durationMs: 10 * minute,
    energyCost: 8,
    relatedStat: 'fishing',
    rewards: {
      resources: { fish: [3, 6], coins: [8, 14] },
      xp: [20, 28],
    },
  },
  {
    id: 'searchYarn',
    name: 'Procurar Novelos',
    description: 'Investiga cestos, almofadas e lugares improváveis.',
    durationMs: 3 * minute,
    energyCost: 3,
    relatedStat: 'luck',
    rewards: {
      resources: { yarn: [2, 5] },
      xp: [10, 15],
    },
  },
  {
    id: 'sleep',
    name: 'Dormir',
    description: 'Um cochilo estratégico recupera energia para novas aventuras.',
    durationMs: 15 * minute,
    energyCost: 0,
    rewards: {
      energy: [28, 34],
    },
  },
  {
    id: 'exploreYard',
    name: 'Explorar o Quintal',
    description: 'Aventura leve com chance de encontrar uma relíquia felina.',
    durationMs: 20 * minute,
    energyCost: 10,
    relatedStat: 'luck',
    rewards: {
      resources: {
        fish: [1, 3],
        mice: [1, 3],
        yarn: [1, 4],
        catnip: [1, 2],
        coins: [12, 20],
        cardboardBoxes: [0, 1],
      },
      xp: [30, 45],
      rareItems: [
        { item: 'rareFeather', chance: 0.08 },
        { item: 'goldenSardine', chance: 0.04 },
        { item: 'glowingYarn', chance: 0.06 },
      ],
      gemDrop: { chance: 0.15, amount: [1, 1] },
    },
  },
];

export const activityById = Object.fromEntries(
  activities.map((activity) => [activity.id, activity]),
) as Record<ActivityDefinition['id'], ActivityDefinition>;
