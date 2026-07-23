import { useGame } from '../../app/gameProvider.tsx';
import { shopItems } from '../../game/data/shop.ts';
import { GameIcon } from './GameIcon.tsx';

type JewelerShopProps = {
  sellerName: string;
  onClose(): void;
};

export function JewelerShop({ sellerName, onClose }: JewelerShopProps) {
  const { state, buyShopItem } = useGame();
  const gems = state.resources.gems;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="reward-modal shop-modal"
        role="dialog"
        aria-label={`Loja de ${sellerName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="eyebrow">{sellerName}</p>
        <h2>Balcão de Gemas</h2>
        <div className="shop-balance">
          <GameIcon name="gems" />
          <strong>{gems}</strong>
          <span>Gemas</span>
        </div>

        <ul className="shop-list">
          {shopItems.map((item) => {
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
