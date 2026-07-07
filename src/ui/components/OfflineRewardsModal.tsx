import type { RewardNotice } from '../../app/gameProvider.tsx';
import { resourceLabels, specialItemLabels } from '../../game/models/resources.ts';
import { formatLongDuration } from '../formatters.ts';
import { GameIcon, type GameIconName } from './GameIcon.tsx';

type OfflineRewardsModalProps = {
  notice: RewardNotice;
  onClose(): void;
};

export function OfflineRewardsModal({ notice, onClose }: OfflineRewardsModalProps) {
  const resourceEntries = Object.entries(notice.reward.resources).filter(([, amount]) => Number(amount) > 0);
  const itemEntries = Object.entries(notice.reward.inventory).filter(([, amount]) => Number(amount) > 0);

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="reward-modal" role="dialog" aria-modal="true" aria-labelledby="reward-title">
        <div className="reward-badge">
          <GameIcon name="reward" />
        </div>
        <p className="eyebrow">
          {notice.offlineDurationMs ? `Fora por ${formatLongDuration(notice.offlineDurationMs)}` : 'Bom trabalho'}
        </p>
        <h2 id="reward-title">{notice.title}</h2>

        <ul className="reward-list">
          {resourceEntries.map(([key, amount]) => (
            <li key={key}>
              <span>
                <GameIcon name={key as GameIconName} />
                {resourceLabels[key as keyof typeof resourceLabels]}
              </span>
              <strong>+{amount}</strong>
            </li>
          ))}
          {notice.reward.xp > 0 ? (
            <li>
              <span>
                <GameIcon name="xp" />
                XP
              </span>
              <strong>+{notice.reward.xp}</strong>
            </li>
          ) : null}
          {notice.reward.energy > 0 ? (
            <li>
              <span>
                <GameIcon name="energy" />
                Energia
              </span>
              <strong>+{notice.reward.energy}</strong>
            </li>
          ) : null}
          {itemEntries.map(([key, amount]) => (
            <li key={key}>
              <span>
                <GameIcon name={key as GameIconName} />
                {specialItemLabels[key as keyof typeof specialItemLabels]}
              </span>
              <strong>+{amount}</strong>
            </li>
          ))}
          {notice.levelsGained > 0 ? (
            <li>
              <span>
                <GameIcon name="level" />
                Níveis
              </span>
              <strong>+{notice.levelsGained}</strong>
            </li>
          ) : null}
          {notice.levelCoins > 0 ? (
            <li>
              <span>
                <GameIcon name="coins" />
                Bônus de nível
              </span>
              <strong>+{notice.levelCoins}</strong>
            </li>
          ) : null}
        </ul>

        <button className="primary-action" type="button" onClick={onClose}>
          Continuar
        </button>
      </section>
    </div>
  );
}
