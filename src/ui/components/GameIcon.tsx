import type { ActivityId } from '../../game/models/activity.ts';
import type { InventoryItemKey, ResourceKey } from '../../game/models/resources.ts';

export type GameIconName =
  | ResourceKey
  | InventoryItemKey
  | ActivityId
  | 'home'
  | 'world'
  | 'colony'
  | 'expedition'
  | 'shield'
  | 'upgrades'
  | 'missions'
  | 'inventory'
  | 'settings'
  | 'energy'
  | 'xp'
  | 'level'
  | 'reward';

type GameIconProps = {
  name: GameIconName;
  className?: string;
};

export function GameIcon({ name, className = '' }: GameIconProps) {
  return (
    <svg className={`game-icon ${className}`} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      {renderIcon(name)}
    </svg>
  );
}

function renderIcon(name: GameIconName) {
  switch (name) {
    case 'fish':
    case 'fishPond':
    case 'goldenSardine':
    case 'spectralSardine':
      return (
        <>
          <path d="M8 32c11-14 28-17 43-4 2 2 2 6 0 8-15 13-32 10-43-4Z" fill="currentColor" />
          <circle cx="43" cy="30" r="3" fill="#1f2f36" />
          <path d="M14 32 4 22v20Z" fill="currentColor" opacity="0.75" />
          <path d="M28 22c2 6 2 13 0 20" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'mice':
    case 'huntMice':
      return (
        <>
          <ellipse cx="32" cy="36" rx="22" ry="15" fill="currentColor" />
          <circle cx="22" cy="22" r="7" fill="currentColor" opacity="0.78" />
          <circle cx="43" cy="22" r="7" fill="currentColor" opacity="0.78" />
          <circle cx="25" cy="35" r="2.5" fill="#1f2f36" />
          <circle cx="39" cy="35" r="2.5" fill="#1f2f36" />
          <path d="M32 40c4 5 9 7 16 6" fill="none" stroke="#1f2f36" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'yarn':
    case 'searchYarn':
    case 'glowingYarn':
      return (
        <>
          <circle cx="32" cy="34" r="22" fill="currentColor" />
          <path
            d="M15 30c10-8 23-9 34-3M17 40c12-7 24-7 38 2M27 14c10 10 12 24 5 40"
            fill="none"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      );
    case 'catnip':
      return (
        <>
          <path d="M31 52c0-18 2-31 18-42 5 18-2 31-18 42Z" fill="currentColor" />
          <path d="M31 52C20 37 16 24 22 10c12 12 15 25 9 42Z" fill="currentColor" opacity="0.78" />
          <path d="M31 52V20" fill="none" stroke="#1f2f36" strokeWidth="4" strokeLinecap="round" opacity="0.28" />
        </>
      );
    case 'gems':
      return (
        <>
          <path d="M20 10h24l12 16-24 28L8 26Z" fill="currentColor" />
          <path d="M20 10 14 26h36l-6-16M8 26h48M32 54 20 26m12 28 12-28" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
        </>
      );
    case 'coins':
      return (
        <>
          <circle cx="32" cy="33" r="21" fill="currentColor" />
          <circle cx="32" cy="33" r="14" fill="none" stroke="#ffffff" strokeWidth="4" />
          <path d="M32 22v22M24 28h13a5 5 0 0 1 0 10H26" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'cardboardBoxes':
      return (
        <>
          <path d="M12 26h40v25H12Z" fill="currentColor" />
          <path d="M12 26 20 13h24l8 13H12Z" fill="currentColor" opacity="0.78" />
          <path d="M32 13v38M18 36h28" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'sleep':
      return (
        <>
          <path d="M13 42c7 9 24 13 38 2-16 1-28-10-26-27-12 6-18 17-12 25Z" fill="currentColor" />
          <path d="M38 15h12l-12 13h13" fill="none" stroke="#1f2f36" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 'exploreYard':
      return (
        <>
          <path d="M15 52c2-18 8-29 17-40 9 11 15 22 17 40H15Z" fill="currentColor" />
          <path d="M32 13v39M22 31h20" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          <circle cx="49" cy="15" r="5" fill="currentColor" opacity="0.78" />
        </>
      );
    case 'home':
      return (
        <>
          <path d="M10 33 32 14l22 19v20H16V33Z" fill="currentColor" />
          <path d="M26 53V39h12v14" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'world':
      return (
        <>
          <path d="M10 24h44v28H10Z" fill="currentColor" />
          <path d="M10 24V12h8v6h8v-6h12v6h8v-6h8v12" fill="currentColor" />
          <path d="M24 52V40h16v12" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'shield':
      return (
        <>
          <path d="M32 4 54 11v19c0 15-9 25-22 30C19 55 10 45 10 30V11Z" fill="currentColor" />
          <circle cx="32" cy="34" r="6" fill="#ffffff" />
          <circle cx="24" cy="25" r="3" fill="#ffffff" />
          <circle cx="32" cy="22" r="3" fill="#ffffff" />
          <circle cx="40" cy="25" r="3" fill="#ffffff" />
        </>
      );
    case 'colony':
      return (
        <>
          <path d="M14 26 10 12l12 6h20l12-6-4 14c3 4 4 8 4 12 0 12-10 18-22 18S10 50 10 38c0-4 1-8 4-12Z" fill="currentColor" />
          <circle cx="24" cy="38" r="3.5" fill="#ffffff" />
          <circle cx="40" cy="38" r="3.5" fill="#ffffff" />
          <path d="M28 47h8l-4 5Z" fill="#ffffff" />
        </>
      );
    case 'expedition':
      return (
        <>
          <path d="M12 56V22L32 7l20 15v34H12Z" fill="currentColor" />
          <path d="M22 56V31c0-8 20-8 20 0v25" fill="#1f2f36" />
          <path d="M32 20v12M26 26h12" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <path d="M8 56h48" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </>
      );
    case 'upgrades':
      return (
        <>
          <path d="M32 8 52 20v24L32 56 12 44V20Z" fill="currentColor" />
          <path d="M32 8v48M12 20l20 12 20-12" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'missions':
      return (
        <>
          <rect x="15" y="10" width="34" height="44" rx="6" fill="currentColor" />
          <path d="M24 24h16M24 34h16M24 44h9" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'inventory':
      return (
        <>
          <path d="M13 24h38l-4 30H17Z" fill="currentColor" />
          <path d="M23 24c0-9 18-9 18 0" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M22 36h20" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'settings':
      return (
        <>
          <path
            d="M32 8 38 18l12-1 1 12 9 7-8 9 2 12-12 2-10 7-8-9-12-1 1-12-9-8 8-9-2-12 12-1Z"
            fill="currentColor"
          />
          <circle cx="32" cy="32" r="8" fill="#ffffff" />
        </>
      );
    case 'energy':
      return <path d="M37 5 14 36h16l-4 23 24-34H34Z" fill="currentColor" />;
    case 'xp':
    case 'level':
      return (
        <>
          <path d="M32 8 39 23l16 2-12 12 3 17-14-8-14 8 3-17L9 25l16-2Z" fill="currentColor" />
          <path d="M25 34h14" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'rareFeather':
      return (
        <>
          <path d="M47 8C26 10 14 25 14 52c20-7 34-24 33-44Z" fill="currentColor" />
          <path d="M18 50c9-11 18-20 29-32" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'ironClaw':
    case 'mistFang':
      return (
        <>
          <path d="M12 48 43 17l5 5-31 31H12v-5Z" fill="currentColor" />
          <path d="m37 14 6-6 13 13-6 6Z" fill="currentColor" opacity="0.72" />
          <path d="m20 39 5 5" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'guardArmor':
    case 'grimaldeAegis':
      return (
        <>
          <path d="M32 6 53 14v17c0 14-8 23-21 28C19 54 11 45 11 31V14Z" fill="currentColor" />
          <path d="M32 13v37M19 25h26" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'phantomFur':
      return (
        <>
          <path d="M13 50c0-12 5-21 12-27l-2-13 11 8 11-8-2 14c6 7 9 15 8 26H13Z" fill="currentColor" />
          <path d="M22 39c7-7 14-8 22 0M25 48c5-4 10-4 15 0" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case 'grimaldeRelic':
      return (
        <>
          <path d="M17 9h30l6 45H11L17 9Z" fill="currentColor" />
          <path d="M25 21h14M22 32h20M27 43h10" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          <circle cx="17" cy="50" r="3" fill="#ffffff" opacity="0.7" />
          <circle cx="47" cy="50" r="3" fill="#ffffff" opacity="0.7" />
        </>
      );
    case 'reward':
      return (
        <>
          <path d="M14 26h36v28H14Z" fill="currentColor" />
          <path d="M11 18h42v12H11Z" fill="currentColor" opacity="0.8" />
          <path d="M32 18v36M18 18c-2-9 9-13 14 0 5-13 16-9 14 0" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </>
      );
  }
}
