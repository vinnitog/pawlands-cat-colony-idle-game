import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FOG_CYCLE_MS,
  MAX_FOG_ALPHA,
  STATIC_LIGHTS,
  VIGNETTE_ALPHA,
  WATER_SHIMMER_FRAME_MS,
  WATER_SHIMMER_ALPHA,
  getFogPatches,
  getPlayerAnimationFrame,
  getWaterShimmerPhase,
  sortByDepth,
} from '../src/game/world/worldVisuals.ts';

test('G2 y-sort is deterministic by baseline and explicit tie order', () => {
  const items = [
    { baselineY: 48, order: 3, value: 'third' },
    { baselineY: 32, order: 8, value: 'first' },
    { baselineY: 48, order: 1, value: 'second' },
  ];

  assert.deepEqual(sortByDepth(items).map(({ value }) => value), [
    'first',
    'second',
    'third',
  ]);
  assert.deepEqual(items.map(({ value }) => value), ['third', 'first', 'second']);
});

test('G2 water shimmer alternates every 600ms and freezes for reduced motion', () => {
  assert.equal(WATER_SHIMMER_FRAME_MS, 600);
  assert.equal(getWaterShimmerPhase(0, false), 0);
  assert.equal(getWaterShimmerPhase(599, false), 0);
  assert.equal(getWaterShimmerPhase(600, false), 1);
  assert.equal(getWaterShimmerPhase(1200, false), 0);
  assert.equal(getWaterShimmerPhase(99_999, true), 0);
});

test('G2 reduced motion freezes player idle but keeps commanded run animated', () => {
  assert.equal(getPlayerAnimationFrame(1.25, 4, 4, false, true), 0);
  assert.equal(getPlayerAnimationFrame(1.25, 4, 4, true, true), 1);
  assert.equal(getPlayerAnimationFrame(1.25, 4, 4, false, false), 1);
});

test('G2 fog keeps three subtle peripheral patches in an 18s cycle', () => {
  assert.equal(FOG_CYCLE_MS, 18_000);
  const start = getFogPatches(0, false);
  const middle = getFogPatches(9_000, false);
  const nextCycle = getFogPatches(18_000, false);

  assert.equal(start.length, 3);
  assert.equal(middle.length, 3);
  assert.deepEqual(nextCycle, start);
  assert.notDeepEqual(middle, start);
  for (const patch of start) {
    assert.ok(patch.alpha > 0 && patch.alpha <= MAX_FOG_ALPHA);
    assert.ok(patch.radius > 0 && patch.radius <= 0.25);
    assert.ok(
      patch.x <= 0.25 || patch.x >= 0.75 || patch.y <= 0.25 || patch.y >= 0.75,
      'fog must stay near the map perimeter',
    );
  }
  assert.deepEqual(getFogPatches(12_345, true), start);
});

test('G2 atmosphere respects the visual composition limits', () => {
  assert.ok(Math.max(...WATER_SHIMMER_ALPHA) <= 0.18);
  assert.ok(MAX_FOG_ALPHA <= 0.07);
  assert.ok(VIGNETTE_ALPHA <= 0.14);
  assert.deepEqual(STATIC_LIGHTS.map(({ id }) => id), ['plaza', 'forge', 'gate']);
  assert.ok(STATIC_LIGHTS.every(({ alpha }) => alpha > 0 && alpha <= 0.14));

  for (let y = 0; y <= 16 * 16; y += 2) {
    for (let x = 0; x <= 24 * 16; x += 2) {
      const composedAlpha = STATIC_LIGHTS.reduce((total, candidate) => {
        const distance = Math.hypot(x - candidate.tx * 16, y - candidate.ty * 16);
        const localAlpha = candidate.alpha * Math.max(0, 1 - distance / candidate.radius);
        return 1 - (1 - total) * (1 - localAlpha);
      }, 0);
      assert.ok(composedAlpha <= 0.14, `light composition is too strong at ${x},${y}`);
    }
  }
});

test('G2 renderer wires depth, atmosphere and reactive reduced motion', () => {
  const source = readFileSync('src/ui/screens/WorldScreen.tsx', 'utf8');

  assert.match(source, /sortByDepth\(depthItems\)/);
  assert.match(source, /drawContactShadow/);
  assert.match(source, /tile < 132 \|\| tile > 140/);
  assert.match(source, /getWaterShimmerPhase\(elapsedMs, reducedMotion\)/);
  assert.match(source, /getFogPatches\(elapsedMs, reducedMotion\)/);
  assert.match(source, /createRadialGradient/);
  assert.match(source, /atmosphereCanvas/);
  assert.match(source, /fogStamps/);
  assert.match(source, /const coverScale = Math\.max\(ZOOM, rect\.width \/ mapW, rect\.height \/ mapH\)/);
  assert.match(source, /renderScale = coverScale \* dpr/);
  assert.match(source, /ctx\.setTransform\(1, 0, 0, 1, 0, 0\)/);
  assert.match(source, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(source, /addEventListener\('change', onReducedMotionChange\)/);
  assert.match(source, /removeEventListener\('change', onReducedMotionChange\)/);
  assert.match(source, /if \(!reducedMotion\) stepAmbient\(now, dt\)/);
  assert.match(source, /getPlayerAnimationFrame\([\s\S]*?player\.moving,[\s\S]*?reducedMotion/);
});

test('G2 renderer cleans up animation, listeners and held controls before returning', () => {
  const source = readFileSync('src/ui/screens/WorldScreen.tsx', 'utf8');
  const cleanup = source.slice(source.indexOf('return () => {'), source.indexOf('  }, [catClass, leaderIsAway]'));

  assert.match(source, /if \(!running\) return/);
  assert.match(cleanup, /running = false/);
  assert.match(cleanup, /cancelAnimationFrame\(raf\)/);
  assert.match(cleanup, /window\.clearInterval\(saveTimer\)/);
  assert.match(cleanup, /removeEventListener\('keydown', onKeyDown\)/);
  assert.match(cleanup, /removeEventListener\('keyup', onKeyUp\)/);
  assert.match(cleanup, /removeEventListener\('resize', resize\)/);
  assert.match(cleanup, /removeEventListener\('change', onReducedMotionChange\)/);
  assert.match(cleanup, /keys\.clear\(\)/);
  assert.match(cleanup, /persistRef\.current\(Math\.round\(player\.x\), Math\.round\(player\.y\)\)/);
});
