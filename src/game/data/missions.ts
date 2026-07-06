import type { MissionDefinition } from '../models/missions.ts';

export const missions: MissionDefinition[] = [
  {
    id: 'completeFirstActivity',
    title: 'Primeira patrulha',
    description: 'Complete 1 atividade.',
    condition: { kind: 'activitiesCompleted', target: 1 },
    reward: { coins: 20, xp: 15 },
  },
  {
    id: 'collectFish10',
    title: 'Cheiro de pescaria',
    description: 'Colete 10 peixes.',
    condition: { kind: 'resourceEarned', resource: 'fish', target: 10 },
    reward: { coins: 35, xp: 20 },
  },
  {
    id: 'captureMice10',
    title: 'Bigodes atentos',
    description: 'Capture 10 ratinhos.',
    condition: { kind: 'resourceEarned', resource: 'mice', target: 10 },
    reward: { coins: 35, xp: 20 },
  },
  {
    id: 'saveCoins100',
    title: 'Tesouro da colônia',
    description: 'Junte 100 moedas.',
    condition: { kind: 'resourceCurrent', resource: 'coins', target: 100 },
    reward: { coins: 50, xp: 25 },
  },
  {
    id: 'upgradeCardboard2',
    title: 'Caixa reforçada',
    description: 'Melhore a Caixa de Papelão para o nível 2.',
    condition: { kind: 'upgradeLevel', upgradeId: 'cardboardBox', target: 2 },
    reward: { coins: 45, xp: 30 },
  },
  {
    id: 'reachCatLevel3',
    title: 'Milo veterano',
    description: 'Alcance o nível 3 com o gato.',
    condition: { kind: 'catLevel', target: 3 },
    reward: { coins: 75, xp: 40 },
  },
];

export const missionById = Object.fromEntries(
  missions.map((mission) => [mission.id, mission]),
) as Record<MissionDefinition['id'], MissionDefinition>;
