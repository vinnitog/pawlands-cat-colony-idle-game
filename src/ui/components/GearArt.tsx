import { gearById, gearTierLabels } from '../../game/data/gear.ts';
import type { GearId } from '../../game/models/gear.ts';

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
      <img src={`${import.meta.env.BASE_URL}${item.art}`} alt="" loading="lazy" />
      {item.tier === 'rare' ? (
        <span className="gear-art-mark" aria-hidden="true">★</span>
      ) : null}
    </span>
  );
}
