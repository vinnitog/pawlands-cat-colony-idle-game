import { gearById, isGearId } from '../data/gear.ts';
import type { Cat } from '../models/cat.ts';
import { isGearSlot, type GearId, type GearSlot } from '../models/gear.ts';
import type { GameState } from '../models/save.ts';
import { getCatAttributePower, getEquipmentPower } from '../rules/powerRules.ts';
import { updateCat } from './colonySystem.ts';

export {
  getCatAttributePower,
  getEquipmentPower,
} from '../rules/powerRules.ts';

export type ChangeEquipmentResult =
  | { ok: true; state: GameState }
  | { ok: false; state: GameState; reason: string };

function getAvailableCat(state: GameState, catId: string): Cat | string {
  const cat = state.cats.find((candidate) => candidate.id === catId);
  if (!cat) return 'Esse gato não faz parte da colônia.';
  if (cat.activity || cat.expedition) {
    return `${cat.name} precisa voltar para casa antes de trocar equipamento.`;
  }
  return cat;
}

export function equipGear(
  state: GameState,
  catId: string,
  slot: GearSlot,
  gearId: GearId,
): ChangeEquipmentResult {
  if (!isGearSlot(slot)) {
    return { ok: false, state, reason: 'Esse espaço de equipamento não existe.' };
  }
  const cat = getAvailableCat(state, catId);
  if (typeof cat === 'string') return { ok: false, state, reason: cat };
  if (!isGearId(gearId) || gearById[gearId].slot !== slot) {
    return { ok: false, state, reason: 'Essa peça não serve neste espaço.' };
  }
  if (cat.equipment[slot] === gearId) {
    return { ok: false, state, reason: `${gearById[gearId].name} já está equipada.` };
  }
  if (state.inventory[gearId] < 1) {
    return { ok: false, state, reason: 'Essa peça não está disponível no inventário.' };
  }

  const previousGearId = cat.equipment[slot];
  const inventory = {
    ...state.inventory,
    [gearId]: state.inventory[gearId] - 1,
  };
  if (previousGearId) inventory[previousGearId] += 1;

  const stateWithInventory = { ...state, inventory };
  return {
    ok: true,
    state: updateCat(stateWithInventory, catId, (current) => ({
      ...current,
      equipment: { ...current.equipment, [slot]: gearId },
    })),
  };
}

export function unequipGear(
  state: GameState,
  catId: string,
  slot: GearSlot,
): ChangeEquipmentResult {
  if (!isGearSlot(slot)) {
    return { ok: false, state, reason: 'Esse espaço de equipamento não existe.' };
  }
  const cat = getAvailableCat(state, catId);
  if (typeof cat === 'string') return { ok: false, state, reason: cat };
  const gearId = cat.equipment[slot];
  if (!gearId) {
    return { ok: false, state, reason: 'Não há peça equipada neste espaço.' };
  }

  const stateWithInventory = {
    ...state,
    inventory: {
      ...state.inventory,
      [gearId]: state.inventory[gearId] + 1,
    },
  };
  return {
    ok: true,
    state: updateCat(stateWithInventory, catId, (current) => ({
      ...current,
      equipment: { ...current.equipment, [slot]: null },
    })),
  };
}
