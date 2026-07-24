import type { ActivityId } from '../models/activity.ts';

/** XP multiplier applied to the day's featured activity. */
export const DAILY_BONUS_XP_MULTIPLIER = 2;
/** Extra Gem drop chance granted by the daily bonus, before luck. */
export const DAILY_BONUS_GEM_CHANCE = 0.12;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Activities eligible to be featured — only ones that grant XP (sleep is out). */
const BONUS_CANDIDATES: ActivityId[] = ['huntMice', 'fishPond', 'searchYarn', 'exploreYard'];

/**
 * Deterministic UTC day index. Using UTC keeps the pick stable across a calendar
 * day and identical in tests regardless of the machine's timezone.
 */
function utcDayIndex(now: number): number {
  return Math.floor(now / DAY_MS);
}

/** The single activity boosted today. Rotates once per UTC day. */
export function getDailyBonusActivityId(now = Date.now()): ActivityId {
  const length = BONUS_CANDIDATES.length;
  const wrapped = ((utcDayIndex(now) % length) + length) % length;
  return BONUS_CANDIDATES[wrapped];
}

export function isDailyBonusActivity(activityId: ActivityId, now = Date.now()): boolean {
  return getDailyBonusActivityId(now) === activityId;
}
