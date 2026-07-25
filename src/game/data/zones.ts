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
        quantity: [1, 2],
      },
    ],
    gearTable: [],
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
        quantity: [1, 2],
      },
      {
        item: 'spectralSardine',
        chancePerPulse: 0.035,
        quantity: [1, 1],
      },
    ],
    gearTable: [
      {
        item: 'mistFang',
        chancePerPulse: 0.0015,
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
      {
        item: 'phantomFur',
        chancePerPulse: 0.045,
        quantity: [1, 1],
      },
      {
        item: 'ancientBoneCharm',
        chancePerPulse: 0.018,
        quantity: [1, 1],
      },
    ],
    gearTable: [
      {
        item: 'grimaldeAegis',
        chancePerPulse: 0.001,
      },
    ],
    xpPerPulse: 7,
    gemChance: 0.008,
  },
  {
    id: 'soulMarsh',
    name: 'Pântano das Almas',
    description: 'Águas imóveis guardam amuletos e ossos de eras esquecidas.',
    recommendedPower: 40,
    unlock: {
      kind: 'zoneCollections',
      zoneId: 'grimalkinRuins',
      collections: 5,
    },
    lootTable: [
      {
        item: 'soulAmulet',
        chancePerPulse: 0.075,
        quantity: [1, 1],
      },
      {
        item: 'ancientBoneCharm',
        chancePerPulse: 0.035,
        quantity: [1, 1],
      },
      {
        item: 'grimaldeRelic',
        chancePerPulse: 0.025,
        quantity: [1, 1],
      },
    ],
    gearTable: [],
    xpPerPulse: 10,
    gemChance: 0.01,
  },
  {
    id: 'eclipseTower',
    name: 'Limiar do Eclipse',
    description: 'Na fronteira entre luz e sombra, cristais guardam tesouros impossíveis.',
    recommendedPower: 60,
    unlock: {
      kind: 'zoneCollections',
      zoneId: 'soulMarsh',
      collections: 8,
    },
    lootTable: [
      {
        item: 'eclipseShard',
        chancePerPulse: 0.055,
        quantity: [1, 1],
      },
      {
        item: 'soulAmulet',
        chancePerPulse: 0.03,
        quantity: [1, 1],
      },
      {
        item: 'ancientBoneCharm',
        chancePerPulse: 0.02,
        quantity: [1, 1],
      },
    ],
    gearTable: [],
    xpPerPulse: 14,
    gemChance: 0.012,
  },
] as const satisfies readonly ExpeditionZone[];

export const expeditionZoneById = {
  whisperingFields: expeditionZones[0],
  mistwood: expeditionZones[1],
  grimalkinRuins: expeditionZones[2],
  soulMarsh: expeditionZones[3],
  eclipseTower: expeditionZones[4],
} satisfies Record<ExpeditionZoneId, ExpeditionZone>;

export const expeditionZoneIds = expeditionZones.map((zone) => zone.id) as ExpeditionZoneId[];

export function isExpeditionZoneId(value: unknown): value is ExpeditionZoneId {
  return typeof value === 'string' && Object.hasOwn(expeditionZoneById, value);
}
