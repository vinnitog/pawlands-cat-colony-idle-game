import { useState } from 'react';
import { useGame } from './gameProvider.tsx';
import { DashboardScreen } from '../ui/screens/DashboardScreen.tsx';
import { WorldScreen } from '../ui/screens/WorldScreen.tsx';
import { ActivitiesScreen } from '../ui/screens/ActivitiesScreen.tsx';
import { UpgradesScreen } from '../ui/screens/UpgradesScreen.tsx';
import { MissionsScreen } from '../ui/screens/MissionsScreen.tsx';
import { InventoryScreen } from '../ui/screens/InventoryScreen.tsx';
import { SettingsScreen } from '../ui/screens/SettingsScreen.tsx';
import { OfflineRewardsModal } from '../ui/components/OfflineRewardsModal.tsx';
import { StarterScreen } from '../ui/screens/StarterScreen.tsx';
import { GameIcon, type GameIconName } from '../ui/components/GameIcon.tsx';
import { getPendingMissionCount } from '../game/systems/missionSystem.ts';

type ScreenId =
  | 'dashboard'
  | 'world'
  | 'activities'
  | 'upgrades'
  | 'missions'
  | 'inventory'
  | 'settings';

const tabs: Array<{ id: ScreenId; label: string; icon: GameIconName }> = [
  { id: 'dashboard', label: 'Início', icon: 'home' },
  { id: 'world', label: 'Grimalkin', icon: 'world' },
  { id: 'activities', label: 'Atividades', icon: 'exploreYard' },
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
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Reino de Pawlands</p>
          <h1>Cat Colony Idle</h1>
        </div>
        <div className="level-pill">
          <GameIcon name="level" />
          <span>Nv. {state.cat.level}</span>
        </div>
      </header>

      <main className="app-main">
        {screen === 'dashboard' && <DashboardScreen goTo={setScreen} />}
        {screen === 'world' && <WorldScreen goTo={setScreen} />}
        {screen === 'activities' && <ActivitiesScreen />}
        {screen === 'upgrades' && <UpgradesScreen />}
        {screen === 'missions' && <MissionsScreen />}
        {screen === 'inventory' && <InventoryScreen />}
        {screen === 'settings' && <SettingsScreen />}
      </main>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={screen === tab.id ? 'active' : ''}
            type="button"
            onClick={() => setScreen(tab.id)}
          >
            <GameIcon name={tab.icon} />
            <span>{tab.label}</span>
            {tab.id === 'missions' && pendingMissions > 0 ? <strong>{pendingMissions}</strong> : null}
          </button>
        ))}
      </nav>

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
