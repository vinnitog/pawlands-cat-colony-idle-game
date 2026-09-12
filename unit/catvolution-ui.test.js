import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');

test('Catvolution overview exposes the complete MVP loop and every mobile secondary destination', () => {
  const app = read('src/app/App.tsx');
  const overview = read('src/ui/screens/OverviewScreen.tsx');

  assert.match(app, /useState<ScreenId>\('overview'\)/);
  for (const screen of ['overview', 'colony', 'evolution', 'expedition', 'world']) {
    assert.match(app, new RegExp(`id: '${screen}'[^\n]*mobilePrimary: true`));
  }
  for (const screen of ['activities', 'missions', 'inventory', 'upgrades', 'timeline', 'settings']) {
    assert.match(overview, new RegExp(`screen: '${screen}'`));
  }
  assert.match(overview, /agir|esperar|evolução|timeline/i);
});

test('research UI communicates active timer, costs, prerequisites, bonuses, and blocked reasons', () => {
  const screen = read('src/ui/screens/EvolutionScreen.tsx');
  assert.match(screen, /active\.endsAt - now/);
  assert.match(screen, /formatResourceList\(node\.cost\)/);
  assert.match(screen, /Requer:/);
  assert.match(screen, /getResearchBlockReason/);
  assert.match(screen, /reason \? <em>\{reason\}<\/em>/);
  assert.match(screen, /activityDurationMultiplier/);
  assert.match(screen, /activityXpMultiplier/);
  assert.match(screen, /rareChanceBonus/);
});

test('prestige uses an explicit two-step confirmation and explains what resets', () => {
  const screen = read('src/ui/screens/TimelineScreen.tsx');
  assert.match(screen, /const \[confirming, setConfirming\] = useState\(false\)/);
  assert.match(screen, /reinicia colônia, recursos, equipamentos, missões e pesquisas/);
  assert.match(screen, /não pode ser desfeita/);
  assert.doesNotMatch(screen, /window\.confirm/);
  assert.match(screen, /disabled=\{!readiness\.ready\}/);
  assert.match(screen, /cancelButtonRef\.current\?\.focus\(\)/);
  assert.match(screen, /timelineActionRef\.current\?\.focus\(\)/);
});

test('mobile shell uses five thumb destinations and Android safe areas', () => {
  const css = read('src/styles/global.css');
  assert.match(css, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /\.side-nav \.mobile-secondary\s*\{ display: none; \}/);
  assert.match(css, /min-height: 58px/);
});

test('manifest and document metadata use the new product identity', () => {
  const manifest = JSON.parse(read('public/manifest.webmanifest'));
  const html = read('index.html');
  assert.equal(manifest.name, 'Catvolution: Infinite Idle');
  assert.equal(manifest.short_name, 'Catvolution');
  assert.match(html, /<title>Catvolution: Infinite Idle<\/title>/);
});
