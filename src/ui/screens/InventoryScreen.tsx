import {
  gearItemKeys,
  resourceKeys,
  resourceLabels,
  specialItemKeys,
  specialItemLabels,
} from '../../game/models/resources.ts';
import { gearById, gearTierLabels } from '../../game/data/gear.ts';
import { useGame } from '../../app/gameProvider.tsx';
import { GearArt } from '../components/GearArt.tsx';
import { GameIcon } from '../components/GameIcon.tsx';

export function InventoryScreen() {
  const { state } = useGame();

  return (
    <div className="screen-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Bolsa simples</p>
          <h2>Inventário</h2>
        </div>
      </div>

      <section className="panel">
        <h3>Recursos</h3>
        <dl className="inventory-list">
          {resourceKeys.map((key) => (
            <div key={key}>
              <dt>
                <GameIcon name={key} />
                {resourceLabels[key]}
              </dt>
              <dd>{state.resources[key]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="panel">
        <h3>Itens especiais</h3>
        <dl className="inventory-list">
          {specialItemKeys.map((key) => (
            <div key={key}>
              <dt>
                <GameIcon name={key} />
                {specialItemLabels[key]}
              </dt>
              <dd>{state.inventory[key]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="panel">
        <h3>Equipamentos disponíveis</h3>
        <p className="muted-text">As quantidades abaixo não incluem peças equipadas nos gatos.</p>
        <dl className="inventory-list gear-inventory-list">
          {gearItemKeys.map((gearId) => {
            const item = gearById[gearId];
            const equippedCats = state.cats.filter(
              (cat) => cat.equipment[item.slot] === gearId,
            );
            return (
              <div key={gearId}>
                <dt>
                  <GearArt gearId={gearId} />
                  <span>
                    {item.name}
                    <small>
                      {gearTierLabels[item.tier]} · {item.slot === 'weapon' ? 'Arma' : 'Armadura'} · +{item.power} poder
                    </small>
                  </span>
                </dt>
                <dd className="gear-inventory-count">
                  <span><strong>{state.inventory[gearId]}</strong> disponíveis</span>
                  <small>
                    Equipadas: {equippedCats.length > 0
                      ? equippedCats.map((cat) => `${cat.name} ×1`).join(', ')
                      : 'nenhuma'}
                  </small>
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </div>
  );
}
