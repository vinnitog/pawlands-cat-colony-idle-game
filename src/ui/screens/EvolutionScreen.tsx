import { useGame } from '../../app/gameProvider.tsx';
import { evolutionNodes } from '../../game/data/evolution.ts';
import type { EvolutionBranch } from '../../game/models/evolution.ts';
import {
  getEvolutionBonuses,
  getResearchBlockReason,
  hasEvolution,
} from '../../game/systems/evolutionSystem.ts';
import { formatDuration, formatResourceList } from '../formatters.ts';
import { useNow } from '../useNow.ts';
import { GameIcon } from '../components/GameIcon.tsx';

const branchLabels: Record<EvolutionBranch, { eyebrow: string; title: string }> = {
  cyber: { eyebrow: 'Automação · Robótica · IA', title: 'Caminho Cyber' },
  science: { eyebrow: 'Química · Genética · Mutação', title: 'Ciência Indomável' },
  hybrid: { eyebrow: 'Convergência experimental', title: 'Evoluções Híbridas' },
};

export function EvolutionScreen() {
  const { state, startResearch } = useGame();
  const now = useNow();
  const active = state.evolution.activeResearch;
  const bonuses = getEvolutionBonuses(state);

  return (
    <div className="screen-stack evolution-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Era I · Conhecimento sem limites</p>
          <h2>Laboratório Catvolution</h2>
          <p className="daily-bonus-headline">
            Pesquisas continuam enquanto você está offline. Combine os dois ramos.
          </p>
        </div>
        <strong>{state.evolution.unlocked.length}/{evolutionNodes.length}</strong>
      </div>

      {active ? (
        <section className="research-console" aria-live="polite">
          <div>
            <p className="eyebrow">Pesquisa ativa</p>
            <h3>{evolutionNodes.find((node) => node.id === active.nodeId)?.name}</h3>
          </div>
          <strong>{formatDuration(active.endsAt - now)}</strong>
          <div className="research-progress" aria-hidden="true">
            <span style={{ width: `${Math.min(100, Math.max(0, ((now - active.startedAt) / (active.endsAt - active.startedAt)) * 100))}%` }} />
          </div>
        </section>
      ) : null}

      <section className="evolution-bonus-strip" aria-label="Bônus de evolução ativos">
        <span><b>{Math.round((1 - bonuses.activityDurationMultiplier) * 100)}%</b> velocidade</span>
        <span><b>+{Math.round((bonuses.activityXpMultiplier - 1) * 100)}%</b> XP</span>
        <span><b>+{Math.round(bonuses.rareChanceBonus * 100)}%</b> raridade</span>
      </section>

      {(['cyber', 'science', 'hybrid'] as EvolutionBranch[]).map((branch) => (
        <section key={branch} className={`evolution-branch evolution-branch--${branch}`}>
          <header>
            <div>
              <p className="eyebrow">{branchLabels[branch].eyebrow}</p>
              <h3>{branchLabels[branch].title}</h3>
            </div>
          </header>
          <div className="evolution-node-grid">
            {evolutionNodes.filter((node) => node.branch === branch).map((node) => {
              const unlocked = hasEvolution(state, node.id);
              const researching = active?.nodeId === node.id;
              const reason = getResearchBlockReason(state, node.id);
              const prerequisites = node.prerequisites
                .map((id) => evolutionNodes.find((candidate) => candidate.id === id)?.name)
                .filter(Boolean)
                .join(' + ');

              return (
                <article
                  key={node.id}
                  className={`evolution-node${unlocked ? ' is-unlocked' : ''}${researching ? ' is-researching' : ''}`}
                >
                  <div className="evolution-node__icon"><GameIcon name="evolution" /></div>
                  <div className="evolution-node__title">
                    <span>Tier {node.tier} · {node.archetype}</span>
                    <h3>{node.name}</h3>
                  </div>
                  <p>{node.description}</p>
                  <strong className="effect-line">{node.effectText}</strong>
                  {prerequisites ? <small>Requer: {prerequisites}</small> : null}
                  <div className="evolution-node__meta">
                    <span>{formatResourceList(node.cost)}</span>
                    <span>{formatDuration(node.durationMs * bonuses.researchDurationMultiplier)}</span>
                  </div>
                  <button
                    type="button"
                    className="primary-action"
                    disabled={reason !== null}
                    onClick={() => startResearch(node.id)}
                  >
                    {unlocked ? 'Descoberta dominada' : researching ? 'Pesquisando…' : reason ?? 'Iniciar pesquisa'}
                  </button>
                  {!unlocked && !researching && reason ? <em>{reason}</em> : null}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
