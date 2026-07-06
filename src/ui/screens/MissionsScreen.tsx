import { missions } from '../../game/data/missions.ts';
import { useGame } from '../../app/gameProvider.tsx';
import { MissionItem } from '../components/MissionItem.tsx';

export function MissionsScreen() {
  const { state, claimMission } = useGame();

  return (
    <div className="screen-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Guia da jornada</p>
          <h2>Missões</h2>
        </div>
      </div>

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
