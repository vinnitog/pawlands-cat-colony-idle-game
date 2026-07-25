import { useEffect, useRef } from 'react';
import type { RewardNotice } from '../../app/gameProvider.tsx';
import { inventoryItemLabels, resourceLabels } from '../../game/models/resources.ts';
import { gearById, gearTierLabels, isGearId } from '../../game/data/gear.ts';
import { formatLongDuration } from '../formatters.ts';
import { getFocusTrapTarget } from '../focusTrap.ts';
import { GameIcon, type GameIconName } from './GameIcon.tsx';

type OfflineRewardsModalProps = {
  notice: RewardNotice;
  onClose(): void;
};

export function OfflineRewardsModal({ notice, onClose }: OfflineRewardsModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const resourceEntries = Object.entries(notice.reward.resources).filter(([, amount]) => Number(amount) > 0);
  const itemEntries = Object.entries(notice.reward.inventory).filter(([, amount]) => Number(amount) > 0);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      && document.activeElement !== document.body
      ? document.activeElement
      : null;
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const activeElement = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      const focusTarget = getFocusTrapTarget(focusableElements, activeElement, event.shiftKey);

      if (focusableElements.length === 0 || focusTarget) event.preventDefault();
      focusTarget?.focus();
    };

    document.addEventListener('keydown', handleDialogKeys);
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleDialogKeys);
      const focusTarget = previousFocus?.isConnected
        ? previousFocus
        : document.querySelector<HTMLElement>('[aria-current="page"]')
          ?? document.querySelector<HTMLElement>('#expedition-title');
      focusTarget?.focus();
    };
  }, []);

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="reward-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reward-title"
      >
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
          {itemEntries.map(([key, amount]) => {
            const gearItem = isGearId(key) ? gearById[key] : null;
            return (
              <li key={key}>
                <span>
                  <GameIcon name={key as GameIconName} />
                  <span className="reward-item-copy">
                    {inventoryItemLabels[key as keyof typeof inventoryItemLabels]}
                    {gearItem ? <small>{gearTierLabels[gearItem.tier]}</small> : null}
                  </span>
                </span>
                <strong>+{amount}</strong>
              </li>
            );
          })}
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

        <button ref={closeButtonRef} className="primary-action" type="button" onClick={onClose}>
          Continuar
        </button>
      </section>
    </div>
  );
}
