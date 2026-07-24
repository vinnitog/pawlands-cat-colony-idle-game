import { activityById } from '../../game/data/activities.ts';
import { catClassById } from '../../game/models/catClass.ts';
import { getRecruitCost, MAX_COLONY_SIZE } from '../../game/systems/colonySystem.ts';
import { useGame } from '../../app/gameProvider.tsx';
import { CatSprite } from '../components/CatSprite.tsx';
import { GameIcon } from '../components/GameIcon.tsx';
import { formatDuration } from '../formatters.ts';
import { useNow } from '../useNow.ts';

export function ColonyScreen() {
  const { state, recruitCat, setLeader } = useGame();
  const now = useNow();
  const recruitCost = getRecruitCost(state);
  const canAfford = recruitCost !== null && state.resources.gems >= recruitCost;

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

              {!isLeader ? (
                <button className="primary-action" type="button" onClick={() => setLeader(cat.id)}>
                  Tornar líder
                </button>
              ) : null}
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
    </div>
  );
}
