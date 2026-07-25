import { useEffect, useState } from 'react';
import { activities, activityById } from '../../game/data/activities.ts';
import { expeditionZoneById } from '../../game/data/zones.ts';
import type { Cat } from '../../game/models/cat.ts';
import { getDailyBonusActivityId } from '../../game/systems/dailyBonusSystem.ts';
import { useGame } from '../../app/gameProvider.tsx';
import { ActivityCard } from '../components/ActivityCard.tsx';
import { CatSprite } from '../components/CatSprite.tsx';

function isCatFree(cat: Cat): boolean {
  return cat.activity === null && cat.expedition === null;
}

function getCatStatus(cat: Cat): string {
  if (cat.activity) return `Em atividade: ${activityById[cat.activity.activityId].name}`;
  if (cat.expedition) return `Em expedição: ${expeditionZoneById[cat.expedition.zoneId].name}`;
  return `Livre · ${cat.energy}/${cat.maxEnergy} energia`;
}

export function ActivitiesScreen() {
  const { state, startActivity } = useGame();
  const bonusActivityId = getDailyBonusActivityId();
  const bonusName = activityById[bonusActivityId].name;
  const [selectedCatId, setSelectedCatId] = useState<string | null>(() => {
    const leader = state.cats.find((cat) => cat.id === state.leaderId);
    return leader && isCatFree(leader)
      ? leader.id
      : state.cats.find(isCatFree)?.id ?? null;
  });
  const selectedCat =
    state.cats.find((cat) => cat.id === selectedCatId && isCatFree(cat))
    ?? state.cats.find(isCatFree);
  const resolvedSelectedCatId = selectedCat?.id ?? null;

  useEffect(() => {
    if (selectedCatId !== resolvedSelectedCatId) {
      setSelectedCatId(resolvedSelectedCatId);
    }
  }, [resolvedSelectedCatId, selectedCatId]);

  return (
    <div className="screen-stack activities-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Rotina felina</p>
          <h2>Atividades</h2>
        </div>
        <p className="daily-bonus-headline">
          ★ Bônus do dia: <strong>{bonusName}</strong>
        </p>
      </div>

      <section className="activity-assignee-panel" aria-labelledby="activity-assignee-title">
        <div>
          <p className="eyebrow">Equipe da colônia</p>
          <h3 id="activity-assignee-title">Quem vai realizar a próxima atividade?</h3>
        </div>
        <div className="activity-cat-picker" role="group" aria-label="Personagem responsável">
          {state.cats.map((cat) => {
            const free = isCatFree(cat);
            const selected = cat.id === selectedCat?.id;
            return (
              <button
                key={cat.id}
                className={`activity-cat-option${selected ? ' is-selected' : ''}`}
                type="button"
                disabled={!free}
                aria-pressed={selected}
                onClick={() => setSelectedCatId(cat.id)}
              >
                <CatSprite hero={cat.catClass} scale={2} label={cat.name} />
                <span>
                  <strong>
                    {cat.name}
                    {cat.id === state.leaderId ? ' · Líder' : ''}
                  </strong>
                  <small>{getCatStatus(cat)}</small>
                </span>
              </button>
            );
          })}
        </div>
        {selectedCat ? (
          <p className="activity-assignee-summary" aria-live="polite">
            Próxima atividade: <strong>{selectedCat.name}</strong>
          </p>
        ) : (
          <p className="activity-no-cats">Todos os gatos estão ocupados no momento.</p>
        )}
      </section>

      <div className="item-grid">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            cat={selectedCat}
            isDailyBonus={activity.id === bonusActivityId}
            onStart={() => selectedCat && startActivity(activity.id, { catId: selectedCat.id })}
          />
        ))}
      </div>
    </div>
  );
}
