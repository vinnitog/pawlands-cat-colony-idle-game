import type { ActivityDefinition } from '../../game/models/activity.ts';
import type { GameState } from '../../game/models/save.ts';
import { resourceLabels, type ResourceKey } from '../../game/models/resources.ts';
import { getLeader } from '../../game/systems/colonySystem.ts';
import { formatDuration } from '../formatters.ts';
import { GameIcon } from './GameIcon.tsx';

type ActivityCardProps = {
  activity: ActivityDefinition;
  state: GameState;
  isDailyBonus?: boolean;
  onStart(): void;
};

export function ActivityCard({ activity, state, isDailyBonus = false, onStart }: ActivityCardProps) {
  const leader = getLeader(state);
  const isBusy = Boolean(leader.activity);
  const hasEnergy = leader.energy >= activity.energyCost;
  const xpRange = activity.rewards.xp;
  const xpMultiplier = isDailyBonus ? 2 : 1;
  const xpPerMin = xpRange
    ? Math.round(((xpRange[0] + xpRange[1]) / 2) * xpMultiplier / (activity.durationMs / 60000))
    : null;
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
    <article
      className={`item-card activity-card activity-card--${activity.id}${
        isDailyBonus ? ' activity-card--daily-bonus' : ''
      }`}
    >
      {isDailyBonus ? <span className="daily-bonus-seal">★ Bônus do dia</span> : null}
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

      {xpPerMin ? <p className="cost-line">≈ {xpPerMin} XP/min</p> : null}

      {isDailyBonus ? (
        <p className="daily-bonus-note">Hoje: XP em dobro e chance extra de gema.</p>
      ) : null}

      <button className="primary-action activity-action" type="button" disabled={isBusy || !hasEnergy} onClick={onStart}>
        {isBusy ? `${leader.name} está ocupado` : hasEnergy ? 'Iniciar' : 'Sem energia'}
      </button>
    </article>
  );
}
