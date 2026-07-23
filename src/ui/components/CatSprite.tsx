import type { CSSProperties } from 'react';
import type { CatClass } from '../../game/models/catClass.ts';
import manifest from '../sprites/manifest.json';

export type CatAnim = 'idle';

type CatSpriteProps = {
  hero?: CatClass;
  anim?: CatAnim;
  /** Integer pixel-multiplier applied to the source frame. */
  scale?: number;
  label?: string;
  className?: string;
};

// CSS custom properties are not part of React's CSSProperties type.
type SpriteStyle = CSSProperties & Record<`--${string}`, string | number>;

/**
 * Renders one Cute Legends cat from a normalized sprite sheet and plays it with
 * a CSS steps() animation. Sheets are produced by scripts/build_sprites.py and
 * described in src/ui/sprites/manifest.json (frame size + count + fps per hero).
 */
export function CatSprite({
  hero = 'knight',
  anim = 'idle',
  scale = 6,
  label,
  className = '',
}: CatSpriteProps) {
  const meta = manifest.heroes[hero][anim];
  const src = `${import.meta.env.BASE_URL}${meta.src}`;
  const duration = meta.frames / meta.fps;

  const style: SpriteStyle = {
    '--sprite-url': `url("${src}")`,
    '--frame-w': `${meta.frameWidth}px`,
    '--frame-h': `${meta.frameHeight}px`,
    '--frames': meta.frames,
    '--sprite-scale': scale,
    '--sprite-duration': `${duration}s`,
  };

  return (
    <div
      className={`cat-sprite ${className}`.trim()}
      style={style}
      role="img"
      aria-label={label ?? `Gato ${hero}`}
    />
  );
}
