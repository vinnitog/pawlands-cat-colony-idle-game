import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ActivityId } from '../game/models/activity.ts';
import type { CatClass } from '../game/models/catClass.ts';
import type { ExpeditionZoneId } from '../game/models/expedition.ts';
import type { GearId, GearSlot } from '../game/models/gear.ts';
import type { MissionId } from '../game/models/missions.ts';
import type { ExpeditionTrophyKey, RewardBundle } from '../game/models/resources.ts';
import type { GameState } from '../game/models/save.ts';
import type { UpgradeId } from '../game/models/upgrades.ts';
import type { ShopItemId } from '../game/models/shop.ts';
import { createInitialGameState } from '../game/data/initialGameState.ts';
import { gearById } from '../game/data/gear.ts';
import { shopItemById } from '../game/data/shop.ts';
import { applyStarterChoice } from '../game/systems/onboardingSystem.ts';
import { buyShopItem as buyShopItemInState } from '../game/systems/shopSystem.ts';
import {
  completeFinishedActivities,
  startActivity as startActivityInState,
  type ActivityCompletionDetail,
  type StartActivityOptions,
} from '../game/systems/activitySystem.ts';
import {
  getLeader,
  recruitCat as recruitCatInState,
  setLeader as setLeaderInState,
} from '../game/systems/colonySystem.ts';
import { applyEnergyRegen } from '../game/systems/energySystem.ts';
import {
  equipGear as equipGearInState,
  unequipGear as unequipGearInState,
} from '../game/systems/equipmentSystem.ts';
import { claimMission as claimMissionInState } from '../game/systems/missionSystem.ts';
import { processOfflineProgress } from '../game/systems/offlineSystem.ts';
import {
  collectExpedition as collectExpeditionInState,
  startExpedition as startExpeditionInState,
} from '../game/systems/expeditionSystem.ts';
import { buyUpgrade as buyUpgradeInState } from '../game/systems/upgradeSystem.ts';
import {
  sellTrophy as sellTrophyInState,
  type TrophySaleMode,
} from '../game/systems/trophySystem.ts';
import { clearGame, loadGame, saveGame } from '../game/storage/saveManager.ts';
import {
  detectGameFeelCues,
  enqueueGameFeelEffects,
  type GameFeelCue,
  type GameFeelEffect,
} from '../ui/gameFeel.ts';

export type RewardNotice = {
  title: string;
  reward: RewardBundle;
  offlineDurationMs?: number;
  levelsGained: number;
  levelCoins: number;
  activityCompletions?: ActivityCompletionDetail[];
};

type GameContextValue = {
  state: GameState;
  rewardNotice: RewardNotice | null;
  gameFeelEffect: GameFeelEffect | null;
  toast: string | null;
  startActivity(activityId: ActivityId, options?: StartActivityOptions): void;
  startExpedition(catId: string, zoneId: ExpeditionZoneId): void;
  collectExpedition(catId: string): void;
  recruitCat(): void;
  setLeader(catId: string): void;
  equipGear(catId: string, slot: GearSlot, gearId: GearId): void;
  unequipGear(catId: string, slot: GearSlot): void;
  buyUpgrade(upgradeId: UpgradeId): void;
  claimMission(missionId: MissionId): void;
  buyShopItem(itemId: ShopItemId): void;
  sellTrophy(trophyId: ExpeditionTrophyKey, mode: TrophySaleMode): void;
  setWorldPosition(x: number, y: number): void;
  completeOnboarding(choice: { name: string; catClass: CatClass }): void;
  resetGame(): void;
  dismissRewardNotice(): void;
  dismissGameFeelEffect(): void;
  dismissToast(): void;
};

const GameContext = createContext<GameContextValue | null>(null);

function createBootState() {
  const now = Date.now();
  const loaded = loadGame();
  const offline = processOfflineProgress(loaded, now);
  const gameFeelEffects = detectGameFeelCues(loaded, offline.state).map((cue, index) => ({
    ...cue,
    id: index + 1,
  }));

  if (offline.activityCompleted) {
    saveGame(offline.state, undefined, now);
  }

  return {
    state: offline.state,
    rewardNotice:
      offline.reward && offline.activityCompleted
        ? {
            title: 'Enquanto você estava fora',
            reward: offline.reward,
            offlineDurationMs: offline.offlineDurationMs,
            levelsGained: offline.levelsGained,
            levelCoins: offline.levelCoins,
            activityCompletions: offline.completions,
          }
        : null,
    gameFeelEffects,
    nextGameFeelEffectId: gameFeelEffects.length + 1,
  };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [boot] = useState(createBootState);
  const [state, setState] = useState<GameState>(boot.state);
  const stateRef = useRef<GameState>(boot.state);
  const [rewardNotices, setRewardNotices] = useState<RewardNotice[]>(
    boot.rewardNotice ? [boot.rewardNotice] : [],
  );
  const [gameFeelEffects, setGameFeelEffects] = useState<GameFeelEffect[]>(
    boot.gameFeelEffects,
  );
  const [toast, setToast] = useState<string | null>(null);
  const previousStateRef = useRef(state);
  const nextGameFeelEffectIdRef = useRef(boot.nextGameFeelEffectId);
  const suppressNextGameFeelRef = useRef(false);
  const rewardNotice = rewardNotices[0] ?? null;

  /**
   * Runs transitions once against the latest state even when React batches
   * timer and user events. Side effects inside these callbacks are therefore
   * not exposed to StrictMode replays of React functional state updaters.
   */
  const updateState = useCallback((updater: (current: GameState) => GameState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
  }, []);

  const enqueueRewardNotice = useCallback((notice: RewardNotice) => {
    setRewardNotices((current) => [...current, notice]);
  }, []);

  const queueGameFeelCues = useCallback((cues: GameFeelCue[]) => {
    if (cues.length === 0) return;
    const effects = cues.map((cue) => ({
      ...cue,
      id: nextGameFeelEffectIdRef.current++,
    }));
    setGameFeelEffects((current) => enqueueGameFeelEffects(current, effects));
  }, []);

  const dismissGameFeelEffect = useCallback(() => {
    setGameFeelEffects((current) => current.slice(1));
  }, []);

  useEffect(() => {
    const previous = previousStateRef.current;
    previousStateRef.current = state;

    if (suppressNextGameFeelRef.current) {
      suppressNextGameFeelRef.current = false;
      return;
    }

    queueGameFeelCues(detectGameFeelCues(previous, state));
  }, [queueGameFeelCues, state]);

  useEffect(() => {
    saveGame(state);
  }, [state]);

  useEffect(() => {
    const saveOnHide = () => {
      if (document.visibilityState === 'hidden') {
        saveGame(state);
      }
    };

    document.addEventListener('visibilitychange', saveOnHide);
    return () => document.removeEventListener('visibilitychange', saveOnHide);
  }, [state]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      // Same-reference return means nothing regenerated — React skips the update.
      updateState((current) => applyEnergyRegen(current, Date.now()));
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [updateState]);

  const hasBusyCat = state.cats.some((cat) => cat.activity !== null);

  useEffect(() => {
    if (!hasBusyCat) return undefined;

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      updateState((current) => {
        const completion = completeFinishedActivities(current, now);
        if (completion.completedCount === 0) return current;

        saveGame(completion.state, undefined, now);
        enqueueRewardNotice({
          title:
            completion.completedCount > 1
              ? `${completion.completedCount} atividades concluídas`
              : `${completion.completions[0]?.catName ?? 'Seu gato'} concluiu ${
                  completion.completions[0]?.activityName ?? 'uma atividade'
                }`,
          reward: completion.reward,
          levelsGained: completion.levelsGained,
          levelCoins: completion.levelCoins,
          activityCompletions: completion.completions,
        });
        return completion.state;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [enqueueRewardNotice, hasBusyCat, updateState]);

  const startActivity = useCallback((activityId: ActivityId, options?: StartActivityOptions) => {
    updateState((current) => {
      const result = startActivityInState(current, activityId, Date.now(), options);
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      const actorName = options?.catId
        ? result.state.cats.find((cat) => cat.id === options.catId)?.name
        : getLeader(result.state).name;
      setToast(
        options?.atLake
          ? 'Pescaria no lago — pesca reforçada!'
          : `${actorName ?? 'Seu gato'} começou a atividade.`,
      );
      return result.state;
    });
  }, [updateState]);

  const startExpedition = useCallback((catId: string, zoneId: ExpeditionZoneId) => {
    updateState((current) => {
      const now = Date.now();
      const result = startExpeditionInState(current, catId, zoneId, now);
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      const replacement =
        current.leaderId === catId
          ? result.state.cats.find(
              (candidate) =>
                candidate.id !== catId && !candidate.activity && !candidate.expedition,
            )
          : undefined;
      const nextState = replacement
        ? setLeaderInState(result.state, replacement.id).state
        : result.state;

      saveGame(nextState, undefined, now);
      const cat = nextState.cats.find((candidate) => candidate.id === catId);
      setToast(`${cat?.name ?? 'Seu gato'} atravessou o Portão do Além.`);
      return nextState;
    });
  }, [updateState]);

  const collectExpedition = useCallback((catId: string) => {
    updateState((current) => {
      const now = Date.now();
      const catName = current.cats.find((cat) => cat.id === catId)?.name ?? 'Seu gato';
      const result = collectExpeditionInState(current, catId, now);
      if (!result.collected) {
        setToast('Esse gato não está em uma expedição.');
        return current;
      }

      saveGame(result.state, undefined, now);
      if (result.resolvedPulses > 0) {
        enqueueRewardNotice({
          title: `${catName} voltou do Além`,
          reward: result.reward,
          levelsGained: result.levelsGained,
          levelCoins: result.levelCoins,
        });
      } else {
        setToast(`${catName} voltou. O progresso parcial foi preservado.`);
      }
      return result.state;
    });
  }, [enqueueRewardNotice, updateState]);

  const recruitCat = useCallback(() => {
    updateState((current) => {
      const result = recruitCatInState(current, Math.random, Date.now());
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      setToast(`${result.cat.name} juntou-se à colônia!`);
      return result.state;
    });
  }, [updateState]);

  const setLeader = useCallback((catId: string) => {
    updateState((current) => {
      const result = setLeaderInState(current, catId);
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      setToast(`${getLeader(result.state).name} agora lidera a colônia.`);
      return result.state;
    });
  }, [updateState]);

  const equipGear = useCallback((catId: string, slot: GearSlot, gearId: GearId) => {
    updateState((current) => {
      const result = equipGearInState(current, catId, slot, gearId);
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      setToast(`${gearById[gearId].name} equipado.`);
      return result.state;
    });
  }, [updateState]);

  const unequipGear = useCallback((catId: string, slot: GearSlot) => {
    updateState((current) => {
      const result = unequipGearInState(current, catId, slot);
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      setToast('Equipamento guardado no inventário.');
      return result.state;
    });
  }, [updateState]);

  const buyUpgrade = useCallback((upgradeId: UpgradeId) => {
    updateState((current) => {
      const result = buyUpgradeInState(current, upgradeId);
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      setToast('Melhoria comprada.');
      return result.state;
    });
  }, [updateState]);

  const claimMission = useCallback((missionId: MissionId) => {
    updateState((current) => {
      const result = claimMissionInState(current, missionId);
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      const gemText = result.gems > 0 ? `, +${result.gems} gemas` : '';
      setToast(`Missão concluída: +${result.coins} moedas, +${result.xp} XP${gemText}.`);
      return result.state;
    });
  }, [updateState]);

  const buyShopItem = useCallback((itemId: ShopItemId) => {
    updateState((current) => {
      const result = buyShopItemInState(current, itemId);
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      setToast(`${shopItemById[itemId].name} adquirido.`);
      return result.state;
    });
  }, [updateState]);

  const sellTrophy = useCallback((
    trophyId: ExpeditionTrophyKey,
    mode: TrophySaleMode,
  ) => {
    updateState((current) => {
      const result = sellTrophyInState(current, trophyId, mode);
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      setToast(
        `${result.quantity} ${result.quantity === 1 ? 'troféu vendido' : 'troféus vendidos'} por ${result.coins} moedas.`,
      );
      return result.state;
    });
  }, [updateState]);

  const setWorldPosition = useCallback((x: number, y: number) => {
    updateState((current) => {
      if (current.world.x === x && current.world.y === y) return current;
      const next = { ...current, world: { x, y } };
      saveGame(next);
      return next;
    });
  }, [updateState]);

  const completeOnboarding = useCallback((choice: { name: string; catClass: CatClass }) => {
    updateState((current) => {
      const next = applyStarterChoice(current, choice);
      saveGame(next);
      return next;
    });
  }, [updateState]);

  const resetGame = useCallback(() => {
    clearGame();
    const nextState = createInitialGameState();
    saveGame(nextState);
    suppressNextGameFeelRef.current = true;
    setGameFeelEffects([]);
    setRewardNotices([]);
    setToast('Progresso reiniciado.');
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      rewardNotice,
      gameFeelEffect: gameFeelEffects[0] ?? null,
      toast,
      startActivity,
      startExpedition,
      collectExpedition,
      recruitCat,
      setLeader,
      equipGear,
      unequipGear,
      buyUpgrade,
      claimMission,
      buyShopItem,
      sellTrophy,
      setWorldPosition,
      completeOnboarding,
      resetGame,
      dismissRewardNotice: () => setRewardNotices((current) => current.slice(1)),
      dismissGameFeelEffect,
      dismissToast: () => setToast(null),
    }),
    [
      buyShopItem,
      buyUpgrade,
      claimMission,
      collectExpedition,
      completeOnboarding,
      enqueueRewardNotice,
      equipGear,
      gameFeelEffects,
      recruitCat,
      rewardNotice,
      resetGame,
      dismissGameFeelEffect,
      sellTrophy,
      setLeader,
      setWorldPosition,
      startActivity,
      startExpedition,
      state,
      toast,
      unequipGear,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame deve ser usado dentro de GameProvider.');
  }

  return context;
}
