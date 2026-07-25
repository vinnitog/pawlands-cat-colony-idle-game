import { missions } from '../data/missions.ts';
import { upgrades } from '../data/upgrades.ts';
import type { GameState } from '../models/save.ts';

export type CurrentChronicleProgress = {
  allMissionsClaimed: boolean;
  allUpgradesMaxed: boolean;
  complete: boolean;
};

export function getCurrentChronicleProgress(state: GameState): CurrentChronicleProgress {
  const allMissionsClaimed = missions.every((mission) => state.missions[mission.id].claimed);
  const allUpgradesMaxed = upgrades.every(
    (upgrade) => state.upgrades[upgrade.id].level >= upgrade.maxLevel,
  );

  return {
    allMissionsClaimed,
    allUpgradesMaxed,
    complete: allMissionsClaimed && allUpgradesMaxed,
  };
}
