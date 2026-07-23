import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ActivityId } from '../game/models/activity.ts';
import type { CatClass } from '../game/models/catClass.ts';
import type { MissionId } from '../game/models/missions.ts';
import type { RewardBundle } from '../game/models/resources.ts';
import type { GameState } from '../game/models/save.ts';
import type { UpgradeId } from '../game/models/upgrades.ts';
import type { ShopItemId } from '../game/models/shop.ts';
import { createInitialGameState } from '../game/data/initialGameState.ts';
import { shopItemById } from '../game/data/shop.ts';
import { applyStarterChoice } from '../game/systems/onboardingSystem.ts';
import { buyShopItem as buyShopItemInState } from '../game/systems/shopSystem.ts';
import { completeCurrentActivity, startActivity as startActivityInState } from '../game/systems/activitySystem.ts';
import { claimMission as claimMissionInState } from '../game/systems/missionSystem.ts';
import { processOfflineProgress } from '../game/systems/offlineSystem.ts';
import { buyUpgrade as buyUpgradeInState } from '../game/systems/upgradeSystem.ts';
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
  startActivity(activityId: ActivityId): void;
  buyUpgrade(upgradeId: UpgradeId): void;
  claimMission(missionId: MissionId): void;
  buyShopItem(itemId: ShopItemId): void;
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
    if (!state.activeActivity) return undefined;

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      let notice: RewardNotice | null = null;

      setState((current) => {
        if (!current.activeActivity || current.activeActivity.endsAt > now) {
          return current;
        }

        const completion = completeCurrentActivity(current, now);
        if (!completion.completed) return current;
        saveGame(completion.state, undefined, now);

        notice = {
          title: 'Atividade concluída',
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
  }, [state.activeActivity]);

  const startActivity = useCallback((activityId: ActivityId) => {
    setState((current) => {
      const result = startActivityInState(current, activityId, Date.now());
      if (!result.ok) {
        setToast(result.reason);
        return current;
      }

      saveGame(result.state);
      setToast('Atividade iniciada.');
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
      buyUpgrade,
      claimMission,
      buyShopItem,
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
      completeOnboarding,
      rewardNotice,
      resetGame,
      setWorldPosition,
      startActivity,
      state,
      toast,
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
