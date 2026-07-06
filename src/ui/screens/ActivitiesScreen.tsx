import { activities } from '../../game/data/activities.ts';
import { useGame } from '../../app/gameProvider.tsx';
import { ActivityCard } from '../components/ActivityCard.tsx';

export function ActivitiesScreen() {
  const { state, startActivity } = useGame();

  return (
    <div className="screen-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Rotina felina</p>
          <h2>Atividades</h2>
        </div>
      </div>

      <div className="item-grid">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} state={state} onStart={() => startActivity(activity.id)} />
        ))}
      </div>
    </div>
  );
}
