import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');

test('G3.3b makes Grimalkin the full-bleed landing surface without resizing the logical map', () => {
  const app = read('src/app/App.tsx');
  const world = read('src/ui/screens/WorldScreen.tsx');
  const map = read('src/game/world/tinyTown.ts');
  const css = read('src/styles/global.css');

  assert.match(app, /useState<ScreenId>\('world'\)/);
  assert.match(app, /app-shell--world/);
  assert.doesNotMatch(app, /dashboard|DashboardScreen|label: 'Início'/);
  assert.equal(existsSync(join(root, 'src/ui/screens/DashboardScreen.tsx')), false);
  assert.match(css, /\.app-shell\.app-shell--world\s*\{[\s\S]*?width: 100%;[\s\S]*?padding: 0;/);
  assert.match(css, /\.world-screen\s*\{[\s\S]*?height: 100%;[\s\S]*?border: 0;/);
  assert.match(world, /Math\.max\(ZOOM, rect\.width \/ mapW, rect\.height \/ mapH\)/);
  assert.match(map, /const width = 24/);
  assert.match(map, /const height = 16/);
});

test('G3.3b world panel supports open, minimize, restore, close and keyboard dismissal', () => {
  const world = read('src/ui/screens/WorldScreen.tsx');
  const css = read('src/styles/global.css');

  assert.match(world, /type WorldPanelState = 'closed' \| 'open' \| 'minimized'/);
  assert.match(world, /type WorldPanelStates = Record<WorldPanelId, WorldPanelState>/);
  assert.match(world, /WORLD_PANEL_OPTIONS/);
  assert.match(world, /useState<WorldPanelStates>\(\{ bulletin: 'closed' \}\)/);
  assert.match(world, /onPanelStateChange\(panel\.id, 'open'\)/);
  assert.match(world, /onPanelStateChange\('bulletin', 'minimized'\)/);
  assert.match(world, /onPanelStateChange\('bulletin', 'closed'\)/);
  assert.match(world, /event\.key !== 'Escape'/);
  assert.match(world, /windowRef\.current\?\.focus\(\)/);
  assert.match(world, /openerRef\.current\?\.focus\(\)/);
  assert.match(world, /dockButtonRef\.current\?\.focus\(\)/);
  assert.match(world, /role="dialog"/);
  assert.match(world, /aria-modal="false"/);
  assert.match(world, /panelStatesRef\.current\.bulletin === 'open'/);
  assert.match(world, /target\.closest\('button, input, select, textarea, a, \[role="dialog"\]'\)/);
  assert.match(world, /if \(panelStates\.bulletin === 'open'\) keysRef\.current\.clear\(\)/);
  assert.match(world, /panelStates\.bulletin === 'open' \? ' has-panel'/);
  assert.match(css, /\.world-screen\.has-panel \.world-dpad/);
  assert.match(css, /\.world-panel-dock\s*\{[\s\S]*?grid-template-columns: repeat\(2/);
  assert.match(css, /\.world-options-menu\s*\{[\s\S]*?flex-wrap: wrap;[\s\S]*?gap: 8px;/);
  assert.match(css, /\.world-panel-actions button\s*\{[\s\S]*?width: 44px;[\s\S]*?min-height: 44px;/);
});

test('G3.3b topbar lists every cat and keeps idle destinations within two actions', () => {
  const status = read('src/ui/components/GlobalActivityStatus.tsx');
  const app = read('src/app/App.tsx');

  assert.match(app, /<GlobalActivityStatus state=\{state\} now=\{now\}/);
  assert.match(status, /state\.cats\.map\(\(cat\)/);
  assert.match(status, /cat\.activity/);
  assert.match(status, /cat\.expedition/);
  assert.match(status, /getEffectiveActivityEndsAt\(cat\.activity\)/);
  assert.match(status, /aria-haspopup="true"/);
  assert.match(status, /Ver Atividades/);
  assert.match(status, /Ver Além/);
  assert.doesNotMatch(status, /aria-live/);
});

test('G3.3b game-feel preserves actor identity and uses contextual anchors and labels', () => {
  const cues = read('src/ui/gameFeel.ts');
  const layer = read('src/ui/components/GameFeelEffectLayer.tsx');
  const world = read('src/ui/screens/WorldScreen.tsx');
  const css = read('src/styles/global.css');

  assert.match(cues, /catId: cat\.id/);
  assert.match(cues, /catName: cat\.name/);
  assert.match(cues, /amount: levelsGained/);
  assert.match(cues, /amount: energyGained/);
  assert.match(layer, /LEVEL UP · \$\{effect\.catName\}/);
  assert.match(layer, /ENERGY \+\$\{effect\.amount \?\? ''\} · \$\{effect\.catName\}/);
  assert.match(layer, /BLINKING · \$\{effect\.catName\}/);
  assert.match(world, /effect\?\.catId === catId/);
  assert.match(world, /drawWorldGameFeelAura/);
  assert.match(css, /\.game-feel-effect--crest\s*\{/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.game-feel-effect \*/);
});

test('G3.3b removes the menu rail and mixed-atlas architecture while strengthening icons', () => {
  const app = read('src/app/App.tsx');
  const map = read('src/game/world/tinyTown.ts');
  const css = read('src/styles/global.css');

  assert.doesNotMatch(app, /nav-divider/);
  assert.doesNotMatch(css, /\.side-nav::after/);
  assert.match(css, /\.side-nav \.game-icon\s*\{[\s\S]*?width: 24px;[\s\S]*?height: 24px;/);
  assert.doesNotMatch(map, /DUNGEON_TILES\.(guardianRelief|gateway)/);
  assert.match(map, /DUNGEON_TILES\.wallFlame/);
  assert.match(map, /DUNGEON_TILES\.masonryRubble/);
});
