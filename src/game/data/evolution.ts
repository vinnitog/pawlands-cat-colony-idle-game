import { getRuntimeDurationMs } from '../config/runtimeTiming.ts';
import type {
  EvolutionNodeDefinition,
  EvolutionNodeId,
} from '../models/evolution.ts';

const minute = 60_000;

export const evolutionNodes: EvolutionNodeDefinition[] = [
  {
    id: 'improvisedWorkshop',
    branch: 'cyber',
    tier: 1,
    name: 'Oficina Improvisada',
    archetype: 'Tech Cat',
    description: 'Engrenagens, fios e caixas viram as primeiras ferramentas da colônia.',
    effectText: 'Atividades ficam 10% mais rápidas.',
    durationMs: getRuntimeDurationMs(3 * minute),
    cost: { coins: 25, yarn: 3 },
    prerequisites: [],
  },
  {
    id: 'dataDen',
    branch: 'cyber',
    tier: 2,
    name: 'Toca de Dados',
    archetype: 'Hacker Cat',
    description: 'Uma rede felina automatiza rotas, tarefas e o fluxo de informações.',
    effectText: 'Atividades ficam mais 10% rápidas.',
    durationMs: getRuntimeDurationMs(12 * minute),
    cost: { coins: 90, yarn: 12, gems: 1 },
    prerequisites: ['improvisedWorkshop'],
  },
  {
    id: 'curiosityLab',
    branch: 'science',
    tier: 1,
    name: 'Laboratório da Curiosidade',
    archetype: 'Scientist Cat',
    description: 'Frascos, hipóteses e sardinhas iniciam uma era de descobertas.',
    effectText: '+15% de XP em atividades.',
    durationMs: getRuntimeDurationMs(3 * minute),
    cost: { coins: 25, fish: 2 },
    prerequisites: [],
  },
  {
    id: 'geneGarden',
    branch: 'science',
    tier: 2,
    name: 'Jardim Genético',
    archetype: 'Geneticist Cat',
    description: 'Catnip experimental revela traços raros sem colocar nenhum gato em risco.',
    effectText: '+5% de chance de itens raros em atividades.',
    durationMs: getRuntimeDurationMs(12 * minute),
    cost: { coins: 90, catnip: 3, gems: 1 },
    prerequisites: ['curiosityLab'],
  },
  {
    id: 'bioCyborg',
    branch: 'hybrid',
    tier: 3,
    name: 'Protocolo Bio-Ciborgue',
    archetype: 'Bio-Cyborg Cat',
    description: 'Circuitos aprendem com células felinas. O impossível vira um novo começo.',
    effectText: '+10% de XP e atividades mais 5% rápidas.',
    durationMs: getRuntimeDurationMs(20 * minute),
    cost: { coins: 180, fish: 12, yarn: 12, gems: 2 },
    prerequisites: ['dataDen', 'geneGarden'],
  },
];

export const evolutionNodeById = Object.fromEntries(
  evolutionNodes.map((node) => [node.id, node]),
) as Record<EvolutionNodeId, EvolutionNodeDefinition>;

export const evolutionNodeIds = evolutionNodes.map((node) => node.id);

export function isEvolutionNodeId(value: unknown): value is EvolutionNodeId {
  return typeof value === 'string' && value in evolutionNodeById;
}
