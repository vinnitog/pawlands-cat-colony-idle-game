export type MissionId =
  | 'completeFirstActivity'
  | 'collectFish10'
  | 'captureMice10'
  | 'saveCoins100'
  | 'upgradeCardboard2'
  | 'reachCatLevel3';

export type MissionCondition =
  | { kind: 'activitiesCompleted'; target: number }
  | { kind: 'resourceEarned'; resource: 'fish' | 'mice'; target: number }
  | { kind: 'resourceCurrent'; resource: 'coins'; target: number }
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
};
