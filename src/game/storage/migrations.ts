import { activityById } from '../data/activities.ts';
import { createInitialGameState } from '../data/initialGameState.ts';
import { missions } from '../data/missions.ts';
import { upgrades } from '../data/upgrades.ts';
import type { ActiveActivity } from '../models/activity.ts';
import type { Cat } from '../models/cat.ts';
import { isCatClass } from '../models/catClass.ts';
import type { MissionState } from '../models/missions.ts';
import type { Inventory, Resources } from '../models/resources.ts';
import { resourceKeys, specialItemKeys } from '../models/resources.ts';
import { saveSchemaVersion, type GameState } from '../models/save.ts';
import type { UpgradeState } from '../models/upgrades.ts';
import { refreshMissionProgress } from '../systems/missionSystem.ts';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function migrateGameSave(value: unknown): GameState {
  if (!isObject(value) || value.schemaVersion !== saveSchemaVersion) {
    return createInitialGameState();
  }

  const fallback = createInitialGameState();
  const candidate = value as Partial<GameState>;

  try {
    return refreshMissionProgress({
      ...fallback,
      onboarded: typeof candidate.onboarded === 'boolean' ? candidate.onboarded : false,
      cat: mergeCat(candidate.cat, fallback.cat),
      resources: mergeResources(candidate.resources, fallback.resources),
      inventory: mergeInventory(candidate.inventory, fallback.inventory),
      upgrades: mergeUpgrades(candidate.upgrades, fallback.upgrades),
      missions: mergeMissions(candidate.missions, fallback.missions),
      totals: {
        activitiesCompleted: toSafeNumber(candidate.totals?.activitiesCompleted, 0),
        upgradesPurchased: toSafeNumber(candidate.totals?.upgradesPurchased, 0),
        resourcesEarned: mergeResources(candidate.totals?.resourcesEarned, fallback.totals.resourcesEarned),
      },
      activeActivity: mergeActiveActivity(candidate.activeActivity),
      lastSavedAt: toSafeNumber(candidate.lastSavedAt, fallback.lastSavedAt),
    });
  } catch {
    return fallback;
  }
}

function toSafeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function mergeResources(value: unknown, fallback: Resources): Resources {
  const result = { ...fallback };

  if (!isObject(value)) return result;

  for (const key of resourceKeys) {
    result[key] = toSafeNumber(value[key], fallback[key]);
  }

  return result;
}

function mergeInventory(value: unknown, fallback: Inventory): Inventory {
  const result = { ...fallback };

  if (!isObject(value)) return result;

  for (const key of specialItemKeys) {
    result[key] = toSafeNumber(value[key], fallback[key]);
  }

  return result;
}

function mergeCat(value: unknown, fallback: Cat): Cat {
  if (!isObject(value)) return fallback;

  const stats = isObject(value.stats) ? value.stats : {};

  const maxEnergy = Math.max(1, toSafeNumber(value.maxEnergy, fallback.maxEnergy));

  return {
    ...fallback,
    id: typeof value.id === 'string' ? value.id : fallback.id,
    name: typeof value.name === 'string' ? value.name : fallback.name,
    catClass: isCatClass(value.catClass) ? value.catClass : fallback.catClass,
    level: Math.max(1, toSafeNumber(value.level, fallback.level)),
    xp: toSafeNumber(value.xp, fallback.xp),
    energy: Math.min(maxEnergy, toSafeNumber(value.energy, fallback.energy)),
    maxEnergy,
    stats: {
      attack: Math.max(1, toSafeNumber(stats.attack, fallback.stats.attack)),
      defense: Math.max(1, toSafeNumber(stats.defense, fallback.stats.defense)),
      hunting: Math.max(1, toSafeNumber(stats.hunting, fallback.stats.hunting)),
      fishing: Math.max(1, toSafeNumber(stats.fishing, fallback.stats.fishing)),
      luck: Math.max(1, toSafeNumber(stats.luck, fallback.stats.luck)),
    },
  };
}

function mergeUpgrades(value: unknown, fallback: GameState['upgrades']): GameState['upgrades'] {
  const result = { ...fallback };
  const source = isObject(value) ? value : {};

  for (const definition of upgrades) {
    const current = source[definition.id] as Partial<UpgradeState> | undefined;
    const level = toSafeNumber(current?.level, fallback[definition.id].level);
    result[definition.id] = {
      id: definition.id,
      level: Math.min(definition.maxLevel, Math.max(1, level)),
    };
  }

  return result;
}

function mergeMissions(value: unknown, fallback: GameState['missions']): GameState['missions'] {
  const result = { ...fallback };
  const source = isObject(value) ? value : {};

  for (const definition of missions) {
    const current = source[definition.id] as Partial<MissionState> | undefined;
    result[definition.id] = {
      id: definition.id,
      progress: toSafeNumber(current?.progress, fallback[definition.id].progress),
      target: definition.condition.target,
      completed: Boolean(current?.completed),
      claimed: Boolean(current?.claimed),
    };
  }

  return result;
}

function mergeActiveActivity(value: unknown): ActiveActivity | null {
  if (!isObject(value)) return null;

  const activityId = value.activityId;
  if (typeof activityId !== 'string' || !(activityId in activityById)) {
    return null;
  }

  return {
    activityId: activityId as ActiveActivity['activityId'],
    startedAt: toSafeNumber(value.startedAt, 0),
    endsAt: toSafeNumber(value.endsAt, 0),
  };
}
