import { activityById } from '../../game/data/activities.ts';
import { getRemainingActivityMs } from '../../game/systems/activitySystem.ts';
import { getLeader } from '../../game/systems/colonySystem.ts';
import { useGame } from '../../app/gameProvider.tsx';
import { CatStatus } from '../components/CatStatus.tsx';
import { ResourceBar } from '../components/ResourceBar.tsx';
import { formatDuration } from '../formatters.ts';
import { useNow } from '../useNow.ts';

export function DashboardScreen() {
  const { state } = useGame();
  const now = useNow();
  const leader = getLeader(state);
  const activeActivity = leader.activity ? activityById[leader.activity.activityId] : null;
  const remainingMs = getRemainingActivityMs(state, now);

  return (
    <div className="screen-stack">
      <CatStatus cat={leader} />
      <ResourceBar resources={state.resources} />

      <section className="panel activity-current-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Atividade atual</p>
            <h2>{activeActivity ? activeActivity.name : `${leader.name} está disponível`}</h2>
          </div>
          <strong>{activeActivity ? formatDuration(remainingMs) : 'Livre'}</strong>
        </div>
        <p className="muted-text">
          {activeActivity
            ? activeActivity.description
            : 'Escolha uma atividade para continuar juntando recursos e expandir a colônia.'}
        </p>
      </section>
    </div>
  );
}
