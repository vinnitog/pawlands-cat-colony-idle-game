export type CatStats = {
  attack: number;
  defense: number;
  hunting: number;
  fishing: number;
  luck: number;
};

export type Cat = {
  id: string;
  name: string;
  level: number;
  xp: number;
  energy: number;
  maxEnergy: number;
  stats: CatStats;
};
