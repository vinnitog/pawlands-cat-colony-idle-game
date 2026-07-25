import type { ActivityDefinition } from '../../game/models/activity.ts';
import type { Cat } from '../../game/models/cat.ts';
import {
  resourceLabels,
  specialItemLabels,
  type ResourceKey,
} from '../../game/models/resources.ts';
import { DAILY_BONUS_GEM_CHANCE } from '../../game/systems/dailyBonusSystem.ts';
import { formatDuration } from '../formatters.ts';
import { GameIcon, type GameIconName } from './GameIcon.tsx';

type ActivityCardProps = {
  activity: ActivityDefinition;
  cat?: Cat;
  isDailyBonus?: boolean;
  onStart(): void;
};

function formatChance(chance: number): string {
  return `${(chance * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

export function ActivityCard({ activity, cat, isDailyBonus = false, onStart }: ActivityCardProps) {
  const isOnExpedition = cat?.expedition !== null && cat?.expedition !== undefined;
  const isBusy =
    (cat?.activity !== null && cat?.activity !== undefined) || isOnExpedition;
  const hasEnergy = Boolean(cat && cat.energy >= activity.energyCost);
  const xpRange = activity.rewards.xp;
  const xpMultiplier = isDailyBonus ? 2 : 1;
  const xpPerMin = xpRange
    ? Math.round(((xpRange[0] + xpRange[1]) / 2) * xpMultiplier / (activity.durationMs / 60000))
    : null;
  const resourceEntries = Object.entries(activity.rewards.resources ?? {}) as Array<
    [ResourceKey, [number, number]]
  >;

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

      <dl className="inline-facts activity-cost">
        <div>
          <dt>Energia</dt>
          <dd>
            <GameIcon name="energy" />
            {activity.energyCost === 0 ? '0' : `-${activity.energyCost}`}
          </dd>
        </div>
        <div>
          <dt>Responsável</dt>
          <dd>{cat?.name ?? 'Nenhum gato livre'}</dd>
        </div>
      </dl>

      <section className="activity-reward-catalog" aria-label={`Possíveis recompensas de ${activity.name}`}>
        <h4>Possíveis recompensas</h4>
        <ul>
          {resourceEntries.map(([key, range]) => (
            <li key={key}>
              <GameIcon name={key} />
              <span>
                <strong>{resourceLabels[key]}</strong>
                <small>{range[0]}–{range[1]}</small>
              </span>
            </li>
          ))}
          {activity.rewards.xp ? (
            <li>
              <GameIcon name="xp" />
              <span>
                <strong>XP</strong>
                <small>
                  {activity.rewards.xp[0] * xpMultiplier}–
                  {activity.rewards.xp[1] * xpMultiplier}
                </small>
              </span>
            </li>
          ) : null}
          {activity.rewards.energy ? (
            <li>
              <GameIcon name="energy" />
              <span>
                <strong>Energia</strong>
                <small>{activity.rewards.energy[0]}–{activity.rewards.energy[1]}</small>
              </span>
            </li>
          ) : null}
          {activity.rewards.gemDrop ? (
            <li className="is-chance">
              <GameIcon name="gems" />
              <span>
                <strong>Gemas</strong>
                <small>
                  {activity.rewards.gemDrop.amount[0]}–{activity.rewards.gemDrop.amount[1]}
                  {' · '}
                  {formatChance(activity.rewards.gemDrop.chance)}
                </small>
              </span>
            </li>
          ) : null}
          {isDailyBonus ? (
            <li className="is-chance">
              <GameIcon name="gems" />
              <span>
                <strong>{activity.rewards.gemDrop ? 'Gema bônus do dia' : 'Gemas'}</strong>
                <small>1 · {formatChance(DAILY_BONUS_GEM_CHANCE)}</small>
              </span>
            </li>
          ) : null}
          {(activity.rewards.rareItems ?? []).map((rare) => (
            <li className="is-chance" key={rare.item}>
              <GameIcon name={rare.item as GameIconName} />
              <span>
                <strong>{specialItemLabels[rare.item]}</strong>
                <small>{formatChance(rare.chance)}</small>
              </span>
            </li>
          ))}
        </ul>
        {activity.rewards.rareItems?.length || activity.rewards.gemDrop ? (
          <p>Sorte e melhorias aumentam as chances dos achados raros.</p>
        ) : null}
      </section>

      {xpPerMin ? <p className="cost-line">≈ {xpPerMin} XP/min</p> : null}

      {isDailyBonus ? (
        <p className="daily-bonus-note">Hoje: XP em dobro e chance extra de gema.</p>
      ) : null}

      <button
        className="primary-action activity-action"
        type="button"
        disabled={!cat || isBusy || !hasEnergy}
        onClick={onStart}
      >
        {!cat
          ? 'Nenhum gato livre'
          : isOnExpedition
            ? `${cat.name} está em expedição`
            : isBusy
              ? `${cat.name} está ocupado`
              : hasEnergy
                ? `Iniciar com ${cat.name}`
                : `${cat.name} está sem energia`}
      </button>
    </article>
  );
}
