import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(file) {
  return readFileSync(join(root, file), 'utf8');
}

test('inventory exposes trophy values, total, and safe one/all sale actions', () => {
  const inventory = read('src/ui/screens/InventoryScreen.tsx');
  const provider = read('src/app/gameProvider.tsx');
  const css = read('src/styles/global.css');

  assert.match(inventory, /Troféus do Além/);
  assert.match(inventory, /trophyTotalValue/);
  assert.match(inventory, /Valor total:/);
  assert.match(inventory, /moedas cada/);
  assert.match(inventory, /const \[pendingSaleId, setPendingSaleId\] = useState/);
  assert.match(inventory, /const requestSellAll =/);
  assert.match(inventory, /const confirmSellAll =/);
  assert.match(
    inventory,
    /const sellOne =[\s\S]*?setPendingSaleId\(null\);[\s\S]*?setSaleAnnouncement\(''\);[\s\S]*?sellTrophy\(trophyId, 'one'\)/,
  );
  assert.match(inventory, /sellTrophy\(trophyId, 'all'\)/);
  assert.match(inventory, /Vender 1/);
  assert.match(inventory, /Vender tudo/);
  assert.match(inventory, /Confirmar \{quantity\} por \{quantity \* trophy\.sellValue\} moedas/);
  assert.match(inventory, />\s*Cancelar\s*</);
  assert.match(inventory, /aria-live="polite"/);
  assert.doesNotMatch(inventory, /window\.confirm/);
  assert.match(inventory, /cancelButtonRefs\.current\[pendingSaleId\]\?\.focus\(\)/);
  assert.match(inventory, /sellAllButtonRefs\.current\[returnFocusSaleId\]/);
  assert.match(
    inventory,
    /sellAllButtonRefs\.current\[trophyId\] = node;[\s\S]*?Preparar venda de todos/,
  );
  assert.match(inventory, /trophyHeadingRef\.current[\s\S]*?\?\? trophyPanelRef\.current/);
  assert.match(inventory, /ref=\{trophyHeadingRef\}[\s\S]*?tabIndex=\{-1\}/);
  assert.match(inventory, /ref=\{trophyPanelRef\}[\s\S]*?tabIndex=\{-1\}/);
  assert.match(provider, /sellTrophyInState/);
  assert.match(provider, /saveGame\(result\.state\)/);
  assert.match(css, /\.trophy-sale-actions button[\s\S]*?min-height: 44px/);
});

test('trophy inventory hides zero counts and guides the empty state on narrow screens', () => {
  const inventory = read('src/ui/screens/InventoryScreen.tsx');
  const css = read('src/styles/global.css');

  assert.match(inventory, /trophyKeys\.filter\(\(trophyId\) => state\.inventory\[trophyId\] > 0\)/);
  assert.match(inventory, /possessedTrophyKeys\.length > 0/);
  assert.match(inventory, /O saco do Além está vazio/);
  assert.match(inventory, /Envie seus gatos em expedição/);
  assert.match(css, /\.trophy-panel-heading \{[\s\S]*?display: grid/);
  assert.match(
    css,
    /@media \(min-width: 720px\)[\s\S]*?\.trophy-panel-heading \{[\s\S]*?grid-template-columns:/,
  );
});

test('trophy rarity is authoritative and text-labelled in inventory and rewards', () => {
  const trophies = read('src/game/data/trophies.ts');
  const inventory = read('src/ui/screens/InventoryScreen.tsx');
  const rewardNotice = read('src/ui/components/OfflineRewardsModal.tsx');

  assert.match(trophies, /type ExpeditionTrophyRarity = 'common' \| 'uncommon' \| 'rare' \| 'legendary'/);
  for (const label of ['Comum', 'Incomum', 'Raro', 'Lendário']) {
    assert.match(trophies, new RegExp(label));
  }
  assert.match(inventory, /expeditionTrophyRarityLabels\[trophy\.rarity\]/);
  assert.match(rewardNotice, /isExpeditionTrophyKey\(key\)/);
  assert.match(rewardNotice, /expeditionTrophyRarityLabels\[trophyItem\.rarity\]/);
});

test('the final zone display matches the towerless art while preserving its stable id and path', () => {
  const zones = read('src/game/data/zones.ts');
  const screen = read('src/ui/screens/ExpeditionScreen.tsx');
  const plan = read('docs/EXPEDITION_PLAN.md');

  assert.match(zones, /id: 'eclipseTower',[\s\S]*?name: 'Limiar do Eclipse'/);
  assert.match(zones, /Na fronteira entre luz e sombra/);
  assert.doesNotMatch(zones, /No topo da torre/);
  assert.match(screen, /eclipseTower: 'eclipse-tower\.png'/);
  assert.match(plan, /Limiar do Eclipse/);
  assert.doesNotMatch(plan, /Torre do Eclipse/);
});

test('TrophyArt and reward icons cover every E4 trophy with audited local items', () => {
  const art = read('src/ui/components/TrophyArt.tsx');
  const icons = read('src/ui/components/GameIcon.tsx');
  const trophies = read('src/game/data/trophies.ts');
  const expedition = read('src/ui/screens/ExpeditionScreen.tsx');

  assert.match(art, /expeditionTrophyById/);
  assert.match(art, /import\.meta\.env\.BASE_URL/);
  assert.match(art, /<GameIcon name=\{trophyId\}/);
  assert.match(expedition, /<TrophyArt trophyId=\{loot\.item\}/);
  for (const [id, file] of [
    ['ancientBoneCharm', 'bone-charm.png'],
    ['soulAmulet', 'spirit-amulet.png'],
    ['eclipseShard', 'spirit-gem.png'],
  ]) {
    assert.match(trophies, new RegExp(file.replace('.', '\\.')));
    assert.match(icons, new RegExp(`case '${id}'`));
  }
});

test('E4 remains scoped to trophies, zones, sales, and balance', () => {
  const trophySystem = read('src/game/systems/trophySystem.ts');

  assert.match(trophySystem, /isExpeditionTrophyKey/);
  assert.match(trophySystem, /addResourcesToState/);
  assert.match(trophySystem, /refreshMissionProgress/);
  assert.doesNotMatch(trophySystem, /GearId|SpecialItemKey|sellGear|sellSpecial/);
});

test('E4 balance assumptions and delivery status are documented', () => {
  const plan = read('docs/EXPEDITION_PLAN.md');
  const roadmap = read('docs/ROADMAP.md');

  for (const expected of ['25,9', '48,7', '77,8', '121,8', '140,4']) {
    assert.match(plan, new RegExp(expected));
  }
  assert.match(plan, /cap nominal permanece em 8 horas/);
  assert.match(plan, /hipótese inicial de[\r\n ]+playtest/);
  assert.match(plan, /escala multi-gato e o endgame/);
  assert.match(plan, /schema \*\*v5\*\*/);
  for (const zoneRow of [
    /Campos Sussurrantes[^\r\n]*\| 0,2% \|/,
    /Bosque das Brumas[^\r\n]*\| 0,4% \|/,
    /Ruínas de Grimalkin[^\r\n]*\| 0,8% \|/,
    /Pântano das Almas[^\r\n]*\| 1,0% \|/,
    /Limiar do Eclipse[^\r\n]*\| 1,2% \|/,
  ]) {
    assert.match(plan, zoneRow);
  }
  assert.match(roadmap, /Expedição idle no Além — ENTREGUE \(E0→E4\)/);
  assert.match(roadmap, /Loot tables de expedição — ENTREGUE \(E4\)/);
});
