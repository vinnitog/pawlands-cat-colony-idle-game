import { resourceKeys, resourceLabels, specialItemKeys, specialItemLabels } from '../../game/models/resources.ts';
import { useGame } from '../../app/gameProvider.tsx';

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
              <dt>{resourceLabels[key]}</dt>
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
              <dt>{specialItemLabels[key]}</dt>
              <dd>{state.inventory[key]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
