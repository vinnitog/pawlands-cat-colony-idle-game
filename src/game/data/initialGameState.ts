import { missions } from './missions.ts';
import { upgrades } from './upgrades.ts';
import type { Cat } from '../models/cat.ts';
import { createEmptyInventory, createEmptyResources } from '../models/resources.ts';
import { saveSchemaVersion, type GameState } from '../models/save.ts';

export function createInitialGameState(now = Date.now()): GameState {
  const resources = createEmptyResources();
  resources.coins = 20;
  resources.cardboardBoxes = 1;

  const leader: Cat = {
    id: 'milo',
    name: 'Milo',
    catClass: 'knight',
    level: 1,
    xp: 0,
    energy: 40,
    maxEnergy: 40,
    stats: {
      attack: 2,
      defense: 2,
      hunting: 3,
      fishing: 2,
      luck: 2,
    },
    activity: null,
  };

  return {
    schemaVersion: saveSchemaVersion,
    onboarded: false,
    cats: [leader],
    leaderId: leader.id,
    resources,
    inventory: createEmptyInventory(),
    upgrades: Object.fromEntries(
      upgrades.map((upgrade) => [upgrade.id, { id: upgrade.id, level: 1 }]),
    ) as GameState['upgrades'],
    missions: Object.fromEntries(
      missions.map((mission) => [
        mission.id,
        {
          id: mission.id,
          progress: 0,
          target: mission.condition.target,
          completed: false,
          claimed: false,
        },
      ]),
    ) as GameState['missions'],
    totals: {
      activitiesCompleted: 0,
      resourcesEarned: createEmptyResources(),
      upgradesPurchased: 0,
    },
    world: { x: 192, y: 144 }, // Grimalkin spawn (tile 12,9 × 16px)
    lastEnergyRegenAt: now,
    lastSavedAt: now,
  };
}
