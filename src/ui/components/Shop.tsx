import { useEffect, useRef } from 'react';
import { useGame } from '../../app/gameProvider.tsx';
import { shopsById } from '../../game/data/shop.ts';
import { gearById, gearTierLabels, isGearId } from '../../game/data/gear.ts';
import type { ShopId } from '../../game/models/shop.ts';
import type { ShopItemCategory } from '../../game/models/shop.ts';
import type { MissionId } from '../../game/models/missions.ts';
import { describeQuestStatus } from '../../game/systems/missionSystem.ts';
import { getFocusTrapTarget } from '../focusTrap.ts';
import { GameIcon } from './GameIcon.tsx';
import { GearArt } from './GearArt.tsx';

type ShopProps = {
  sellerName: string;
  shopId: ShopId;
  questId?: MissionId;
  onClose(): void;
};

const shopCategoryLabels: Record<ShopItemCategory, string> = {
  equipment: 'Equipamentos',
  improvement: 'Melhorias permanentes',
  supplies: 'Suprimentos',
};

export function Shop({ sellerName, shopId, questId, onClose }: ShopProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const { state, buyShopItem } = useGame();
  const gems = state.resources.gems;
  const coins = state.resources.coins;
  const shop = shopsById[shopId];
  const questLine = questId ? describeQuestStatus(state, questId) : null;

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
    dialogRef.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
    return () => {
      document.removeEventListener('keydown', handleDialogKeys);
      const focusTarget = previousFocus?.isConnected
        ? previousFocus
        : document.querySelector<HTMLElement>('[aria-current="page"]');
      focusTarget?.focus();
    };
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="reward-modal shop-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`shop-title-${shop.id}`}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="eyebrow">{sellerName}</p>
        <h2 id={`shop-title-${shop.id}`}>{shop.title}</h2>
        {questLine ? <p className="shop-quest">“{questLine}”</p> : null}
        <div className="shop-balances" aria-label="Seus saldos">
          <div className="shop-balance">
            <GameIcon name="coins" />
            <strong>{coins}</strong>
            <span>Moedas</span>
          </div>
          <div className="shop-balance">
            <GameIcon name="gems" />
            <strong>{gems}</strong>
            <span>Gemas</span>
          </div>
        </div>

        <div className="shop-list">
          {Object.entries(shopCategoryLabels).map(([category, label]) => {
            const categoryItems = shop.items.filter((item) => item.category === category);
            if (categoryItems.length === 0) return null;
            return (
              <section className="shop-category" key={category} aria-labelledby={`shop-category-${shop.id}-${category}`}>
                <h3 id={`shop-category-${shop.id}-${category}`}>{label}</h3>
                <ul>
                  {categoryItems.map((item) => {
            const usesCoins = item.coinCost !== undefined;
            const price = usesCoins ? item.coinCost : item.gemCost;
            const affordable = usesCoins
              ? coins >= item.coinCost
              : gems >= item.gemCost;
            const gearId =
              item.effect.kind === 'inventory' && isGearId(item.effect.item)
                ? item.effect.item
                : null;
            const gearItem = gearId ? gearById[gearId] : null;
            const equippedCount = gearItem
              ? state.cats.filter((cat) => cat.equipment[gearItem.slot] === gearId).length
              : 0;
            return (
              <li className="shop-item" key={item.id}>
                <span className="shop-item-art">
                  {gearId ? <GearArt gearId={gearId} /> : <GameIcon name={item.icon} />}
                </span>
                <div className="shop-item-copy">
                  <strong>{item.name}</strong>
                  <p className="muted-text">{item.description}</p>
                  {gearItem ? (
                    <small className="shop-gear-meta">
                      <span>{gearTierLabels[gearItem.tier]}</span>
                      Disponíveis: {state.inventory[gearItem.id]} · Equipadas: {equippedCount} · Total: {state.inventory[gearItem.id] + equippedCount}
                    </small>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="primary-action shop-buy"
                  disabled={!affordable}
                  aria-label={`Comprar ${item.name} por ${price} ${usesCoins ? 'moedas' : 'gemas'}`}
                  onClick={() => buyShopItem(item.id)}
                >
                  <GameIcon name={usesCoins ? 'coins' : 'gems'} />
                  {price}
                </button>
              </li>
            );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        <button type="button" className="shop-close" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
