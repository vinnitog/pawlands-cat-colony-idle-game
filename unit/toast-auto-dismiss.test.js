import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const app = readFileSync(join(process.cwd(), 'src/app/App.tsx'), 'utf8');
const provider = readFileSync(join(process.cwd(), 'src/app/gameProvider.tsx'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');

function sourceBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `missing source marker: ${endMarker}`);
  return source.slice(start, end);
}

function numericCssProperty(block, property) {
  const match = block.match(new RegExp(`${property}:\\s*(\\d+)`));
  assert.ok(match, `missing numeric CSS property: ${property}`);
  return Number(match[1]);
}

test('quick toast gets a fresh five-second timer per message event with cleanup and manual close', () => {
  assert.match(app, /const TOAST_AUTO_DISMISS_MS = 5_000/);
  assert.match(
    app,
    /useEffect\(\(\) => \{[\s\S]*?if \(!toast \|\| rewardNotice\) return undefined;[\s\S]*?window\.setTimeout\([\s\S]*?dismissToastRef\.current\(\)[\s\S]*?TOAST_AUTO_DISMISS_MS[\s\S]*?window\.clearTimeout\(timeoutId\)[\s\S]*?\}, \[rewardNotice, toast, toastRevision\]\)/,
  );
  assert.match(
    app,
    /toast && !rewardNotice[\s\S]*?<div key=\{toastRevision\} className="toast" role="status" aria-atomic="true">/,
  );
  assert.match(app, /onClick=\{dismissToast\}/);
  assert.match(
    provider,
    /const showToast = useCallback\(\(message: string\) => \{[\s\S]*?setToast\(message\);[\s\S]*?setToastRevision\(\(current\) => current \+ 1\)/,
  );
});

test('reward notices keep their explicit modal flow and pause background toast timing', () => {
  assert.match(
    app,
    /rewardNotice \? <OfflineRewardsModal notice=\{rewardNotice\} onClose=\{dismissRewardNotice\}/,
  );
  const toastTimerEffect = app.slice(
    app.indexOf('if (!toast || rewardNotice) return undefined;'),
    app.indexOf('if (!state.onboarded)'),
  );
  assert.match(toastTimerEffect, /rewardNotice/);
  assert.doesNotMatch(toastTimerEffect, /dismissRewardNotice/);
});

test('all toast producers restart the revision while direct state writes stay encapsulated', () => {
  const showToastBlock = sourceBlock(
    provider,
    'const showToast = useCallback',
    'const dismissToast = useCallback',
  );
  const dismissToastBlock = sourceBlock(
    provider,
    'const dismissToast = useCallback',
    'const queueGameFeelCues = useCallback',
  );
  const directToastWrites = provider.match(/\bsetToast\(/g) ?? [];

  assert.equal(directToastWrites.length, 2);
  assert.match(showToastBlock, /setToast\(message\)/);
  assert.match(showToastBlock, /setToastRevision\(\(current\) => current \+ 1\)/);
  assert.match(dismissToastBlock, /setToast\(null\)/);

  const producerNames = [
    'startActivity',
    'startExpedition',
    'collectExpedition',
    'recruitCat',
    'setLeader',
    'equipGear',
    'unequipGear',
    'buyUpgrade',
    'claimMission',
    'buyShopItem',
    'sellTrophy',
    'resetGame',
  ];

  for (const [index, producerName] of producerNames.entries()) {
    const nextProducerName = producerNames[index + 1];
    const startMarker = `const ${producerName} = useCallback`;
    const endMarker = nextProducerName
      ? `const ${nextProducerName} = useCallback`
      : 'const value = useMemo';
    const producerBlock = sourceBlock(provider, startMarker, endMarker);

    assert.match(producerBlock, /\bshowToast\(/, `${producerName} must publish through showToast`);
    assert.doesNotMatch(
      producerBlock,
      /\bsetToast\(/,
      `${producerName} must not bypass toast revision`,
    );
  }
});

test('toast remains readable and tappable beside the mobile nav and below reward modals', () => {
  const toastBlock = sourceBlock(css, '.toast {', '.toast span {');
  const toastTextBlock = sourceBlock(css, '.toast span {', '.toast button {');
  const toastButtonBlock = sourceBlock(css, '.toast button {', '.modal-backdrop {');
  const modalBlock = sourceBlock(css, '.modal-backdrop {', '.reward-modal {');
  const effectBlock = sourceBlock(css, '.game-feel-effect {', '.game-feel-svg {');
  const mobileBlock = sourceBlock(
    css,
    '@media (max-width: 760px)',
    '@media (max-width: 420px)',
  );

  assert.match(mobileBlock, /--nav-w:\s*60px/);
  assert.match(toastBlock, /left:\s*calc\(var\(--nav-w\) \+ 12px\)/);
  assert.match(
    toastBlock,
    /width:\s*min\(calc\(100% - var\(--nav-w\) - 24px\), 520px\)/,
  );
  assert.match(toastTextBlock, /min-width:\s*0/);
  assert.match(toastTextBlock, /overflow-wrap:\s*anywhere/);
  assert.match(toastButtonBlock, /min-height:\s*44px/);

  const toastLayer = numericCssProperty(toastBlock, 'z-index');
  assert.ok(toastLayer > numericCssProperty(effectBlock, 'z-index'));
  assert.ok(toastLayer < numericCssProperty(modalBlock, 'z-index'));
});
