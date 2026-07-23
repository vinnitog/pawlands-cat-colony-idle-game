import type { CatStats } from './cat.ts';

/** Playable starter archetypes. Keys must match sprite heroes in the manifest. */
export type CatClass = 'knight' | 'archer' | 'mage' | 'king';

export type CatClassDef = {
  id: CatClass;
  /** Archetype name shown on the selection card. */
  name: string;
  /** Short medieval epithet under the name. */
  role: string;
  /** One-line flavor for the card. */
  blurb: string;
  /** Starting stats applied when a brand-new colony picks this starter. */
  stats: CatStats;
};

export const catClasses: readonly CatClassDef[] = [
  {
    id: 'knight',
    name: 'Cavaleiro',
    role: 'Guarda de Ferro',
    blurb: 'Espada e escudo. Aguenta a linha de frente sem recuar.',
    stats: { attack: 4, defense: 4, hunting: 2, fishing: 1, luck: 1 },
  },
  {
    id: 'archer',
    name: 'Arqueiro',
    role: 'Caçador das Sombras',
    blurb: 'Ágil e rancoroso. Caça à distância antes que percebam.',
    stats: { attack: 3, defense: 2, hunting: 4, fishing: 2, luck: 1 },
  },
  {
    id: 'mage',
    name: 'Mago',
    role: 'Arcano Felino',
    blurb: 'Dobra a sorte e o fogo arcano a seu favor.',
    stats: { attack: 2, defense: 1, hunting: 2, fishing: 3, luck: 4 },
  },
  {
    id: 'king',
    name: 'Rei-Gato',
    role: 'Coroado de Grimalkin',
    blurb: 'Sangue real e rancor de trono. Resiliente e afortunado.',
    stats: { attack: 3, defense: 3, hunting: 2, fishing: 1, luck: 3 },
  },
];

export const catClassById: Record<CatClass, CatClassDef> = Object.fromEntries(
  catClasses.map((definition) => [definition.id, definition]),
) as Record<CatClass, CatClassDef>;

export const defaultCatClass: CatClass = 'knight';

export function isCatClass(value: unknown): value is CatClass {
  return typeof value === 'string' && value in catClassById;
}
