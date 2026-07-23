import type { ActivityDefinition } from '../../game/models/activity.ts';
import type { GameState } from '../../game/models/save.ts';
import { resourceLabels, type ResourceKey } from '../../game/models/resources.ts';
import { formatDuration } from '../formatters.ts';
import { GameIcon } from './GameIcon.tsx';

type ActivityCardProps = {
  activity: ActivityDefinition;
  state: GameState;
  onStart(): void;
};

export function ActivityCard({ activity, state, onStart }: ActivityCardProps) {
  const isBusy = Boolean(state.activeActivity);
  const hasEnergy = state.cat.energy >= activity.energyCost;
  const resourceEntries = activity.rewards.resources
    ? Object.entries(activity.rewards.resources)
    : [];
  const rewardText =
    resourceEntries.length > 0
      ? resourceEntries
          .slice(0, 3)
          .map(([key, range]) => `${range?.[0]}-${range?.[1]} ${resourceLabels[key as ResourceKey]}`)
          .join(', ') + (resourceEntries.length > 3 ? ` +${resourceEntries.length - 3}` : '')
      : activity.rewards.energy
        ? 'Energia'
        : 'Recompensa';

  return (
    <article className={`item-card activity-card activity-card--${activity.id}`}>
      <div className="activity-art">
        <GameIcon name={activity.id} />
      </div>
      <div className="item-card-header">
        <div>
          <h3>{activity.name}</h3>
          <p>{activity.description}</p>
        </div>
        <span>{formatDuration(activity.durationMs)}</span>
      </div>

      <dl className="inline-facts">
        <div>
          <dt>Energia</dt>
          <dd>
            <GameIcon name="energy" />
            {activity.energyCost === 0 ? '0' : `-${activity.energyCost}`}
          </dd>
        </div>
        <div>
          <dt>Ganha</dt>
          <dd>{rewardText || 'XP'}</dd>
        </div>
      </dl>

      <button className="primary-action activity-action" type="button" disabled={isBusy || !hasEnergy} onClick={onStart}>
        {isBusy ? 'Milo está ocupado' : hasEnergy ? 'Iniciar' : 'Sem energia'}
      </button>
    </article>
  );
}
