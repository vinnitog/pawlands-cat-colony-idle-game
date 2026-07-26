import type { GameState } from '../game/models/save.ts';

export type GameFeelEffectKind = 'levelUp' | 'energyRegen' | 'teleport';
export type TeleportDirection = 'depart' | 'return';

export type GameFeelCue = {
  kind: GameFeelEffectKind;
  direction?: TeleportDirection;
  catId: string;
  catName: string;
  amount?: number;
};

export type GameFeelEffect = GameFeelCue & {
  id: number;
};

export const GAME_FEEL_DURATION_MS: Record<GameFeelEffectKind, number> = {
  levelUp: 900,
  energyRegen: 600,
  teleport: 800,
};

const GAME_FEEL_PRIORITY: Record<GameFeelEffectKind, number> = {
  teleport: 3,
  levelUp: 2,
  energyRegen: 1,
};

const MAX_GAME_FEEL_QUEUE = 4;

function sortByPriority(effects: GameFeelEffect[]): GameFeelEffect[] {
  return [...effects].sort(
    (left, right) =>
      GAME_FEEL_PRIORITY[right.kind] - GAME_FEEL_PRIORITY[left.kind] || left.id - right.id,
  );
}

export function enqueueGameFeelEffects(
  current: GameFeelEffect[],
  incoming: GameFeelEffect[],
): GameFeelEffect[] {
  if (incoming.length === 0) return current;
  if (current.length === 0) {
    return sortByPriority(incoming).slice(0, MAX_GAME_FEEL_QUEUE);
  }

  const [active, ...pending] = current;
  return [active, ...sortByPriority([...pending, ...incoming]).slice(0, MAX_GAME_FEEL_QUEUE - 1)];
}

export function detectGameFeelCues(previous: GameState, current: GameState): GameFeelCue[] {
  const previousCats = new Map(previous.cats.map((cat) => [cat.id, cat]));
  const cues: GameFeelCue[] = [];

  for (const cat of current.cats) {
    const previousCat = previousCats.get(cat.id);
    if (!previousCat) continue;

    if (!previousCat.expedition && cat.expedition) {
      cues.push({
        kind: 'teleport',
        direction: 'depart',
        catId: cat.id,
        catName: cat.name,
      });
    } else if (previousCat.expedition && !cat.expedition) {
      cues.push({
        kind: 'teleport',
        direction: 'return',
        catId: cat.id,
        catName: cat.name,
      });
    }

    const levelsGained = Math.max(0, cat.level - previousCat.level);
    const energyGained = Math.max(0, cat.energy - previousCat.energy);
    if (levelsGained > 0) {
      cues.push({
        kind: 'levelUp',
        catId: cat.id,
        catName: cat.name,
        amount: levelsGained,
      });
    } else if (energyGained > 0) {
      // Level-up already communicates its own energy refill, avoiding stacked noise.
      cues.push({
        kind: 'energyRegen',
        catId: cat.id,
        catName: cat.name,
        amount: energyGained,
      });
    }
  }

  return cues;
}
