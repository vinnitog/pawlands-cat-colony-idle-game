import { activityById } from '../../game/data/activities.ts';
import { getRemainingActivityMs } from '../../game/systems/activitySystem.ts';
import { useGame } from '../../app/gameProvider.tsx';
import { CatStatus } from '../components/CatStatus.tsx';
import { ResourceBar } from '../components/ResourceBar.tsx';
import { GameIcon } from '../components/GameIcon.tsx';
import { formatDuration } from '../formatters.ts';
import { useNow } from '../useNow.ts';

type DashboardScreenProps = {
  goTo(screen: 'activities' | 'upgrades' | 'missions' | 'inventory'): void;
};

export function DashboardScreen({ goTo }: DashboardScreenProps) {
  const { state } = useGame();
  const now = useNow();
  const activeActivity = state.activeActivity ? activityById[state.activeActivity.activityId] : null;
  const remainingMs = getRemainingActivityMs(state, now);

  return (
    <div className="screen-stack">
      <CatStatus cat={state.cat} />
      <ResourceBar resources={state.resources} />

      <section className="panel activity-current-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Atividade atual</p>
            <h2>{activeActivity ? activeActivity.name : 'Milo está disponível'}</h2>
          </div>
          <strong>{activeActivity ? formatDuration(remainingMs) : 'Livre'}</strong>
        </div>
        <p className="muted-text">
          {activeActivity
            ? activeActivity.description
            : 'Escolha uma atividade para continuar juntando recursos e expandir a colônia.'}
        </p>
      </section>

      <section className="quick-grid" aria-label="Ações rápidas">
        <button type="button" onClick={() => goTo('activities')}>
          <GameIcon name="exploreYard" />
          <span>Atividades</span>
        </button>
        <button type="button" onClick={() => goTo('upgrades')}>
          <GameIcon name="upgrades" />
          <span>Melhorias</span>
        </button>
        <button type="button" onClick={() => goTo('missions')}>
          <GameIcon name="missions" />
          <span>Missões</span>
        </button>
        <button type="button" onClick={() => goTo('inventory')}>
          <GameIcon name="inventory" />
          <span>Inventário</span>
        </button>
      </section>
    </div>
  );
}
