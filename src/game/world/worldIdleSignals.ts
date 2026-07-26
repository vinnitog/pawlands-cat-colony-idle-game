import { activities } from '../data/activities.ts';
import { upgradeById, upgrades } from '../data/upgrades.ts';
import { expeditionZoneById } from '../data/zones.ts';
import type { ActivityId } from '../models/activity.ts';
import {
  EXPEDITION_PULSE_CAP,
  EXPEDITION_PULSE_MS,
  type ExpeditionZoneId,
} from '../models/expedition.ts';
import type { GameState } from '../models/save.ts';
import type { UpgradeId } from '../models/upgrades.ts';
import { getEffectiveActivityEndsAt } from '../rules/activityRules.ts';
import { getExpeditionEfficiency } from '../rules/expeditionRules.ts';

export type WorldSignalStatus = 'quiet' | 'active' | 'ready' | 'full';

export type WorldExpeditionSignal = {
  catId: string;
  catName: string;
  zoneId: ExpeditionZoneId;
  zoneName: string;
  status: Exclude<WorldSignalStatus, 'quiet'>;
  accumulatedPulses: number;
  capacity: number;
};

export type WorldActivityPost = {
  activityId: ActivityId;
  activityName: string;
  stationName: string;
  status: Exclude<WorldSignalStatus, 'full'>;
  assignments: {
    catId: string;
    catName: string;
    status: 'active' | 'ready';
  }[];
};

export type WorldUpgradeSignal = {
  upgradeId: UpgradeId;
  name: string;
  level: number;
  maxLevel: number;
  phase: 'base' | 'improved' | 'complete';
};

export type WorldIdleSignals = {
  expedition: {
    status: WorldSignalStatus;
    cats: WorldExpeditionSignal[];
  };
  activities: {
    status: Exclude<WorldSignalStatus, 'full'>;
    posts: WorldActivityPost[];
  };
  upgrades: WorldUpgradeSignal[];
};

const activityStations: Record<ActivityId, string> = {
  huntMice: 'Rondas da muralha',
  fishPond: 'Lago-jardim',
  searchYarn: 'Distrito mercantil',
  sleep: 'Alojamentos',
  exploreYard: 'Praça e eixo cívico',
};

function previewExpeditionPulses(cat: GameState['cats'][number], now: number): number {
  const expedition = cat.expedition;
  if (!expedition) return 0;

  const current = Math.min(EXPEDITION_PULSE_CAP, expedition.accumulatedPulses);
  if (current >= EXPEDITION_PULSE_CAP || now <= expedition.lastProgressAt) {
    return current;
  }

  const carriedMs = cat.expeditionTimeCarryMs[expedition.zoneId] ?? 0;
  const elapsedMs = carriedMs + (now - expedition.lastProgressAt);
  const wholeBasePulses = Math.floor(elapsedMs / EXPEDITION_PULSE_MS);
  const efficiency = getExpeditionEfficiency(cat, expedition.zoneId);

  return Math.min(
    EXPEDITION_PULSE_CAP,
    current + wholeBasePulses * efficiency,
  );
}

function getExpeditionSignals(state: GameState, now: number): WorldIdleSignals['expedition'] {
  const cats = state.cats.flatMap<WorldExpeditionSignal>((cat) => {
    if (!cat.expedition) return [];
    const accumulatedPulses = previewExpeditionPulses(cat, now);
    const status =
      accumulatedPulses >= EXPEDITION_PULSE_CAP
        ? 'full'
        : Math.floor(Number(accumulatedPulses.toFixed(12))) >= 1
          ? 'ready'
          : 'active';

    return [{
      catId: cat.id,
      catName: cat.name,
      zoneId: cat.expedition.zoneId,
      zoneName: expeditionZoneById[cat.expedition.zoneId].name,
      status,
      accumulatedPulses,
      capacity: EXPEDITION_PULSE_CAP,
    }];
  });

  const status = cats.some((cat) => cat.status === 'full')
    ? 'full'
    : cats.some((cat) => cat.status === 'ready')
      ? 'ready'
      : cats.length > 0
        ? 'active'
        : 'quiet';

  return { status, cats };
}

function getActivitySignals(state: GameState, now: number): WorldIdleSignals['activities'] {
  const posts = activities.map<WorldActivityPost>((definition) => {
    const assignments = state.cats.flatMap((cat) => {
      const active = cat.activity;
      if (!active || active.activityId !== definition.id) return [];
      return [{
        catId: cat.id,
        catName: cat.name,
        status: getEffectiveActivityEndsAt(active) <= now
          ? 'ready' as const
          : 'active' as const,
      }];
    });
    const isReady = assignments.some((assignment) => assignment.status === 'ready');

    return {
      activityId: definition.id,
      activityName: definition.name,
      stationName: activityStations[definition.id],
      status: isReady ? 'ready' : assignments.length > 0 ? 'active' : 'quiet',
      assignments,
    };
  });

  return {
    status: posts.some((post) => post.status === 'ready')
      ? 'ready'
      : posts.some((post) => post.status === 'active')
        ? 'active'
        : 'quiet',
    posts,
  };
}

function getUpgradeSignals(state: GameState): WorldUpgradeSignal[] {
  return upgrades.map((definition) => {
    const saved = state.upgrades[definition.id];
    const level = Math.min(definition.maxLevel, Math.max(1, saved?.level ?? 1));
    return {
      upgradeId: definition.id,
      name: upgradeById[definition.id].name,
      level,
      maxLevel: definition.maxLevel,
      phase: level >= definition.maxLevel ? 'complete' : level > 1 ? 'improved' : 'base',
    };
  });
}

/**
 * Builds read-only world cues from authoritative state. It intentionally does
 * not resolve rewards, persist previews or advance the game clock.
 */
export function getWorldIdleSignals(state: GameState, now = Date.now()): WorldIdleSignals {
  return {
    expedition: getExpeditionSignals(state, now),
    activities: getActivitySignals(state, now),
    upgrades: getUpgradeSignals(state),
  };
}
