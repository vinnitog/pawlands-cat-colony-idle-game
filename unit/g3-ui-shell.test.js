import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');

test('G3.3c makes Grimalkin the framed landing surface without resizing the logical map', () => {
  const app = read('src/app/App.tsx');
  const world = read('src/ui/screens/WorldScreen.tsx');
  const map = read('src/game/world/tinyTown.ts');
  const css = read('src/styles/global.css');
  const worldShell = css.match(/\.app-shell\.app-shell--world\s*\{([^}]*)\}/)?.[1];

  assert.ok(worldShell);
  assert.match(app, /useState<ScreenId>\('world'\)/);
  assert.match(app, /app-shell--world/);
  assert.doesNotMatch(app, /dashboard|DashboardScreen|label: 'Início'/);
  assert.equal(existsSync(join(root, 'src/ui/screens/DashboardScreen.tsx')), false);
  assert.match(worldShell, /box-sizing: border-box;/);
  assert.match(worldShell, /width: 100%;/);
  assert.match(worldShell, /height: calc\(100dvh - var\(--header-h\)\);/);
  assert.match(worldShell, /padding: clamp\(16px, min\(6vw, 12vh\), 100px\);/);
  assert.doesNotMatch(worldShell, /padding:\s*0;/);
  assert.match(css, /\.app-shell--world \.app-main\s*\{[^}]*height: 100%;/);
  assert.match(css, /\.world-screen-layout\s*\{[^}]*height: 100%;/);
  assert.match(css, /\.world-screen\s*\{[\s\S]*?height: 100%;[\s\S]*?border: 1px solid/);
  assert.match(world, /Math\.max\(ZOOM, rect\.width \/ mapW, rect\.height \/ mapH\)/);
  assert.match(map, /const width = 24/);
  assert.match(map, /const height = 16/);
});

test('G3.3b world panel supports open, minimize, restore, close and keyboard dismissal', () => {
  const world = read('src/ui/screens/WorldScreen.tsx');
  const css = read('src/styles/global.css');
  const optionsMenu = world.match(/<nav className="world-options-menu"[\s\S]*?<\/nav>/)?.[0];

  assert.ok(optionsMenu);
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
  assert.match(optionsMenu, /aria-label=\{`Abrir \$\{panel\.label\}`\}/);
  assert.doesNotMatch(optionsMenu, /\btitle=/);
  assert.match(optionsMenu, /data-tooltip=\{panel\.label\}/);
  assert.match(optionsMenu, /onClick=\{\(\) => onPanelStateChange\(panel\.id, 'open'\)\}/);
  assert.match(optionsMenu, /<GameIcon name=\{panel\.icon\} \/>/);
  assert.doesNotMatch(optionsMenu, /<span>\{panel\.label\}<\/span>/);
  assert.match(
    css,
    /\.world-options-menu button\s*\{[^}]*width: 44px;[^}]*min-width: 44px;[^}]*min-height: 44px;[^}]*padding: 0;/,
  );
  assert.match(css, /\.world-options-menu button:focus-visible,/);
  assert.match(
    css,
    /\.world-options-menu button::after\s*\{[^}]*top: calc\(100% \+ 8px\);[^}]*content: attr\(data-tooltip\);/,
  );
  assert.match(
    css,
    /\.world-options-menu button:hover::after,[\s\S]*?\.world-options-menu button:focus-visible::after\s*\{[^}]*opacity: 1;[^}]*visibility: visible;/,
  );
  assert.match(
    css,
    /@media \(max-height: 520px\)\s*\{[\s\S]*?\.world-options-menu\s*\{[^}]*top: 48px;[^}]*\}[\s\S]*?\.world-options-menu button::after\s*\{[^}]*top: auto;[^}]*bottom: calc\(100% \+ 8px\);/,
  );
  assert.match(
    css,
    /@media \(max-height: 520px\)[\s\S]*@media \(max-width: 760px\)\s*\{[\s\S]*?\.world-options-menu\s*\{[^}]*top: 126px;/,
  );
  assert.match(
    css,
    /@media \(max-height: 520px\) and \(min-width: 761px\)\s*\{[\s\S]*?\.world-options-menu\s*\{[^}]*right: 14px;[^}]*left: auto;[^}]*width: auto;[^}]*transform: none;/,
  );
});

test('G3.3c suppresses fractional tile seams without changing the logical world', () => {
  const world = read('src/ui/screens/WorldScreen.tsx');
  const map = read('src/game/world/tinyTown.ts');

  assert.match(world, /canvas\.width = Math\.max\(1, Math\.round\(rect\.width \* dpr\)\)/);
  assert.match(world, /canvas\.height = Math\.max\(1, Math\.round\(rect\.height \* dpr\)\)/);
  assert.match(world, /renderScale = Math\.ceil\(coverScale \* dpr \* TILE\) \/ TILE/);
  assert.match(world, /Math\.round\(-camX \* renderScale\)/);
  assert.match(world, /Math\.round\(-camY \* renderScale\)/);
  assert.match(
    world,
    /ctx\.drawImage\(tileImg as HTMLImageElement, sx, sy, TILE, TILE, dx, dy, TILE, TILE\)/,
  );
  assert.match(world, /ctx\.drawImage\(detailImg, sx, sy, TILE, TILE, dx, dy, TILE, TILE\)/);
  assert.doesNotMatch(world, /TILE_SEAM_OVERLAP|dx - overlap|TILE \+ overlap/);
  assert.match(map, /const width = 24/);
  assert.match(map, /const height = 16/);

  const tile = 16;
  const coverScale = 2.37;
  for (const dpr of [1, 1.25, 1.5, 2]) {
    const scale = Math.ceil(coverScale * dpr * tile) / tile;
    assert.equal(Number.isInteger(scale * tile), true);
    assert.ok(scale * tile >= coverScale * dpr * tile);
  }
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
