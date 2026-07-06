import { upgrades } from '../../game/data/upgrades.ts';
import { useGame } from '../../app/gameProvider.tsx';
import { UpgradeCard } from '../components/UpgradeCard.tsx';

export function UpgradesScreen() {
  const { state, buyUpgrade } = useGame();

  return (
    <div className="screen-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Colônia</p>
          <h2>Melhorias</h2>
        </div>
      </div>

      <div className="item-grid">
        {upgrades.map((upgrade) => (
          <UpgradeCard key={upgrade.id} upgradeId={upgrade.id} state={state} onBuy={() => buyUpgrade(upgrade.id)} />
        ))}
      </div>
    </div>
  );
}
