import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(file) {
  return readFileSync(join(root, file), 'utf8');
}

test('colony exposes power breakdown and accessible compatible gear controls', () => {
  const colony = read('src/ui/screens/ColonyScreen.tsx');
  const provider = read('src/app/gameProvider.tsx');

  assert.match(colony, /getCatAttributePower/);
  assert.match(colony, /getEquipmentPower/);
  assert.match(colony, /getCatPower/);
  assert.match(colony, /gearBySlot\[slot\]\.filter/);
  assert.match(colony, /state\.inventory\[item\.id\] > 0/);
  assert.match(colony, /<label htmlFor=\{controlId\}>Peça disponível<\/label>/);
  assert.match(colony, /disabled=\{busy \|\| availableGear\.length === 0\}/);
  assert.match(colony, /Trocas ficam disponíveis quando/);
  assert.match(colony, /Equipar/);
  assert.match(colony, /Trocar/);
  assert.match(colony, /Desequipar/);
  assert.match(colony, /gearTierLabels/);
  assert.match(colony, /Atributos \+ nível/);
  assert.match(colony, /aria-label=[\s\S]*?gearSlotLabels\[slot\][\s\S]*?cat\.name/);
  assert.match(colony, /className="item-grid colony-grid"/);
  assert.match(provider, /equipGearInState/);
  assert.match(provider, /unequipGearInState/);
});

test('blacksmith shows both currencies and gear with local audited art', () => {
  const shop = read('src/ui/components/Shop.tsx');
  const gearArt = read('src/ui/components/GearArt.tsx');
  const css = read('src/styles/global.css');

  assert.match(shop, /aria-label="Seus saldos"/);
  assert.match(shop, /<GameIcon name="coins"/);
  assert.match(shop, /<GameIcon name="gems"/);
  assert.match(shop, /item\.coinCost !== undefined/);
  assert.match(shop, /coins >= item\.coinCost/);
  assert.match(shop, /gems >= item\.gemCost/);
  assert.match(shop, /<GearArt gearId=\{gearId\}/);
  assert.match(shop, /gearTierLabels\[gearItem\.tier\]/);
  assert.match(shop, /Disponíveis: \{state\.inventory\[gearItem\.id\]\}/);
  assert.match(shop, /Equipadas: \{equippedCount\}/);
  assert.match(gearArt, /import\.meta\.env\.BASE_URL/);
  assert.match(gearArt, /className="gear-art-mark"/);
  assert.match(gearArt, />★<\/span>/);
  assert.match(css, /\.gear-art--rare/);
  assert.match(css, /\.gear-art-mark/);
  assert.match(css, /\.equipment-slot select[\s\S]*?min-height: 44px/);
  assert.match(css, /\.equipment-slot-actions button[\s\S]*?min-height: 44px/);
  assert.match(css, /@media \(min-width: 980px\)[\s\S]*?\.item-grid\.colony-grid[\s\S]*?repeat\(2/);
  assert.match(css, /@media \(min-width: 1280px\)[\s\S]*?\.item-grid\.colony-grid[\s\S]*?repeat\(3/);
});

test('reward notice and expedition preview recognize all gear ids', () => {
  const gearData = read('src/game/data/gear.ts');
  const gearArt = read('src/ui/components/GearArt.tsx');
  const expedition = read('src/ui/screens/ExpeditionScreen.tsx');
  const inventory = read('src/ui/screens/InventoryScreen.tsx');
  const rewards = read('src/ui/components/OfflineRewardsModal.tsx');

  for (const gearId of [
    'ironClaw',
    'guardArmor',
    'ironHelm',
    'scoutBoots',
    'mistFang',
    'grimaldeAegis',
    'soulwalkerBoots',
    'eclipseCrown',
  ]) {
    assert.match(gearData, new RegExp(`id: '${gearId}'`));
  }
  assert.match(gearArt, /item\.visual\.kind === 'image'/);
  assert.match(gearArt, /<GameIcon name=\{item\.visual\.name\}/);
  assert.match(expedition, /zone\.gearTable\.map/);
  assert.match(expedition, /Raro ·/);
  assert.match(inventory, /As quantidades abaixo não incluem peças equipadas/);
  assert.match(inventory, /gearItemKeys\.map/);
  assert.match(inventory, /gearTierLabels\[item\.tier\]/);
  assert.match(inventory, /equippedCats\.map\(\(cat\) => `\$\{cat\.name\} ×1`\)/);
  assert.match(rewards, /gearTierLabels\[gearItem\.tier\]/);
  assert.match(rewards, /gearItem \? \([\s\S]*?<GearArt gearId=\{gearItem\.id\}/);
});

test('shop modal supports keyboard containment, dismissal, and focus restoration', () => {
  const shop = read('src/ui/components/Shop.tsx');

  assert.match(shop, /aria-modal="true"/);
  assert.match(shop, /aria-labelledby=\{`shop-title-/);
  assert.match(shop, /querySelector<HTMLElement>\('button:not\(\[disabled\]\)'\)\?\.focus\(\)/);
  assert.match(shop, /event\.key === 'Escape'/);
  assert.match(shop, /event\.key !== 'Tab'/);
  assert.match(shop, /event\.shiftKey/);
  assert.match(shop, /getFocusTrapTarget/);
  assert.match(shop, /previousFocus\?\.isConnected/);
  assert.match(shop, /\[aria-current="page"\]/);
  assert.match(shop, /className="modal-backdrop" onClick=\{onClose\}/);
});

test('E3 expedition plan records the shipped balance and save contract', () => {
  const plan = read('docs/EXPEDITION_PLAN.md');

  assert.match(plan, /Garra de Ferro[\s\S]*100 moedas/);
  assert.match(plan, /Armadura do Guarda[\s\S]*140 moedas/);
  assert.match(plan, /Presa da Bruma[\s\S]*0,15% por pulso/);
  assert.match(plan, /Égide de Grimalde[\s\S]*0,10% por pulso/);
  assert.match(plan, /save sobe de v3 para \*\*v4\*\*/i);
});
