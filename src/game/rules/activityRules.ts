import { activityById } from '../data/activities.ts';
import type { ActiveActivity } from '../models/activity.ts';

/**
 * Keeps old saves started with an official duration compatible with the
 * shortened local-development runtime.
 */
export function getEffectiveActivityEndsAt(activity: ActiveActivity): number {
  const runtimeDurationMs = activityById[activity.activityId].durationMs;
  return Math.min(activity.endsAt, activity.startedAt + runtimeDurationMs);
}
