import { useState } from 'react';
import { activities, activityById } from '../../game/data/activities.ts';
import type { Cat } from '../../game/models/cat.ts';
import { catClassById } from '../../game/models/catClass.ts';
import { getRecruitCost, MAX_COLONY_SIZE } from '../../game/systems/colonySystem.ts';
import { getDailyBonusActivityId } from '../../game/systems/dailyBonusSystem.ts';
import { useGame } from '../../app/gameProvider.tsx';
import { CatSprite } from '../components/CatSprite.tsx';
import { GameIcon } from '../components/GameIcon.tsx';
import { formatDuration } from '../formatters.ts';
import { useNow } from '../useNow.ts';

type AssignModalProps = {
  cat: Cat;
  onPick(activityId: (typeof activities)[number]['id']): void;
  onClose(): void;
};

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
  const { state, recruitCat, setLeader, startActivity } = useGame();
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
        <strong>
          {state.cats.length}/{MAX_COLONY_SIZE} gatos
        </strong>
      </div>

      <div className="item-grid">
        {state.cats.map((cat) => {
          const classDef = catClassById[cat.catClass];
          const isLeader = cat.id === state.leaderId;
          const activity = cat.activity ? activityById[cat.activity.activityId] : null;
          const remainingMs = cat.activity ? Math.max(0, cat.activity.endsAt - now) : 0;
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
                ) : (
                  'Livre'
                )}
              </p>

              <div className="colony-actions">
                <button
                  className="primary-action"
                  type="button"
                  disabled={cat.activity !== null}
                  onClick={() => setAssigningId(cat.id)}
                >
                  {cat.activity ? 'Ocupado' : 'Designar atividade'}
                </button>
                {!isLeader ? (
                  <button className="ghost-action" type="button" onClick={() => setLeader(cat.id)}>
                    Tornar líder
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}

        {recruitCost !== null ? (
          <article className="item-card colony-card colony-card--recruit">
            <div className="colony-recruit-art">
              <GameIcon name="colony" />
            </div>
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
