import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
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

export type RewardNotice = {
  title: string;
  reward: RewardBundle;
  offlineDurationMs?: number;
  levelsGained: number;
  levelCoins: number;
};

type GameContextValue = {
  state: GameState;
  rewardNotice: RewardNotice | null;
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
  dismissToast(): void;
};

const GameContext = createContext<GameContextValue | null>(null);

function createBootState() {
  const now = Date.now();
  const loaded = loadGame();
  const offline = processOfflineProgress(loaded, now);

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
          }
        : null,
  };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [boot] = useState(createBootState);
  const [state, setState] = useState<GameState>(boot.state);
  const [rewardNotice, setRewardNotice] = useState<RewardNotice | null>(boot.rewardNotice);
  const [toast, setToast] = useState<string | null>(null);

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
      setState((current) => applyEnergyRegen(current, Date.now()));
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const hasBusyCat = state.cats.some((cat) => cat.activity !== null);

  useEffect(() => {
    if (!hasBusyCat) return undefined;

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      let notice: RewardNotice | null = null;

      setState((current) => {
        const completion = completeFinishedActivities(current, now);
        if (completion.completedCount === 0) return current;
        saveGame(completion.state, undefined, now);

        notice = {
          title:
            completion.completedCount > 1
              ? `${completion.completedCount} gatos voltaram`
              : 'Atividade concluída',
          reward: completion.reward,
          levelsGained: completion.levelsGained,
          levelCoins: completion.levelCoins,
        };

        return completion.state;
      });

      if (notice) {
        setRewardNotice(notice);
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [hasBusyCat]);

  const startActivity = useCallback((activityId: ActivityId, options?: StartActivityOptions) => {
    setState((current) => {
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
  }, []);

  const startExpedition = useCallback((catId: string, zoneId: ExpeditionZoneId) => {
    setState((current) => {
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
  }, []);

  const collectExpedition = useCallback((catId: string) => {
    setState((current) => {
      const now = Date.now();
      const catName = current.cats.find((cat) => cat.id === catId)?.name ?? 'Seu gato';
      const result = collectExpeditionInState(current, catId, now);
      if (!result.collected) {
        setToast('Esse gato não está em uma expedição.');
        return current;
      }

      saveGame(result.state, undefined, now);
      if (result.resolvedPulses > 0) {
        setRewardNotice({
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
  }, []);

  const recruitCat = useCallback(() => {
    setState((current) => {
      const result = recruitCatInState(current, Math.random, Date.now());
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      setToast(`${result.cat.name} juntou-se à colônia!`);
      return result.state;
    });
  }, []);

  const setLeader = useCallback((catId: string) => {
    setState((current) => {
      const result = setLeaderInState(current, catId);
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      setToast(`${getLeader(result.state).name} agora lidera a colônia.`);
      return result.state;
    });
  }, []);

  const equipGear = useCallback((catId: string, slot: GearSlot, gearId: GearId) => {
    setState((current) => {
      const result = equipGearInState(current, catId, slot, gearId);
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      setToast(`${gearById[gearId].name} equipado.`);
      return result.state;
    });
  }, []);

  const unequipGear = useCallback((catId: string, slot: GearSlot) => {
    setState((current) => {
      const result = unequipGearInState(current, catId, slot);
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      setToast('Equipamento guardado no inventário.');
      return result.state;
    });
  }, []);

  const buyUpgrade = useCallback((upgradeId: UpgradeId) => {
    setState((current) => {
      const result = buyUpgradeInState(current, upgradeId);
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      setToast('Melhoria comprada.');
      return result.state;
    });
  }, []);

  const claimMission = useCallback((missionId: MissionId) => {
    setState((current) => {
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
  }, []);

  const buyShopItem = useCallback((itemId: ShopItemId) => {
    setState((current) => {
      const result = buyShopItemInState(current, itemId);
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      setToast(`${shopItemById[itemId].name} adquirido.`);
      return result.state;
    });
  }, []);

  const sellTrophy = useCallback((
    trophyId: ExpeditionTrophyKey,
    mode: TrophySaleMode,
  ) => {
    setState((current) => {
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
  }, []);

  const setWorldPosition = useCallback((x: number, y: number) => {
    setState((current) => {
      if (current.world.x === x && current.world.y === y) return current;
      const next = { ...current, world: { x, y } };
      saveGame(next);
      return next;
    });
  }, []);

  const completeOnboarding = useCallback((choice: { name: string; catClass: CatClass }) => {
    setState((current) => {
      const next = applyStarterChoice(current, choice);
      saveGame(next);
      return next;
    });
  }, []);

  const resetGame = useCallback(() => {
    clearGame();
    const nextState = createInitialGameState();
    saveGame(nextState);
    setRewardNotice(null);
    setToast('Progresso reiniciado.');
    setState(nextState);
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      rewardNotice,
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
      dismissRewardNotice: () => setRewardNotice(null),
      dismissToast: () => setToast(null),
    }),
    [
      buyShopItem,
      buyUpgrade,
      claimMission,
      collectExpedition,
      completeOnboarding,
      equipGear,
      recruitCat,
      rewardNotice,
      resetGame,
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
