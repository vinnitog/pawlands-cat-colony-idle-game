import type { ScreenId } from '../../app/App.tsx';
import { useGame } from '../../app/gameProvider.tsx';
import { evolutionNodes } from '../../game/data/evolution.ts';
import { getCurrentChronicleProgress } from '../../game/systems/progressionSystem.ts';
import { ResourceBar } from '../components/ResourceBar.tsx';
import { GameIcon, type GameIconName } from '../components/GameIcon.tsx';

type OverviewScreenProps = {
  goTo(screen: ScreenId): void;
};

const actions: Array<{
  screen: ScreenId;
  icon: GameIconName;
  label: string;
  description: string;
}> = [
  { screen: 'activities', icon: 'exploreYard', label: 'Trabalhar', description: 'Produzir recursos' },
  { screen: 'evolution', icon: 'evolution', label: 'Pesquisar', description: 'Abrir novos caminhos' },
  { screen: 'expedition', icon: 'expedition', label: 'Explorar', description: 'Caçar no Além' },
  { screen: 'missions', icon: 'missions', label: 'Crônicas', description: 'Reivindicar objetivos' },
  { screen: 'inventory', icon: 'inventory', label: 'Arsenal', description: 'Organizar loot' },
  { screen: 'upgrades', icon: 'upgrades', label: 'Estruturas', description: 'Fortalecer a colônia' },
  { screen: 'timeline', icon: 'timeline', label: 'Timeline', description: 'Ver progresso eterno' },
  { screen: 'settings', icon: 'settings', label: 'Ajustes', description: 'Save e informações' },
];

export function OverviewScreen({ goTo }: OverviewScreenProps) {
  const { state } = useGame();
  const chronicle = getCurrentChronicleProgress(state);
  const unlocked = state.evolution.unlocked.length;
  const activeCats = state.cats.filter((cat) => cat.activity || cat.expedition).length;
  const activeResearch = state.evolution.activeResearch;

  return (
    <div className="screen-stack overview-screen">
      <section className="evolution-hero" aria-labelledby="evolution-hero-title">
        <img
          className="evolution-hero__art"
          src={`${import.meta.env.BASE_URL}art/catvolution-hero.jpg`}
          alt=""
        />
        <div className="evolution-hero__copy">
          <p className="eyebrow">Timeline {state.timeline.number} · Era I</p>
          <h2 id="evolution-hero-title">A centelha da evolução despertou.</h2>
          <p>
            Comece em Grimalkin. Pesquise tecnologia e ciência. Misture caminhos até
            criar gatos que nenhum universo deveria conter.
          </p>
          <button type="button" className="primary-action" onClick={() => goTo('evolution')}>
            <GameIcon name="evolution" /> Abrir Laboratório
          </button>
        </div>
      </section>

      <ResourceBar resources={state.resources} />

      <section className="command-status" aria-label="Estado da colônia">
        <article>
          <span>Colônia</span>
          <strong>{state.cats.length} {state.cats.length === 1 ? 'gato' : 'gatos'}</strong>
          <small>{activeCats} em missão agora</small>
        </article>
        <article>
          <span>Evolução</span>
          <strong>{unlocked}/{evolutionNodes.length} descobertas</strong>
          <small>{activeResearch ? 'Pesquisa em andamento' : 'Laboratório disponível'}</small>
        </article>
        <article>
          <span>Crônica</span>
          <strong>{chronicle.complete ? 'Concluída' : 'Em progresso'}</strong>
          <small>{state.timeline.shards} Fragmentos permanentes</small>
        </article>
      </section>

      <section className="overview-actions" aria-labelledby="quick-actions-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Escolha seu próximo passo</p>
            <h2 id="quick-actions-title">Central da Colônia</h2>
          </div>
        </div>
        <div className="overview-action-grid">
          {actions.map((action) => (
            <button key={action.screen} type="button" onClick={() => goTo(action.screen)}>
              <GameIcon name={action.icon} />
              <span><strong>{action.label}</strong><small>{action.description}</small></span>
              <b aria-hidden="true">›</b>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
