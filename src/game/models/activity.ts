import type { ResourceKey, SpecialItemKey } from './resources.ts';

export type ActivityId =
  | 'huntMice'
  | 'fishPond'
  | 'searchYarn'
  | 'sleep'
  | 'exploreYard';

export type RelatedStat = 'hunting' | 'fishing' | 'luck';

export type RewardRange = [number, number];

export type ActivityDefinition = {
  id: ActivityId;
  name: string;
  description: string;
  durationMs: number;
  energyCost: number;
  relatedStat?: RelatedStat;
  rewards: {
    resources?: Partial<Record<ResourceKey, RewardRange>>;
    xp?: RewardRange;
    energy?: RewardRange;
    rareItems?: Array<{
      item: SpecialItemKey;
      chance: number;
    }>;
  };
};

export type ActiveActivity = {
  activityId: ActivityId;
  startedAt: number;
  endsAt: number;
};
