export const WATER_SHIMMER_FRAME_MS = 600;
export const FOG_CYCLE_MS = 18_000;
export const WATER_SHIMMER_ALPHA = [0.16, 0.14] as const;
export const MAX_FOG_ALPHA = 0.07;
export const VIGNETTE_ALPHA = 0.12;

export const STATIC_LIGHTS = [
  { id: 'plaza', tx: 12, ty: 8, radius: 68, alpha: 0.075 },
  { id: 'forge', tx: 15, ty: 8, radius: 46, alpha: 0.055 },
  { id: 'gate', tx: 12, ty: 12, radius: 48, alpha: 0.05 },
] as const;

export type DepthItem<T> = {
  baselineY: number;
  order: number;
  value: T;
};

export type FogPatch = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
};

export function sortByDepth<T>(items: DepthItem<T>[]): DepthItem<T>[] {
  return [...items].sort(
    (left, right) => left.baselineY - right.baselineY || left.order - right.order,
  );
}

export function getWaterShimmerPhase(elapsedMs: number, reducedMotion: boolean): 0 | 1 {
  if (reducedMotion) return 0;
  return Math.floor(Math.max(0, elapsedMs) / WATER_SHIMMER_FRAME_MS) % 2 === 0 ? 0 : 1;
}

export function getPlayerAnimationFrame(
  animationSeconds: number,
  fps: number,
  frames: number,
  moving: boolean,
  reducedMotion: boolean,
): number {
  if (reducedMotion && !moving) return 0;
  return Math.floor(animationSeconds * fps) % frames;
}

export function getFogPatches(elapsedMs: number, reducedMotion: boolean): FogPatch[] {
  const progress = reducedMotion
    ? 0
    : (Math.max(0, elapsedMs) % FOG_CYCLE_MS) / FOG_CYCLE_MS;
  const wave = progress * Math.PI * 2;

  return [
    {
      x: -0.03 + progress * 0.24,
      y: 0.24 + Math.sin(wave) * 0.035,
      radius: 0.2,
      alpha: MAX_FOG_ALPHA,
    },
    {
      x: 1.03 - progress * 0.2,
      y: 0.57 + Math.sin(wave + 2.1) * 0.04,
      radius: 0.23,
      alpha: 0.065,
    },
    {
      x: 0.25 + Math.sin(wave + 4.2) * 0.035,
      y: 1.03 - progress * 0.16,
      radius: 0.19,
      alpha: 0.055,
    },
  ];
}
