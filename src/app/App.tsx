import { useState } from 'react';
import { useGame } from './gameProvider.tsx';
import { DashboardScreen } from '../ui/screens/DashboardScreen.tsx';
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
import { getLeader } from '../game/systems/colonySystem.ts';
import { getPendingMissionCount } from '../game/systems/missionSystem.ts';
import shieldCrest from '../ui/art/ui_shield.png';

type ScreenId =
  | 'dashboard'
  | 'world'
  | 'colony'
  | 'activities'
  | 'expedition'
  | 'upgrades'
  | 'missions'
  | 'inventory'
  | 'settings';

const tabs: Array<{ id: ScreenId; label: string; icon: GameIconName }> = [
  { id: 'dashboard', label: 'Início', icon: 'home' },
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
  const [screen, setScreen] = useState<ScreenId>('dashboard');
  const { state, rewardNotice, toast, completeOnboarding, dismissRewardNotice, dismissToast } =
    useGame();
  const pendingMissions = getPendingMissionCount(state);

  if (!state.onboarded) {
    return <StarterScreen onConfirm={completeOnboarding} />;
  }

  return (
    <div className="app-frame">
      <aside className="side-nav">
        <div className="nav-crest" aria-hidden="true">
          <img src={shieldCrest} alt="" width={34} height={81} />
        </div>
        <div className="nav-divider" aria-hidden="true" />
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
            <div>
              <p className="eyebrow">Reino de Pawlands</p>
              <h1>Cat Colony Idle</h1>
            </div>
            <div className="level-pill">
              <GameIcon name="level" />
              <span>Nv. {getLeader(state).level}</span>
            </div>
          </div>
        </header>

        <div className="app-shell">
          <main className="app-main">
            {screen === 'dashboard' && <DashboardScreen />}
            {screen === 'world' && <WorldScreen goTo={setScreen} />}
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

      {toast ? (
        <div className="toast" role="status">
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
