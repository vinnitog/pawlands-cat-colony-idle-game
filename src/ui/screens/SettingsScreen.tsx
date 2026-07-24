import { useGame } from '../../app/gameProvider.tsx';

export function SettingsScreen() {
  const { state, resetGame } = useGame();

  return (
    <div className="screen-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Local</p>
          <h2>Ajustes</h2>
        </div>
      </div>

      <section className="panel">
        <dl className="inventory-list">
          <div>
            <dt>Save</dt>
            <dd>v{state.schemaVersion}</dd>
          </div>
          <div>
            <dt>Atividades concluídas</dt>
            <dd>{state.totals.activitiesCompleted}</dd>
          </div>
        </dl>

        <button className="danger-action" type="button" onClick={resetGame}>
          Reiniciar progresso
        </button>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Créditos</p>
            <h2>Arte</h2>
          </div>
        </div>
        <ul className="credits-list">
          <li>
            Sprites dos gatos: pack "Cute Legends — Cat Heroes" (Elthen).
          </li>
          <li>
            Tiles do mundo: Kenney "Tiny Town" (CC0).
          </li>
          <li>
            Ilustrações de gatos medievais:{' '}
            <a href="https://www.vecteezy.com" target="_blank" rel="noreferrer">
              Vetores por Vecteezy
            </a>
            .
          </li>
        </ul>
      </section>
    </div>
  );
}
