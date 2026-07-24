import { activities, activityById } from '../../game/data/activities.ts';
import { getDailyBonusActivityId } from '../../game/systems/dailyBonusSystem.ts';
import { useGame } from '../../app/gameProvider.tsx';
import { ActivityCard } from '../components/ActivityCard.tsx';

export function ActivitiesScreen() {
  const { state, startActivity } = useGame();
  const bonusActivityId = getDailyBonusActivityId();
  const bonusName = activityById[bonusActivityId].name;

  return (
    <div className="screen-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Rotina felina</p>
          <h2>Atividades</h2>
        </div>
        <p className="daily-bonus-headline">
          ★ Bônus do dia: <strong>{bonusName}</strong>
        </p>
      </div>

      <div className="item-grid">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            state={state}
            isDailyBonus={activity.id === bonusActivityId}
            onStart={() => startActivity(activity.id)}
          />
        ))}
      </div>
    </div>
  );
}
