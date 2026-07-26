import { useEffect, type CSSProperties } from 'react';
import {
  GAME_FEEL_DURATION_MS,
  type GameFeelEffect,
} from '../gameFeel.ts';

type GameFeelEffectLayerProps = {
  effect: GameFeelEffect;
  onComplete(): void;
  placement?: 'viewport' | 'crest';
};

function getEffectLabel(effect: GameFeelEffect): string {
  if (effect.kind === 'levelUp') return `LEVEL UP · ${effect.catName}`;
  if (effect.kind === 'energyRegen') return `ENERGY +${effect.amount ?? ''} · ${effect.catName}`;
  return `BLINKING · ${effect.catName}`;
}

function LevelUpEffect() {
  return (
    <svg className="game-feel-svg" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="level-up-glow">
          <stop offset="0" stopColor="#fff9bb" stopOpacity="0.9" />
          <stop offset="0.44" stopColor="#ffd84e" stopOpacity="0.52" />
          <stop offset="1" stopColor="#f2a300" stopOpacity="0" />
        </radialGradient>
        <filter id="level-up-blur">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <circle className="game-feel-halo" cx="120" cy="120" r="92" fill="url(#level-up-glow)" />
      <g className="game-feel-level-rings" fill="none" strokeLinecap="round">
        <circle cx="120" cy="120" r="58" />
        <circle cx="120" cy="120" r="76" />
        <circle cx="120" cy="120" r="91" />
      </g>
      <g className="game-feel-level-rays">
        {Array.from({ length: 12 }, (_, index) => (
          <line key={index} x1="120" y1="18" x2="120" y2="39" transform={`rotate(${index * 30} 120 120)`} />
        ))}
      </g>
      <path className="game-feel-level-spark" d="m120 69 9 28 28 9-28 9-9 28-9-28-28-9 28-9Z" />
    </svg>
  );
}

function EnergyRegenEffect() {
  return (
    <svg className="game-feel-svg" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="energy-glow">
          <stop offset="0" stopColor="#d8ffb8" stopOpacity="0.92" />
          <stop offset="0.5" stopColor="#50e5bf" stopOpacity="0.34" />
          <stop offset="1" stopColor="#36bfc1" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse className="game-feel-energy-halo" cx="120" cy="148" rx="93" ry="44" fill="url(#energy-glow)" />
      <g className="game-feel-energy-rings" fill="none">
        <ellipse cx="120" cy="151" rx="78" ry="29" />
        <ellipse cx="120" cy="151" rx="56" ry="19" />
      </g>
      <g className="game-feel-energy-particles">
        <circle cx="74" cy="111" r="4" />
        <circle cx="99" cy="91" r="3" />
        <circle cx="145" cy="98" r="5" />
        <circle cx="169" cy="119" r="3" />
      </g>
      <path className="game-feel-energy-plus" d="M111 73h18v24h24v18h-24v24h-18v-24H87V97h24Z" />
    </svg>
  );
}

function TeleportEffect() {
  return (
    <svg className="game-feel-svg" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="teleport-core">
          <stop offset="0" stopColor="#f1fdff" stopOpacity="0.98" />
          <stop offset="0.3" stopColor="#6ee7ff" stopOpacity="0.8" />
          <stop offset="0.72" stopColor="#2876e8" stopOpacity="0.3" />
          <stop offset="1" stopColor="#172f9f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle className="game-feel-teleport-core" cx="120" cy="120" r="91" fill="url(#teleport-core)" />
      <g className="game-feel-teleport-vortex" fill="none" strokeLinecap="round">
        <ellipse cx="120" cy="120" rx="79" ry="43" transform="rotate(-23 120 120)" />
        <ellipse cx="120" cy="120" rx="64" ry="79" transform="rotate(31 120 120)" />
        <ellipse cx="120" cy="120" rx="42" ry="63" transform="rotate(75 120 120)" />
      </g>
      <circle className="game-feel-teleport-point" cx="120" cy="120" r="12" />
    </svg>
  );
}

export function GameFeelEffectLayer({
  effect,
  onComplete,
  placement = 'viewport',
}: GameFeelEffectLayerProps) {
  const label = getEffectLabel(effect);
  useEffect(() => {
    const timeoutId = window.setTimeout(
      onComplete,
      GAME_FEEL_DURATION_MS[effect.kind] + 100,
    );
    return () => window.clearTimeout(timeoutId);
  }, [effect.id, effect.kind, onComplete]);

  return (
    <div
      className={`game-feel-effect game-feel-effect--${effect.kind}${
        effect.direction ? ` game-feel-effect--${effect.direction}` : ''
      } game-feel-effect--${placement}`}
      style={
        {
          '--game-feel-duration': `${GAME_FEEL_DURATION_MS[effect.kind]}ms`,
        } as CSSProperties
      }
      role="status"
      aria-label={label}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) onComplete();
      }}
    >
      {effect.kind === 'levelUp' ? <LevelUpEffect /> : null}
      {effect.kind === 'energyRegen' ? <EnergyRegenEffect /> : null}
      {effect.kind === 'teleport' ? <TeleportEffect /> : null}
      {placement === 'crest' ? (
        <strong className="game-feel-label" aria-hidden="true">
          {label}
        </strong>
      ) : null}
    </div>
  );
}
