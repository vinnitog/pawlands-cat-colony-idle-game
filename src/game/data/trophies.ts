import type { ExpeditionTrophyKey } from '../models/resources.ts';

export type ExpeditionTrophyRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type ExpeditionTrophyDefinition = {
  id: ExpeditionTrophyKey;
  name: string;
  description: string;
  sellValue: number;
  rarity: ExpeditionTrophyRarity;
  art: string | null;
};

export const expeditionTrophyRarityLabels: Record<ExpeditionTrophyRarity, string> = {
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Raro',
  legendary: 'Lendário',
};

export const expeditionTrophies: ExpeditionTrophyDefinition[] = [
  {
    id: 'spectralSardine',
    name: 'Sardinha espectral',
    description: 'Ainda reluz com a luz fria dos Campos Sussurrantes.',
    sellValue: 8,
    rarity: 'common',
    art: null,
  },
  {
    id: 'phantomFur',
    name: 'Pelo fantasma',
    description: 'Um tufo leve demais para pertencer ao mundo dos vivos.',
    sellValue: 18,
    rarity: 'common',
    art: null,
  },
  {
    id: 'grimaldeRelic',
    name: 'Relíquia de Grimalde',
    description: 'Um fragmento antigo resgatado das ruínas do Além.',
    sellValue: 45,
    rarity: 'uncommon',
    art: null,
  },
  {
    id: 'ancientBoneCharm',
    name: 'Talismã de Osso Ancestral',
    description: 'Ossos antigos unidos por uma magia que resiste ao tempo.',
    sellValue: 65,
    rarity: 'uncommon',
    art: 'art/superpowers/items/bone-charm.png',
  },
  {
    id: 'soulAmulet',
    name: 'Amuleto das Almas',
    description: 'Uma joia fria que guarda sussurros do pântano.',
    sellValue: 90,
    rarity: 'rare',
    art: 'art/superpowers/items/spirit-amulet.png',
  },
  {
    id: 'eclipseShard',
    name: 'Fragmento do Eclipse',
    description: 'Um cristal onde luz e sombra permanecem em equilíbrio.',
    sellValue: 140,
    rarity: 'legendary',
    art: 'art/superpowers/items/spirit-gem.png',
  },
];

export const expeditionTrophyById = Object.fromEntries(
  expeditionTrophies.map((trophy) => [trophy.id, trophy]),
) as Record<ExpeditionTrophyKey, ExpeditionTrophyDefinition>;

export function isExpeditionTrophyKey(value: unknown): value is ExpeditionTrophyKey {
  return typeof value === 'string' && Object.hasOwn(expeditionTrophyById, value);
}
