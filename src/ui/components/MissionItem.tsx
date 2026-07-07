import { missionById } from '../../game/data/missions.ts';
import type { MissionId, MissionState } from '../../game/models/missions.ts';
import { GameIcon } from './GameIcon.tsx';

type MissionItemProps = {
  missionId: MissionId;
  mission: MissionState;
  onClaim(): void;
};

export function MissionItem({ missionId, mission, onClaim }: MissionItemProps) {
  const definition = missionById[missionId];
  const progressPercent = Math.min(100, Math.floor((mission.progress / mission.target) * 100));

  return (
    <article className={`item-card mission-card ${mission.completed ? 'mission-card--complete' : ''}`}>
      <div className="item-card-header">
        <div>
          <h3>{definition.title}</h3>
          <p>{definition.description}</p>
        </div>
        <span>{mission.claimed ? 'OK' : `${mission.progress}/${mission.target}`}</span>
      </div>

      <div className="meter">
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <p className="cost-line">
        <GameIcon name="reward" />
        +{definition.reward.coins} moedas, +{definition.reward.xp} XP
      </p>

      <button className="primary-action" type="button" disabled={!mission.completed || mission.claimed} onClick={onClaim}>
        {mission.claimed ? 'Coletada' : mission.completed ? 'Coletar' : 'Em progresso'}
      </button>
    </article>
  );
}
