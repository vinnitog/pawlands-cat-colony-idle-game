import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createGrimalkin } from '../src/game/world/tinyTown.ts';
import { getFocusTrapTarget } from '../src/ui/focusTrap.ts';

const root = process.cwd();

function read(file) {
  return readFileSync(join(root, file), 'utf8');
}

test('expedition has its own menu screen and the Beyond Gate opens it', () => {
  const app = read('src/app/App.tsx');
  const screen = read('src/ui/screens/ExpeditionScreen.tsx');
  const world = createGrimalkin();
  const gate = world.interactions.find((interaction) => interaction.label === 'Portão do Além');

  assert.match(app, /id: 'expedition'/);
  assert.match(app, /<ExpeditionScreen \/>/);
  assert.equal(gate?.kind, 'expedition');
  assert.match(screen, /<h2 id="expedition-title" tabIndex=\{-1\}>Expedição<\/h2>/);
});

test('expedition screen previews progress without mutating state every second', () => {
  const screen = read('src/ui/screens/ExpeditionScreen.tsx');

  assert.match(screen, /const now = useNow\(\)/);
  assert.match(screen, /useMemo\(\(\) => advanceExpeditions\(state, now\)/);
  assert.doesNotMatch(screen, /saveGame|setState/);
  assert.match(screen, /EXPEDITION_PULSE_CAP/);
  assert.match(screen, /role="progressbar"/);
  assert.match(screen, /aria-valuetext=/);
  assert.match(screen, /pulsos prontos/);
  assert.match(screen, /Cheio em aproximadamente/);
  assert.match(screen, /Próximo pulso resolvido em/);
  assert.match(screen, /Voltar sem coleta/);
  assert.match(screen, /zone\.lootTable\.map/);
  assert.match(screen, /zone\.gemChance/);
  assert.match(screen, /inventoryItemLabels/);
});

test('all three audited zone backgrounds are wired through the Vite base path', () => {
  const screen = read('src/ui/screens/ExpeditionScreen.tsx');

  for (const file of ['whispering-fields.png', 'mistwood.png', 'grimalkin-ruins.png']) {
    assert.match(screen, new RegExp(file.replace('.', '\\.')));
  }
  assert.match(screen, /import\.meta\.env\.BASE_URL/);
  assert.match(screen, /art\/superpowers\/zones/);
});

test('expedition provider actions persist starts and show collected rewards', () => {
  const provider = read('src/app/gameProvider.tsx');

  assert.match(provider, /startExpeditionInState/);
  assert.match(provider, /collectExpeditionInState/);
  assert.match(provider, /setRewardNotice\(\{/);
  assert.match(provider, /progresso parcial foi preservado/i);
  assert.match(provider, /current\.leaderId === catId/);
  assert.match(provider, /candidate\.id !== catId && !candidate\.activity && !candidate\.expedition/);
  assert.match(provider, /setLeaderInState\(result\.state, replacement\.id\)/);
  assert.match(provider, /saveGame\(nextState, undefined, now\)/);
  assert.match(
    provider,
    /if \(result\.resolvedPulses > 0\) \{[\s\S]*?setRewardNotice\(\{[\s\S]*?\} else \{[\s\S]*?setToast\(/,
  );
});

test('activity assignment and ambient wandering treat expeditions as occupied', () => {
  const colony = read('src/ui/screens/ColonyScreen.tsx');
  const world = read('src/ui/screens/WorldScreen.tsx');

  assert.match(colony, /const isBusy = activity !== null \|\| expedition !== null/);
  assert.match(colony, /disabled=\{isBusy\}/);
  assert.match(colony, /disabled=\{cat\.expedition !== null\}/);
  assert.match(colony, /Em expedição/);
  assert.match(world, /!cat\.activity && !cat\.expedition/);
  assert.match(world, /if \(leaderIsAway\) return undefined/);
  assert.match(world, /if \(activeExpedition\) \{/);
  assert.match(world, /className="world-away-state"/);
  assert.match(world, /Traga-o de volta/);
  assert.match(world, /goTo\('expedition'\)/);
});

test('expedition controls are touch friendly and zone art keeps pixel rendering', () => {
  const css = read('src/styles/global.css');

  assert.match(css, /\.expedition-cat-option[\s\S]*?min-height: 64px/);
  assert.match(css, /\.expedition-collect,[\s\S]*?min-height: 48px/);
  assert.match(css, /\.expedition-card-art[\s\S]*?image-rendering: pixelated/);
  assert.match(css, /\.expedition-card-hero[\s\S]*?aspect-ratio: 137 \/ 89/);
  assert.match(css, /\.expedition-card-art[\s\S]*?object-fit: contain/);
  assert.match(css, /@media \(min-width: 980px\)[\s\S]*?\.expedition-zone-grid/);
  assert.match(css, /@media \(min-width: 1280px\)[\s\S]*?\.expedition-zone-grid/);
});

test('reward notice labels and renders every expedition trophy icon', () => {
  const modal = read('src/ui/components/OfflineRewardsModal.tsx');
  const icons = read('src/ui/components/GameIcon.tsx');

  assert.match(modal, /inventoryItemLabels/);
  for (const trophy of ['spectralSardine', 'phantomFur', 'grimaldeRelic']) {
    assert.match(icons, new RegExp(`case '${trophy}'`));
  }
});

test('reward notice supports initial focus, Escape and focus restoration', () => {
  const modal = read('src/ui/components/OfflineRewardsModal.tsx');
  const app = read('src/app/App.tsx');
  const screen = read('src/ui/screens/ExpeditionScreen.tsx');

  assert.match(modal, /closeButtonRef\.current\?\.focus\(\)/);
  assert.match(modal, /event\.key === 'Escape'/);
  assert.match(modal, /event\.key !== 'Tab'/);
  assert.match(modal, /event\.shiftKey/);
  assert.match(modal, /getFocusTrapTarget/);
  assert.match(modal, /previousFocus\?\.isConnected/);
  assert.match(modal, /\[aria-current="page"\]/);
  assert.match(modal, /#expedition-title/);
  assert.match(modal, /ref=\{closeButtonRef\}/);
  assert.match(modal, /ref=\{dialogRef\}/);
  assert.match(app, /aria-current=\{screen === tab\.id \? 'page' : undefined\}/);
  assert.match(screen, /id="expedition-title" tabIndex=\{-1\}/);
});

test('focus trap cycles at both edges and leaves native movement inside the dialog', () => {
  const first = { id: 'first' };
  const middle = { id: 'middle' };
  const last = { id: 'last' };
  const focusable = [first, middle, last];

  assert.equal(getFocusTrapTarget(focusable, last, false), first);
  assert.equal(getFocusTrapTarget(focusable, first, true), last);
  assert.equal(getFocusTrapTarget(focusable, middle, false), null);
  assert.equal(getFocusTrapTarget(focusable, null, false), first);
  assert.equal(getFocusTrapTarget(focusable, null, true), last);
});

test('card headings remain below their expedition section headings', () => {
  const screen = read('src/ui/screens/ExpeditionScreen.tsx');
  const css = read('src/styles/global.css');

  assert.match(screen, /<h3 id="active-hunts-title">/);
  assert.match(screen, /<h4>\{cat\.name\}<\/h4>/);
  assert.match(screen, /<h3 id="zones-title">/);
  assert.match(screen, /<h4>\{zone\.name\}<\/h4>/);
  assert.match(screen, /<h5>Possíveis achados<\/h5>/);
  assert.match(css, /\.expedition-loot-promise h5/);
});
