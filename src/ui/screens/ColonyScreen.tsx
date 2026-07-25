import { useState } from 'react';
import { activities, activityById } from '../../game/data/activities.ts';
import { expeditionZoneById } from '../../game/data/zones.ts';
import { gearById, gearBySlot, gearTierLabels } from '../../game/data/gear.ts';
import type { Cat } from '../../game/models/cat.ts';
import { catClassById } from '../../game/models/catClass.ts';
import type { GearId, GearSlot } from '../../game/models/gear.ts';
import type { GameState } from '../../game/models/save.ts';
import { getEffectiveActivityEndsAt } from '../../game/systems/activitySystem.ts';
import { getRecruitCost, MAX_COLONY_SIZE } from '../../game/systems/colonySystem.ts';
import { getDailyBonusActivityId } from '../../game/systems/dailyBonusSystem.ts';
import {
  getCatAttributePower,
  getEquipmentPower,
} from '../../game/systems/equipmentSystem.ts';
import { getCatPower } from '../../game/systems/expeditionSystem.ts';
import { useGame } from '../../app/gameProvider.tsx';
import { CatSprite } from '../components/CatSprite.tsx';
import { GearArt } from '../components/GearArt.tsx';
import { GameIcon } from '../components/GameIcon.tsx';
import { formatDuration } from '../formatters.ts';
import { useNow } from '../useNow.ts';

type AssignModalProps = {
  cat: Cat;
  onPick(activityId: (typeof activities)[number]['id']): void;
  onClose(): void;
};

const gearSlotLabels: Record<GearSlot, string> = {
  weapon: 'Arma',
  armor: 'Armadura',
};

type EquipmentSlotControlProps = {
  cat: Cat;
  slot: GearSlot;
  state: GameState;
  busy: boolean;
  onEquip(gearId: GearId): void;
  onUnequip(): void;
};

function EquipmentSlotControl({
  cat,
  slot,
  state,
  busy,
  onEquip,
  onUnequip,
}: EquipmentSlotControlProps) {
  const [selectedGearId, setSelectedGearId] = useState<GearId | ''>('');
  const equippedGearId = cat.equipment[slot];
  const equippedGear = equippedGearId ? gearById[equippedGearId] : null;
  const availableGear = gearBySlot[slot].filter((item) => state.inventory[item.id] > 0);
  const selectedIsAvailable =
    selectedGearId !== '' && state.inventory[selectedGearId] > 0;
  const selectedGear = selectedGearId ? gearById[selectedGearId] : null;
  const controlId = `gear-${cat.id}-${slot}`;

  return (
    <div
      className="equipment-slot"
      role="group"
      aria-labelledby={`${controlId}-title`}
    >
      <div className="equipment-current">
        {equippedGearId ? (
          <GearArt gearId={equippedGearId} />
        ) : (
          <span className="equipment-empty-art" aria-hidden="true">—</span>
        )}
        <span>
          <strong id={`${controlId}-title`}>{gearSlotLabels[slot]}</strong>
          <small>
            {equippedGear
              ? `${equippedGear.name} · ${gearTierLabels[equippedGear.tier]} · +${equippedGear.power} poder`
              : 'Espaço vazio'}
          </small>
        </span>
      </div>

      <label htmlFor={controlId}>Peça disponível</label>
      <select
        id={controlId}
        value={selectedGearId}
        disabled={busy || availableGear.length === 0}
        onChange={(event) => setSelectedGearId(event.target.value as GearId | '')}
      >
        <option value="">
          {availableGear.length > 0 ? `Escolha uma ${gearSlotLabels[slot].toLowerCase()}` : 'Nenhuma peça disponível'}
        </option>
        {availableGear.map((item) => (
          <option value={item.id} key={item.id}>
            {item.name} · {gearTierLabels[item.tier]} · +{item.power} poder · {state.inventory[item.id]}×
          </option>
        ))}
      </select>

      <div className="equipment-slot-actions">
        <button
          className="primary-action"
          type="button"
          disabled={busy || !selectedIsAvailable}
          aria-label={
            selectedGear
              ? `${equippedGear ? 'Trocar' : 'Equipar'} ${gearSlotLabels[slot].toLowerCase()} de ${cat.name} por ${selectedGear.name}, ${gearTierLabels[selectedGear.tier]}`
              : `Escolha uma peça para ${gearSlotLabels[slot].toLowerCase()} de ${cat.name}`
          }
          onClick={() => {
            if (!selectedGearId) return;
            onEquip(selectedGearId);
            setSelectedGearId('');
          }}
        >
          {equippedGear ? 'Trocar' : 'Equipar'}
        </button>
        <button
          className="ghost-action"
          type="button"
          disabled={busy || !equippedGear}
          aria-label={
            equippedGear
              ? `Desequipar ${equippedGear.name} de ${cat.name}, espaço ${gearSlotLabels[slot].toLowerCase()}`
              : `${cat.name} não possui ${gearSlotLabels[slot].toLowerCase()} equipada`
          }
          onClick={onUnequip}
        >
          Desequipar
        </button>
      </div>
    </div>
  );
}

type EquipmentPanelProps = {
  cat: Cat;
  state: GameState;
  busy: boolean;
  onEquip(slot: GearSlot, gearId: GearId): void;
  onUnequip(slot: GearSlot): void;
};

function EquipmentPanel({
  cat,
  state,
  busy,
  onEquip,
  onUnequip,
}: EquipmentPanelProps) {
  const attributePower = getCatAttributePower(cat);
  const equipmentPower = getEquipmentPower(cat);

  return (
    <section className="cat-equipment" aria-labelledby={`equipment-title-${cat.id}`}>
      <div className="cat-equipment-heading">
        <h4 id={`equipment-title-${cat.id}`}>Equipamento</h4>
        <dl className="equipment-power" aria-label={`Poder de ${cat.name}`}>
          <div>
            <dt>Atributos + nível</dt>
            <dd>{attributePower}</dd>
          </div>
          <div>
            <dt>Equip.</dt>
            <dd>+{equipmentPower}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{getCatPower(cat)}</dd>
          </div>
        </dl>
      </div>
      {busy ? (
        <p className="equipment-lock">
          Trocas ficam disponíveis quando {cat.name} voltar para casa.
        </p>
      ) : null}
      <div className="equipment-slots">
        {(['weapon', 'armor'] as GearSlot[]).map((slot) => (
          <EquipmentSlotControl
            key={slot}
            cat={cat}
            slot={slot}
            state={state}
            busy={busy}
            onEquip={(gearId) => onEquip(slot, gearId)}
            onUnequip={() => onUnequip(slot)}
          />
        ))}
      </div>
    </section>
  );
}

function AssignActivityModal({ cat, onPick, onClose }: AssignModalProps) {
  const bonusId = getDailyBonusActivityId();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="reward-modal shop-modal"
        role="dialog"
        aria-label={`Designar atividade para ${cat.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="eyebrow">{cat.name}</p>
        <h2>Designar atividade</h2>
        <div className="shop-balance">
          <GameIcon name="energy" />
          <strong>{cat.energy}</strong>
          <span>/ {cat.maxEnergy} energia</span>
        </div>

        <ul className="shop-list">
          {activities.map((activity) => {
            const hasEnergy = cat.energy >= activity.energyCost;
            return (
              <li className="shop-item" key={activity.id}>
                <div>
                  <strong>
                    {activity.name}
                    {activity.id === bonusId ? ' ★' : ''}
                  </strong>
                  <p className="muted-text">
                    {formatDuration(activity.durationMs)} ·{' '}
                    {activity.energyCost > 0 ? `-${activity.energyCost} energia` : 'recupera energia'}
                  </p>
                </div>
                <button
                  type="button"
                  className="primary-action shop-buy"
                  disabled={!hasEnergy}
                  onClick={() => onPick(activity.id)}
                >
                  <GameIcon name={activity.id} />
                  Iniciar
                </button>
              </li>
            );
          })}
        </ul>

        <button type="button" className="shop-close" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}

export function ColonyScreen() {
  const {
    state,
    recruitCat,
    setLeader,
    startActivity,
    equipGear,
    unequipGear,
  } = useGame();
  const now = useNow();
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const recruitCost = getRecruitCost(state);
  const canAfford = recruitCost !== null && state.resources.gems >= recruitCost;
  const assigningCat = assigningId ? state.cats.find((cat) => cat.id === assigningId) : undefined;

  return (
    <div className="screen-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Refúgio de Grimalkin</p>
          <h2>Colônia</h2>
        </div>
        <div className="colony-heading-side">
          <div className="colony-trio" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}art/cat_knight_1.png`} alt="" loading="lazy" />
            <img src={`${import.meta.env.BASE_URL}art/cat_king_1.png`} alt="" loading="lazy" />
            <img src={`${import.meta.env.BASE_URL}art/cat_viking_1.png`} alt="" loading="lazy" />
          </div>
          <strong>
            {state.cats.length}/{MAX_COLONY_SIZE} gatos
          </strong>
        </div>
      </div>

      <div className="item-grid colony-grid">
        {state.cats.map((cat) => {
          const classDef = catClassById[cat.catClass];
          const isLeader = cat.id === state.leaderId;
          const activity = cat.activity ? activityById[cat.activity.activityId] : null;
          const expedition = cat.expedition ? expeditionZoneById[cat.expedition.zoneId] : null;
          const isBusy = activity !== null || expedition !== null;
          const remainingMs = cat.activity
            ? Math.max(0, getEffectiveActivityEndsAt(cat.activity) - now)
            : 0;
          const energyPct = Math.min(100, Math.floor((cat.energy / cat.maxEnergy) * 100));

          return (
            <article className={`item-card colony-card${isLeader ? ' colony-card--leader' : ''}`} key={cat.id}>
              {isLeader ? <span className="leader-chip">★ Líder</span> : null}
              <div className="colony-card-head">
                <div className="colony-portrait">
                  <CatSprite hero={cat.catClass} scale={3} label={`${cat.name}, ${classDef.role}`} />
                </div>
                <div>
                  <h3>{cat.name}</h3>
                  <p className="muted-text">
                    {classDef.name} · Nv {cat.level}
                  </p>
                </div>
              </div>

              <div className="meter-group">
                <label>
                  <span>
                    <GameIcon name="energy" />
                    Energia
                  </span>
                  <strong>
                    {cat.energy}/{cat.maxEnergy}
                  </strong>
                </label>
                <div className="meter energy">
                  <span style={{ width: `${energyPct}%` }} />
                </div>
              </div>

              <p className="colony-activity">
                {activity ? (
                  <>
                    <GameIcon name={activity.id} />
                    {activity.name} · {formatDuration(remainingMs)}
                  </>
                ) : expedition ? (
                  <>
                    <GameIcon name="expedition" />
                    Expedição · {expedition.name}
                  </>
                ) : (
                  'Livre'
                )}
              </p>

              <EquipmentPanel
                cat={cat}
                state={state}
                busy={isBusy}
                onEquip={(slot, gearId) => equipGear(cat.id, slot, gearId)}
                onUnequip={(slot) => unequipGear(cat.id, slot)}
              />

              <div className="colony-actions">
                <button
                  className="primary-action"
                  type="button"
                  disabled={isBusy}
                  onClick={() => setAssigningId(cat.id)}
                >
                  {isBusy ? 'Ocupado' : 'Designar atividade'}
                </button>
                {!isLeader ? (
                  <button
                    className="ghost-action"
                    type="button"
                    disabled={cat.expedition !== null}
                    onClick={() => setLeader(cat.id)}
                  >
                    {cat.expedition ? 'Em expedição' : 'Tornar líder'}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}

        {recruitCost !== null ? (
          <article className="item-card colony-card colony-card--recruit">
            <img
              className="colony-recruit-mascot"
              src={`${import.meta.env.BASE_URL}art/cat_mascot.png`}
              alt=""
              width={104}
              height={106}
              loading="lazy"
            />
            <h3>Recrutar gato</h3>
            <p className="muted-text">
              Um novo aliado de classe misteriosa se junta ao refúgio. Quem aparecerá?
            </p>
            <button
              className="primary-action"
              type="button"
              disabled={!canAfford}
              onClick={recruitCat}
            >
              <GameIcon name="gems" />
              {recruitCost} {canAfford ? '— Recrutar' : `(você tem ${state.resources.gems})`}
            </button>
          </article>
        ) : null}
      </div>

      {assigningCat ? (
        <AssignActivityModal
          cat={assigningCat}
          onPick={(activityId) => {
            startActivity(activityId, { catId: assigningCat.id });
            setAssigningId(null);
          }}
          onClose={() => setAssigningId(null)}
        />
      ) : null}
    </div>
  );
}
