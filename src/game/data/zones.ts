import type {
  ExpeditionZone,
  ExpeditionZoneId,
} from '../models/expedition.ts';

export const expeditionZones = [
  {
    id: 'whisperingFields',
    name: 'Campos Sussurrantes',
    description: 'Ratos-fantasma rondam plantações cobertas pela névoa.',
    recommendedPower: 6,
    unlock: { kind: 'always' },
    lootTable: [
      {
        item: 'spectralSardine',
        chancePerPulse: 0.18,
        quantity: [1, 1],
      },
    ],
    xpPerPulse: 2,
    gemChance: 0.002,
  },
  {
    id: 'mistwood',
    name: 'Bosque das Brumas',
    description: 'Trilhas antigas escondem penas e pelagens do Além.',
    recommendedPower: 14,
    unlock: { kind: 'catLevel', level: 4 },
    lootTable: [
      {
        item: 'phantomFur',
        chancePerPulse: 0.14,
        quantity: [1, 1],
      },
    ],
    xpPerPulse: 4,
    gemChance: 0.004,
  },
  {
    id: 'grimalkinRuins',
    name: 'Ruínas de Grimalkin',
    description: 'Relíquias esquecidas aguardam entre pedras assombradas.',
    recommendedPower: 26,
    unlock: {
      kind: 'zoneCollections',
      zoneId: 'whisperingFields',
      collections: 5,
    },
    lootTable: [
      {
        item: 'grimaldeRelic',
        chancePerPulse: 0.1,
        quantity: [1, 1],
      },
    ],
    xpPerPulse: 7,
    gemChance: 0.008,
  },
] as const satisfies readonly ExpeditionZone[];

export const expeditionZoneById = {
  whisperingFields: expeditionZones[0],
  mistwood: expeditionZones[1],
  grimalkinRuins: expeditionZones[2],
} satisfies Record<ExpeditionZoneId, ExpeditionZone>;

export function isExpeditionZoneId(value: unknown): value is ExpeditionZoneId {
  return typeof value === 'string' && Object.hasOwn(expeditionZoneById, value);
}
