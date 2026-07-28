import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import {
  GAME_FEEL_DURATION_MS,
  detectGameFeelCues,
  enqueueGameFeelEffects,
} from '../src/ui/gameFeel.ts';

const root = process.cwd();

function read(file) {
  return readFileSync(join(root, file), 'utf8');
}

function cssBlock(css, selector) {
  const start = css.indexOf(selector);
  assert.ok(start >= 0, `${selector} should be present`);
  const end = css.indexOf('}', start);
  assert.ok(end > start, `${selector} should have a complete block`);
  return css.slice(start, end + 1);
}

function numericCssProperty(block, property) {
  const match = block.match(new RegExp(`${property}:\\s*(\\d+)`));
  assert.ok(match, `${property} should have a numeric value`);
  return Number(match[1]);
}

test('game-feel durations match the short feedback contract', () => {
  assert.deepEqual(GAME_FEEL_DURATION_MS, {
    levelUp: 900,
    energyRegen: 600,
    teleport: 800,
  });
});

test('queue prioritizes teleport and level-up while preserving the active effect', () => {
  const sorted = enqueueGameFeelEffects([], [
    { id: 1, kind: 'energyRegen' },
    { id: 2, kind: 'levelUp' },
    { id: 3, kind: 'teleport', direction: 'depart' },
  ]);
  assert.deepEqual(sorted.map((effect) => effect.kind), ['teleport', 'levelUp', 'energyRegen']);

  const capped = enqueueGameFeelEffects([{ id: 1, kind: 'energyRegen' }], [
    { id: 2, kind: 'energyRegen' },
    { id: 3, kind: 'levelUp' },
    { id: 4, kind: 'teleport', direction: 'return' },
    { id: 5, kind: 'levelUp' },
  ]);
  assert.deepEqual(capped.map((effect) => effect.id), [1, 4, 3, 5]);
});

test('state cues detect expedition direction and avoid regen noise during level-up', () => {
  const previous = createInitialGameState(0);
  const cat = previous.cats[0];
  const departed = {
    ...previous,
    cats: [
      {
        ...cat,
        level: cat.level + 1,
        energy: cat.energy + 4,
        expedition: { zoneId: 'whisperingFields' },
      },
    ],
  };

  assert.deepEqual(detectGameFeelCues(previous, departed), [
    {
      kind: 'teleport',
      direction: 'depart',
      catId: cat.id,
      catName: cat.name,
    },
    {
      kind: 'levelUp',
      catId: cat.id,
      catName: cat.name,
      amount: 1,
    },
  ]);

  const returned = {
    ...departed,
    cats: departed.cats.map((current) => ({ ...current, expedition: null })),
  };
  assert.deepEqual(detectGameFeelCues(departed, returned), [
    {
      kind: 'teleport',
      direction: 'return',
      catId: cat.id,
      catName: cat.name,
    },
  ]);
});

test('level gains from multiple known cats preserve their responsible actors', () => {
  const initial = createInitialGameState(0);
  const leader = initial.cats[0];
  const companion = {
    ...leader,
    id: 'cat-companion',
    name: 'Companion',
    level: 3,
    energy: 20,
  };
  const previous = {
    ...initial,
    cats: [leader, companion],
  };
  const current = {
    ...previous,
    cats: previous.cats.map((cat, index) => ({
      ...cat,
      level: cat.level + index + 1,
      energy: cat.energy + 5,
    })),
  };

  assert.deepEqual(detectGameFeelCues(previous, current), [
    {
      kind: 'levelUp',
      catId: leader.id,
      catName: leader.name,
      amount: 1,
    },
    {
      kind: 'levelUp',
      catId: companion.id,
      catName: companion.name,
      amount: 2,
    },
  ]);
});

test('unchanged state and cats without a previous matching id do not emit cues', () => {
  const previous = createInitialGameState(0);
  const leader = previous.cats[0];
  const newCat = {
    ...leader,
    id: 'new-cat',
    level: leader.level + 10,
    energy: leader.energy + 10,
    expedition: { zoneId: 'whisperingFields' },
  };

  assert.deepEqual(detectGameFeelCues(previous, previous), []);
  assert.deepEqual(
    detectGameFeelCues(previous, {
      ...previous,
      cats: [newCat],
    }),
    [],
  );
});

test('steady or falling energy does not emit a regen cue', () => {
  const previous = createInitialGameState(0);
  const leader = previous.cats[0];

  for (const energy of [leader.energy, Math.max(0, leader.energy - 1)]) {
    const current = {
      ...previous,
      cats: previous.cats.map((cat) => ({ ...cat, energy })),
    };
    assert.deepEqual(detectGameFeelCues(previous, current), []);
  }
});

test('teleport cue is tied only to crossing the expedition null boundary', () => {
  const initial = createInitialGameState(0);
  const leader = initial.cats[0];
  const onExpedition = {
    ...initial,
    cats: [
      {
        ...leader,
        expedition: { zoneId: 'whisperingFields' },
      },
    ],
  };
  const changedExpedition = {
    ...onExpedition,
    cats: onExpedition.cats.map((cat) => ({
      ...cat,
      expedition: { zoneId: 'mistyWoods' },
    })),
  };

  assert.deepEqual(detectGameFeelCues(onExpedition, changedExpedition), []);
  assert.deepEqual(detectGameFeelCues(initial, onExpedition), [
    {
      kind: 'teleport',
      direction: 'depart',
      catId: leader.id,
      catName: leader.name,
    },
  ]);
  assert.deepEqual(detectGameFeelCues(onExpedition, initial), [
    {
      kind: 'teleport',
      direction: 'return',
      catId: leader.id,
      catName: leader.name,
    },
  ]);
});

test('passive or item energy gain emits a regen cue for the responsible cat', () => {
  const previous = {
    ...createInitialGameState(0),
    cats: createInitialGameState(0).cats.map((cat) => ({ ...cat, energy: 10 })),
  };
  const current = {
    ...previous,
    cats: previous.cats.map((cat) => ({ ...cat, energy: 17 })),
  };

  const leader = previous.cats[0];
  assert.deepEqual(detectGameFeelCues(previous, current), [{
    kind: 'energyRegen',
    catId: leader.id,
    catName: leader.name,
    amount: 7,
  }]);
});

test('simultaneous energy gains keep one regen cue per known cat', () => {
  const initial = createInitialGameState(0);
  const leader = { ...initial.cats[0], energy: 10 };
  const companion = {
    ...leader,
    id: 'cat-energy-companion',
    name: 'Companion',
    energy: 20,
  };
  const previous = {
    ...initial,
    cats: [leader, companion],
  };
  const current = {
    ...previous,
    cats: [
      { ...leader, energy: 14 },
      { ...companion, energy: 27 },
    ],
  };

  assert.deepEqual(detectGameFeelCues(previous, current), [
    {
      kind: 'energyRegen',
      catId: leader.id,
      catName: leader.name,
      amount: 4,
    },
    {
      kind: 'energyRegen',
      catId: companion.id,
      catName: companion.name,
      amount: 7,
    },
  ]);
});

test('App pauses game-feel playback while a reward modal is active', () => {
  const app = read('src/app/App.tsx');

  assert.match(app, /rewardNotice\s*\?\s*<OfflineRewardsModal/);
  assert.match(app, /gameFeelEffect\s*&&\s*!rewardNotice\s*&&\s*screen\s*!==\s*'world'/);
  assert.match(app, /effect=\{gameFeelEffect\}/);
});

test('reset clears queued effects and suppresses the reset state transition', () => {
  const provider = read('src/app/gameProvider.tsx');
  const resetStart = provider.indexOf('const resetGame');
  const resetEnd = provider.indexOf('const value = useMemo', resetStart);
  const resetBlock = provider.slice(resetStart, resetEnd);

  assert.ok(resetStart >= 0 && resetEnd > resetStart, 'resetGame block should be present');
  assert.match(resetBlock, /suppressNextGameFeelRef\.current\s*=\s*true/);
  assert.match(resetBlock, /setGameFeelEffects\(\s*\[\s*\]\s*\)/);
  assert.match(
    provider,
    /if\s*\(\s*suppressNextGameFeelRef\.current\s*\)\s*\{[\s\S]*?suppressNextGameFeelRef\.current\s*=\s*false[\s\S]*?return/,
  );
});

test('effect layer has animation completion and timeout fallback cleanup', () => {
  const layer = read('src/ui/components/GameFeelEffectLayer.tsx');

  assert.match(layer, /window\.setTimeout\([\s\S]*?onComplete[\s\S]*?GAME_FEEL_DURATION_MS\[effect\.kind\]/);
  assert.match(layer, /return\s*\(\)\s*=>\s*window\.clearTimeout\(timeoutId\)/);
  assert.match(layer, /onAnimationEnd=/);
  assert.match(layer, /event\.target\s*===\s*event\.currentTarget/);
});

test('effect layer announces its label, keeps SVG decorative and stays non-blocking', () => {
  const layer = read('src/ui/components/GameFeelEffectLayer.tsx');
  const app = read('src/app/App.tsx');
  const css = read('src/styles/global.css');

  assert.match(layer, /role="status"/);
  assert.match(layer, /aria-label=\{label\}/);
  assert.match(layer, /<svg[\s\S]*?aria-hidden="true"[\s\S]*?focusable="false"/);
  assert.equal((app.match(/<GameFeelEffectLayer/g) ?? []).length, 1);
  assert.match(app, /key=\{gameFeelEffect\.id\}/);
  assert.match(css, /\.game-feel-effect\s*\{[\s\S]*?pointer-events:\s*none/);
  assert.match(css, /gameFeelLevelOverlay/);
  assert.match(css, /gameFeelEnergyOverlay/);
  assert.match(css, /gameFeelTeleportDepart/);
  assert.match(css, /gameFeelTeleportReturn/);
});

test('game-feel respects reduced motion, viewport fit and UI layering', () => {
  const app = read('src/app/App.tsx');
  const css = read('src/styles/global.css');
  const effectBlock = cssBlock(css, '.game-feel-effect {');
  const svgBlock = cssBlock(css, '.game-feel-svg {');
  const crestBlock = cssBlock(css, '.game-feel-effect--crest {');
  const labelBlock = cssBlock(css, '.game-feel-label {');
  const viewportDepartBlock = cssBlock(css, '.game-feel-effect--depart {');
  const viewportReturnBlock = cssBlock(css, '.game-feel-effect--return {');
  const toastBlock = cssBlock(css, '.toast {');
  const modalBlock = cssBlock(css, '.modal-backdrop {');
  const crestOverlayKeyframes = css.slice(
    css.indexOf('@keyframes gameFeelCrestOverlay'),
    css.indexOf('@keyframes gameFeelTeleportSpin'),
  );
  const reducedMotionStart = css.indexOf('@media (prefers-reduced-motion: reduce)');
  const reducedMotionEnd = css.indexOf('}', css.indexOf('}', reducedMotionStart) + 1);
  const reducedMotionBlock = css.slice(reducedMotionStart, reducedMotionEnd + 1);

  assert.match(effectBlock, /position:\s*fixed/);
  assert.match(effectBlock, /inset:\s*0/);
  assert.match(effectBlock, /padding-inline-start:\s*var\(--nav-w\)/);
  assert.match(svgBlock, /calc\(100vw\s*-\s*var\(--nav-w\)\s*-\s*24px\)/);
  assert.match(svgBlock, /62vh/);
  assert.match(crestBlock, /inset:\s*50%\s+auto\s+auto\s+50%/);
  assert.match(labelBlock, /top:\s*calc\(50%\s*\+\s*24px\)/);
  assert.match(labelBlock, /translate:\s*0(?:;|\s)/);
  assert.doesNotMatch(labelBlock, /translate:\s*0\s+-/);
  assert.match(viewportDepartBlock, /animation:\s*gameFeelTeleportDepart/);
  assert.match(viewportReturnBlock, /animation:\s*gameFeelTeleportReturn/);
  assert.match(
    css,
    /\.game-feel-effect--crest\.game-feel-effect--depart,[\s\S]*?\.game-feel-effect--crest\.game-feel-effect--return\s*\{[^}]*animation:\s*gameFeelCrestOverlay/,
  );
  assert.match(
    css,
    /\.game-feel-effect--crest\.game-feel-effect--depart \.game-feel-svg\s*\{[^}]*animation:\s*gameFeelTeleportDepart/,
  );
  assert.match(
    css,
    /\.game-feel-effect--crest\.game-feel-effect--return \.game-feel-svg\s*\{[^}]*animation:\s*gameFeelTeleportReturn/,
  );
  assert.match(crestOverlayKeyframes, /opacity:\s*0/);
  assert.match(crestOverlayKeyframes, /opacity:\s*1/);
  assert.doesNotMatch(crestOverlayKeyframes, /transform:/);
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.game-feel-effect,\s*\.game-feel-effect \*\s*\{[^}]*animation:\s*none !important;/,
  );
  const effectLayer = numericCssProperty(effectBlock, 'z-index');
  assert.ok(effectLayer < numericCssProperty(toastBlock, 'z-index'));
  assert.ok(effectLayer < numericCssProperty(modalBlock, 'z-index'));
  assert.match(reducedMotionBlock, /animation-duration:\s*0\.01ms\s*!important/);
  assert.match(reducedMotionBlock, /animation-iteration-count:\s*1\s*!important/);
  assert.match(reducedMotionBlock, /transition-duration:\s*0\.01ms\s*!important/);
  assert.match(app, /<OfflineRewardsModal/);
});
