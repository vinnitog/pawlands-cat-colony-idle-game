import { gearById, gearTierLabels } from '../../game/data/gear.ts';
import type { GearId } from '../../game/models/gear.ts';
import { GameIcon } from './GameIcon.tsx';

type GearArtProps = {
  gearId: GearId;
  className?: string;
};

export function GearArt({ gearId, className = '' }: GearArtProps) {
  const item = gearById[gearId];

  return (
    <span
      className={`gear-art gear-art--${item.tier} ${className}`.trim()}
      title={`${item.name}, ${gearTierLabels[item.tier]}, ${item.power > 0 ? `+${item.power} poder` : 'sem poder'}`}
    >
      {item.visual.kind === 'image' ? (
        <img src={`${import.meta.env.BASE_URL}${item.visual.src}`} alt="" loading="lazy" />
      ) : (
        <GameIcon name={item.visual.name} />
      )}
      {item.tier === 'rare' ? (
        <span className="gear-art-mark" aria-hidden="true">★</span>
      ) : null}
    </span>
  );
}
