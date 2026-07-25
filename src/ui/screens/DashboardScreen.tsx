import { activityById } from '../../game/data/activities.ts';
import { expeditionZoneById } from '../../game/data/zones.ts';
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
  const activeExpedition = leader.expedition
    ? expeditionZoneById[leader.expedition.zoneId]
    : null;
  const remainingMs = getRemainingActivityMs(state, now);
  const progressPercent = leader.activity
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((now - leader.activity.startedAt) /
              (leader.activity.endsAt - leader.activity.startedAt)) *
              100,
          ),
        ),
      )
    : 0;

  return (
    <div className="screen-stack">
      <CatStatus cat={leader} />
      <ResourceBar resources={state.resources} />

      <section className="panel activity-current-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Atividade atual</p>
            <h2>
              {activeActivity
                ? activeActivity.name
                : activeExpedition
                  ? `${leader.name} está em expedição`
                  : `${leader.name} está disponível`}
            </h2>
          </div>
          <strong>
            {activeActivity ? formatDuration(remainingMs) : activeExpedition ? 'Expedição' : 'Livre'}
          </strong>
        </div>
        <p className="muted-text">
          {activeActivity
            ? activeActivity.description
            : activeExpedition
              ? `Caçando em ${activeExpedition.name}. O saque acumula até você coletá-lo no Portão do Além.`
              : 'Escolha uma atividade para continuar juntando recursos e expandir a colônia.'}
        </p>

        {activeActivity ? (
          <div className="meter" aria-label={`Progresso: ${progressPercent}%`}>
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
