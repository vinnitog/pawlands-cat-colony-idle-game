import type { ExpeditionTrophyKey } from '../models/resources.ts';

export type ExpeditionTrophyDefinition = {
  id: ExpeditionTrophyKey;
  name: string;
  description: string;
  sellValue: number;
};

export const expeditionTrophies: ExpeditionTrophyDefinition[] = [
  {
    id: 'spectralSardine',
    name: 'Sardinha espectral',
    description: 'Ainda reluz com a luz fria dos Campos Sussurrantes.',
    sellValue: 8,
  },
  {
    id: 'phantomFur',
    name: 'Pelo fantasma',
    description: 'Um tufo leve demais para pertencer ao mundo dos vivos.',
    sellValue: 18,
  },
  {
    id: 'grimaldeRelic',
    name: 'Relíquia de Grimalde',
    description: 'Um fragmento antigo resgatado das ruínas do Além.',
    sellValue: 45,
  },
];

export const expeditionTrophyById = Object.fromEntries(
  expeditionTrophies.map((trophy) => [trophy.id, trophy]),
) as Record<ExpeditionTrophyKey, ExpeditionTrophyDefinition>;
