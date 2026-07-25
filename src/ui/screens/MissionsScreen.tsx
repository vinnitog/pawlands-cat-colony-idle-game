import { missions } from '../../game/data/missions.ts';
import { useGame } from '../../app/gameProvider.tsx';
import { MissionItem } from '../components/MissionItem.tsx';
import { getCurrentChronicleProgress } from '../../game/systems/progressionSystem.ts';
import { GameIcon } from '../components/GameIcon.tsx';

export function MissionsScreen() {
  const { state, claimMission } = useGame();
  const chronicle = getCurrentChronicleProgress(state);

  return (
    <div className="screen-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Guia da jornada</p>
          <h2>Missões</h2>
        </div>
      </div>

      {chronicle.complete ? (
        <section className="chronicle-complete" aria-labelledby="missions-chronicle-title">
          <GameIcon name="reward" />
          <div>
            <p className="eyebrow">Próxima página</p>
            <h3 id="missions-chronicle-title">Crônica atual concluída</h3>
            <p>
              Este capítulo foi concluído. A colônia continua ativa em atividades e
              expedições enquanto novas histórias se abrem.
            </p>
          </div>
        </section>
      ) : null}

      <div className="item-grid">
        {missions.map((mission) => (
          <MissionItem
            key={mission.id}
            missionId={mission.id}
            mission={state.missions[mission.id]}
            onClaim={() => claimMission(mission.id)}
          />
        ))}
      </div>
    </div>
  );
}
