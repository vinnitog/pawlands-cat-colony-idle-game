import { upgrades } from '../../game/data/upgrades.ts';
import { useGame } from '../../app/gameProvider.tsx';
import { UpgradeCard } from '../components/UpgradeCard.tsx';
import { getCurrentChronicleProgress } from '../../game/systems/progressionSystem.ts';
import { GameIcon } from '../components/GameIcon.tsx';

export function UpgradesScreen() {
  const { state, buyUpgrade } = useGame();
  const chronicle = getCurrentChronicleProgress(state);

  return (
    <div className="screen-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Colônia</p>
          <h2>Melhorias</h2>
        </div>
      </div>

      {chronicle.complete ? (
        <section className="chronicle-complete" aria-labelledby="upgrades-chronicle-title">
          <GameIcon name="reward" />
          <div>
            <p className="eyebrow">Próxima página</p>
            <h3 id="upgrades-chronicle-title">Crônica atual concluída</h3>
            <p>
              Este capítulo foi concluído. A colônia continua ativa em atividades e
              expedições enquanto novas histórias se abrem.
            </p>
          </div>
        </section>
      ) : null}

      <div className="item-grid">
        {upgrades.map((upgrade) => (
          <UpgradeCard key={upgrade.id} upgradeId={upgrade.id} state={state} onBuy={() => buyUpgrade(upgrade.id)} />
        ))}
      </div>
    </div>
  );
}
