export type MissionId =
  | 'completeFirstActivity'
  | 'collectFish10'
  | 'captureMice10'
  | 'saveCoins100'
  | 'upgradeCardboard2'
  | 'reachCatLevel3'
  | 'collectGems3'
  | 'reachActivities10'
  | 'captureMice25'
  | 'collectFish25'
  | 'jewelerGems5'
  | 'crownTribute250'
  | 'reachCatLevel5';

export type MissionCondition =
  | { kind: 'activitiesCompleted'; target: number }
  | { kind: 'resourceEarned'; resource: 'fish' | 'mice' | 'gems'; target: number }
  | { kind: 'resourceCurrent'; resource: 'coins' | 'gems'; target: number }
  | { kind: 'upgradeLevel'; upgradeId: 'cardboardBox'; target: number }
  | { kind: 'catLevel'; target: number };

export type MissionState = {
  id: MissionId;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
};

export type MissionDefinition = {
  id: MissionId;
  title: string;
  description: string;
  condition: MissionCondition;
  reward: {
    coins: number;
    xp: number;
    gems?: number;
  };
  /** Short name of the NPC who asks for this quest, shown on the mission card. */
  giver?: string;
};
