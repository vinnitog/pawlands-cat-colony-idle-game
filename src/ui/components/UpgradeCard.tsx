import { upgradeById } from '../../game/data/upgrades.ts';
import type { GameState } from '../../game/models/save.ts';
import type { UpgradeId } from '../../game/models/upgrades.ts';
import { resourceLabels } from '../../game/models/resources.ts';
import { getUpgradeCost } from '../../game/systems/upgradeSystem.ts';
import { hasResources } from '../../game/systems/economySystem.ts';

type UpgradeCardProps = {
  upgradeId: UpgradeId;
  state: GameState;
  onBuy(): void;
};

function formatCost(state: GameState, upgradeId: UpgradeId): string {
  const cost = getUpgradeCost(state, upgradeId);
  if (!cost) return 'Nível máximo';

  return Object.entries(cost)
    .map(([key, amount]) => `${amount} ${resourceLabels[key as keyof typeof resourceLabels]}`)
    .join(', ');
}

export function UpgradeCard({ upgradeId, state, onBuy }: UpgradeCardProps) {
  const definition = upgradeById[upgradeId];
  const upgrade = state.upgrades[upgradeId];
  const cost = getUpgradeCost(state, upgradeId);
  const canBuy = Boolean(cost && hasResources(state.resources, cost));

  return (
    <article className="item-card">
      <div className="item-card-header">
        <div>
          <h3>{definition.name}</h3>
          <p>{definition.description}</p>
        </div>
        <span>
          {upgrade.level}/{definition.maxLevel}
        </span>
      </div>

      <p className="effect-line">{definition.effectTextByLevel[upgrade.level]}</p>
      <p className="cost-line">{formatCost(state, upgradeId)}</p>

      <button className="primary-action" type="button" disabled={!canBuy} onClick={onBuy}>
        {cost ? 'Melhorar' : 'Completo'}
      </button>
    </article>
  );
}
