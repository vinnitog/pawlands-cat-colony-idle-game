import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game/data/initialGameState.ts';
import { missionById } from '../src/game/data/missions.ts';
import {
  claimMission,
  describeQuestStatus,
  refreshMissionProgress,
} from '../src/game/systems/missionSystem.ts';
import { addResourcesToState } from '../src/game/systems/economySystem.ts';
import { createGrimalkin } from '../src/game/world/tinyTown.ts';

test('NPC quests carry a giver label', () => {
  assert.equal(missionById.jewelerGems5.giver, 'Vittorio');
  assert.equal(missionById.captureMice25.giver, 'Aldric');
  assert.equal(missionById.crownTribute250.giver, 'Rei Grimalkin');
});

test('every NPC quest references a real mission', () => {
  const map = createGrimalkin();
  const withQuests = map.npcs.filter((npc) => npc.questId);
  assert.ok(withQuests.length >= 3);
  for (const npc of withQuests) {
    assert.ok(missionById[npc.questId], `NPC ${npc.name} points at unknown mission ${npc.questId}`);
  }
});

test('capturing 25 mice completes the blacksmith quest', () => {
  let state = createInitialGameState(1000);
  state = addResourcesToState(state, { mice: 25 });
  state = refreshMissionProgress(state);
  assert.equal(state.missions.captureMice25.completed, true);
});

test('quest status line reflects in-progress, ready, and claimed', () => {
  let state = refreshMissionProgress(createInitialGameState(1000));

  const inProgress = describeQuestStatus(state, 'jewelerGems5');
  assert.match(inProgress, /Meu pedido/);
  assert.match(inProgress, /0\/5/);

  state = {
    ...state,
    totals: {
      ...state.totals,
      resourcesEarned: { ...state.totals.resourcesEarned, gems: 5 },
    },
  };
  state = refreshMissionProgress(state);
  assert.equal(state.missions.jewelerGems5.completed, true);
  assert.match(describeQuestStatus(state, 'jewelerGems5'), /Mural de Grimalkin/);

  const claimed = claimMission(state, 'jewelerGems5');
  assert.equal(claimed.ok, true);
  if (!claimed.ok) return;
  assert.match(describeQuestStatus(claimed.state, 'jewelerGems5'), /Já acertamos/);
});
