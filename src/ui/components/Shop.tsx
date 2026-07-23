import { useGame } from '../../app/gameProvider.tsx';
import { shopsById } from '../../game/data/shop.ts';
import type { ShopId } from '../../game/models/shop.ts';
import { GameIcon } from './GameIcon.tsx';

type ShopProps = {
  sellerName: string;
  shopId: ShopId;
  onClose(): void;
};

export function Shop({ sellerName, shopId, onClose }: ShopProps) {
  const { state, buyShopItem } = useGame();
  const gems = state.resources.gems;
  const shop = shopsById[shopId];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="reward-modal shop-modal"
        role="dialog"
        aria-label={shop.title}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="eyebrow">{sellerName}</p>
        <h2>{shop.title}</h2>
        <div className="shop-balance">
          <GameIcon name="gems" />
          <strong>{gems}</strong>
          <span>Gemas</span>
        </div>

        <ul className="shop-list">
          {shop.items.map((item) => {
            const affordable = gems >= item.gemCost;
            return (
              <li className="shop-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p className="muted-text">{item.description}</p>
                </div>
                <button
                  type="button"
                  className="primary-action shop-buy"
                  disabled={!affordable}
                  onClick={() => buyShopItem(item.id)}
                >
                  <GameIcon name="gems" />
                  {item.gemCost}
                </button>
              </li>
            );
          })}
        </ul>

        <button type="button" className="shop-close" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
