import { useEffect, useRef, useState } from 'react';
import { useGame } from './gameProvider.tsx';
import { WorldScreen } from '../ui/screens/WorldScreen.tsx';
import { ColonyScreen } from '../ui/screens/ColonyScreen.tsx';
import { ActivitiesScreen } from '../ui/screens/ActivitiesScreen.tsx';
import { ExpeditionScreen } from '../ui/screens/ExpeditionScreen.tsx';
import { UpgradesScreen } from '../ui/screens/UpgradesScreen.tsx';
import { MissionsScreen } from '../ui/screens/MissionsScreen.tsx';
import { InventoryScreen } from '../ui/screens/InventoryScreen.tsx';
import { SettingsScreen } from '../ui/screens/SettingsScreen.tsx';
import { OfflineRewardsModal } from '../ui/components/OfflineRewardsModal.tsx';
import { StarterScreen } from '../ui/screens/StarterScreen.tsx';
import { GameIcon, type GameIconName } from '../ui/components/GameIcon.tsx';
import { GameFeelEffectLayer } from '../ui/components/GameFeelEffectLayer.tsx';
import { GlobalActivityStatus } from '../ui/components/GlobalActivityStatus.tsx';
import { getLeader } from '../game/systems/colonySystem.ts';
import { getPendingMissionCount } from '../game/systems/missionSystem.ts';
import { useNow } from '../ui/useNow.ts';
import shieldCrest from '../ui/art/ui_shield.png';

const TOAST_AUTO_DISMISS_MS = 5_000;

type ScreenId =
  | 'world'
  | 'colony'
  | 'activities'
  | 'expedition'
  | 'upgrades'
  | 'missions'
  | 'inventory'
  | 'settings';

const tabs: Array<{ id: ScreenId; label: string; icon: GameIconName }> = [
  { id: 'world', label: 'Grimalkin', icon: 'world' },
  { id: 'colony', label: 'Colônia', icon: 'colony' },
  { id: 'activities', label: 'Atividades', icon: 'exploreYard' },
  { id: 'expedition', label: 'Além', icon: 'expedition' },
  { id: 'upgrades', label: 'Melhorias', icon: 'upgrades' },
  { id: 'missions', label: 'Missões', icon: 'missions' },
  { id: 'inventory', label: 'Inventário', icon: 'inventory' },
  { id: 'settings', label: 'Ajustes', icon: 'settings' },
];

export function App() {
  const [screen, setScreen] = useState<ScreenId>('world');
  const now = useNow();
  const {
    state,
    rewardNotice,
    gameFeelEffect,
    toast,
    toastRevision,
    completeOnboarding,
    dismissRewardNotice,
    dismissGameFeelEffect,
    dismissToast,
  } = useGame();
  const pendingMissions = getPendingMissionCount(state);
  const dismissToastRef = useRef(dismissToast);

  useEffect(() => {
    dismissToastRef.current = dismissToast;
  }, [dismissToast]);

  useEffect(() => {
    if (!toast || rewardNotice) return undefined;

    const timeoutId = window.setTimeout(() => {
      dismissToastRef.current();
    }, TOAST_AUTO_DISMISS_MS);

    return () => window.clearTimeout(timeoutId);
  }, [rewardNotice, toast, toastRevision]);

  if (!state.onboarded) {
    return <StarterScreen onConfirm={completeOnboarding} />;
  }

  return (
    <div className="app-frame">
      <aside className="side-nav">
        <div className="nav-crest">
          <img src={shieldCrest} alt="" width={34} height={81} />
          {gameFeelEffect && !rewardNotice && screen !== 'world' ? (
            <GameFeelEffectLayer
              key={gameFeelEffect.id}
              effect={gameFeelEffect}
              onComplete={dismissGameFeelEffect}
              placement="crest"
            />
          ) : null}
        </div>
        <nav className="nav-items" aria-label="Navegação principal">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={screen === tab.id ? 'active' : ''}
              type="button"
              aria-current={screen === tab.id ? 'page' : undefined}
              onClick={() => setScreen(tab.id)}
            >
              <GameIcon name={tab.icon} />
              <span>{tab.label}</span>
              {tab.id === 'missions' && pendingMissions > 0 ? (
                <strong>{pendingMissions}</strong>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>

      <div className="app-right">
        <header className="app-header">
          <div className="app-bar">
            <div className="app-title">
              <p className="eyebrow">Reino de Pawlands</p>
              <h1>Cat Colony Idle</h1>
            </div>
            <GlobalActivityStatus state={state} now={now} onNavigate={setScreen} />
            <div className="level-pill">
              <GameIcon name="level" />
              <span>Nv. {getLeader(state).level}</span>
            </div>
          </div>
        </header>

        <div className={`app-shell${screen === 'world' ? ' app-shell--world' : ''}`}>
          <main className="app-main">
            {screen === 'world' && (
              <WorldScreen
                goTo={setScreen}
                gameFeelEffect={!rewardNotice ? gameFeelEffect : null}
                onGameFeelComplete={dismissGameFeelEffect}
              />
            )}
            {screen === 'colony' && <ColonyScreen />}
            {screen === 'activities' && <ActivitiesScreen />}
            {screen === 'expedition' && <ExpeditionScreen />}
            {screen === 'upgrades' && <UpgradesScreen />}
            {screen === 'missions' && <MissionsScreen />}
            {screen === 'inventory' && <InventoryScreen />}
            {screen === 'settings' && <SettingsScreen />}
          </main>
        </div>
      </div>

      {toast && !rewardNotice ? (
        <div key={toastRevision} className="toast" role="status" aria-atomic="true">
          <span>{toast}</span>
          <button type="button" onClick={dismissToast} aria-label="Fechar aviso">
            Fechar
          </button>
        </div>
      ) : null}

      {rewardNotice ? <OfflineRewardsModal notice={rewardNotice} onClose={dismissRewardNotice} /> : null}
    </div>
  );
}
