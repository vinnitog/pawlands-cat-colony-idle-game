import { useState } from 'react';
import { useGame } from './gameProvider.tsx';
import { DashboardScreen } from '../ui/screens/DashboardScreen.tsx';
import { ActivitiesScreen } from '../ui/screens/ActivitiesScreen.tsx';
import { UpgradesScreen } from '../ui/screens/UpgradesScreen.tsx';
import { MissionsScreen } from '../ui/screens/MissionsScreen.tsx';
import { InventoryScreen } from '../ui/screens/InventoryScreen.tsx';
import { SettingsScreen } from '../ui/screens/SettingsScreen.tsx';
import { OfflineRewardsModal } from '../ui/components/OfflineRewardsModal.tsx';
import { getPendingMissionCount } from '../game/systems/missionSystem.ts';

type ScreenId = 'dashboard' | 'activities' | 'upgrades' | 'missions' | 'inventory' | 'settings';

const tabs: Array<{ id: ScreenId; label: string }> = [
  { id: 'dashboard', label: 'Início' },
  { id: 'activities', label: 'Atividades' },
  { id: 'upgrades', label: 'Melhorias' },
  { id: 'missions', label: 'Missões' },
  { id: 'inventory', label: 'Inventário' },
  { id: 'settings', label: 'Ajustes' },
];

export function App() {
  const [screen, setScreen] = useState<ScreenId>('dashboard');
  const { state, rewardNotice, toast, dismissRewardNotice, dismissToast } = useGame();
  const pendingMissions = getPendingMissionCount(state);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Pawlands</p>
          <h1>Cat Colony Idle</h1>
        </div>
        <div className="level-pill">Nv. {state.cat.level}</div>
      </header>

      <main className="app-main">
        {screen === 'dashboard' && <DashboardScreen goTo={setScreen} />}
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
