import { expeditionTrophyById } from '../../game/data/trophies.ts';
import type { ExpeditionTrophyKey } from '../../game/models/resources.ts';
import { GameIcon } from './GameIcon.tsx';

type TrophyArtProps = {
  trophyId: ExpeditionTrophyKey;
  className?: string;
};

export function TrophyArt({ trophyId, className = '' }: TrophyArtProps) {
  const trophy = expeditionTrophyById[trophyId];

  return (
    <span
      className={`trophy-art ${className}`.trim()}
      title={`${trophy.name}, valor ${trophy.sellValue} moedas`}
    >
      {trophy.art ? (
        <img src={`${import.meta.env.BASE_URL}${trophy.art}`} alt="" loading="lazy" />
      ) : (
        <GameIcon name={trophyId} />
      )}
    </span>
  );
}
