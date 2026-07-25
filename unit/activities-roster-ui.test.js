import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { activityById } from '../src/game/data/activities.ts';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');

test('activities select any free colony cat without changing leadership', () => {
  const screen = read('src/ui/screens/ActivitiesScreen.tsx');
  const card = read('src/ui/components/ActivityCard.tsx');

  assert.match(screen, /state\.cats\.map/);
  assert.match(screen, /\?\? state\.cats\.find\(isCatFree\)/);
  assert.match(screen, /disabled=\{!free\}/);
  assert.match(screen, /startActivity\(activity\.id, \{ catId: selectedCat\.id \}\)/);
  assert.doesNotMatch(screen, /setLeader/);
  assert.match(card, /cat\?: Cat/);
  assert.match(card, /Iniciar com \$\{cat\.name\}/);
  assert.doesNotMatch(card, /getLeader/);
});

test('activity cards render the complete reward catalog including chance drops', () => {
  const card = read('src/ui/components/ActivityCard.tsx');
  const explore = activityById.exploreYard;
  const baseEntryCount =
    Object.keys(explore.rewards.resources ?? {}).length +
    Number(Boolean(explore.rewards.xp)) +
    Number(Boolean(explore.rewards.energy)) +
    Number(Boolean(explore.rewards.gemDrop)) +
    (explore.rewards.rareItems?.length ?? 0);

  assert.match(card, /resourceEntries\.map/);
  assert.match(card, /activity\.rewards\.xp/);
  assert.match(card, /activity\.rewards\.energy/);
  assert.match(card, /activity\.rewards\.gemDrop/);
  assert.match(card, /activity\.rewards\.rareItems/);
  assert.match(card, /DAILY_BONUS_GEM_CHANCE/);
  assert.match(card, /Sorte e melhorias aumentam as chances/);
  assert.doesNotMatch(card, /\.slice\(0, 3\)/);
  assert.equal(baseEntryCount, 11);
  assert.equal(baseEntryCount + 1, 12);
});

test('reward notices identify each cat and activity and queue later batches', () => {
  const provider = read('src/app/gameProvider.tsx');
  const modal = read('src/ui/components/OfflineRewardsModal.tsx');

  assert.match(provider, /activityCompletions\?: ActivityCompletionDetail\[\]/);
  assert.match(provider, /setRewardNotices\(\(current\) => \[\.\.\.current, notice\]\)/);
  assert.match(provider, /setRewardNotices\(\(current\) => current\.slice\(1\)\)/);
  assert.match(modal, /completion\.catName/);
  assert.match(modal, /completion\.activityName/);
  assert.match(modal, /completion\.levelsGained/);
});

test('activity timer resolves against the latest state without StrictMode-replayed side effects', () => {
  const provider = read('src/app/gameProvider.tsx');

  assert.match(provider, /const stateRef = useRef<GameState>\(boot\.state\)/);
  assert.match(provider, /const next = updater\(stateRef\.current\)/);
  assert.match(
    provider,
    /updateState\(\(current\) => \{[\s\S]*?completeFinishedActivities\(current, now\)/,
  );
  assert.match(provider, /stateRef\.current = nextState;[\s\S]*?setState\(nextState\)/);
  assert.doesNotMatch(provider, /setState\(\(current\) =>/);
  assert.doesNotMatch(
    provider,
    /\[enqueueRewardNotice, hasBusyCat, state\]/,
  );
});
