import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../app/gameProvider.tsx';
import {
  getEvolutionBonuses,
  getTimelineReadiness,
  getTimelineShardReward,
} from '../../game/systems/evolutionSystem.ts';
import { GameIcon } from '../components/GameIcon.tsx';

export function TimelineScreen() {
  const { state, enterNewTimeline } = useGame();
  const [confirming, setConfirming] = useState(false);
  const openedConfirmationRef = useRef(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const timelineActionRef = useRef<HTMLButtonElement>(null);
  const readiness = getTimelineReadiness(state);
  const reward = getTimelineShardReward(state);
  const bonuses = getEvolutionBonuses(state);

  useEffect(() => {
    if (confirming) {
      openedConfirmationRef.current = true;
      cancelButtonRef.current?.focus();
    } else if (openedConfirmationRef.current) {
      timelineActionRef.current?.focus();
    }
  }, [confirming]);

  return (
    <div className="screen-stack timeline-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Prestige · Crescimento permanente</p>
          <h2>Observatório das Timelines</h2>
        </div>
        <strong>Timeline {state.timeline.number}</strong>
      </div>

      <section className="timeline-vista">
        <div className="timeline-core" aria-hidden="true">
          <span>{state.timeline.number}</span>
        </div>
        <div>
          <p className="eyebrow">A próxima realidade aguarda</p>
          <h3>Recomece mais rápido. Descubra mais longe.</h3>
          <p>
            Uma Nova Timeline reinicia colônia, recursos, equipamentos, missões e pesquisas.
            Seu guardião mantém nome e classe; Fragmentos de Timeline ficam para sempre.
          </p>
        </div>
      </section>

      <section className="timeline-stats">
        <article><span>Fragmentos</span><strong>{state.timeline.shards}</strong><small>Total obtido: {state.timeline.totalShards}</small></article>
        <article><span>Bônus permanente</span><strong>+{Math.round((bonuses.activityXpMultiplier - 1) * 100)}% XP</strong><small>Inclui pesquisas desta timeline</small></article>
        <article><span>Próximo salto</span><strong>+{reward}</strong><small>Fragmentos ao atravessar</small></article>
      </section>

      <section className="timeline-gates" aria-labelledby="timeline-gates-title">
        <h3 id="timeline-gates-title">Condições para atravessar</h3>
        <div className={readiness.chronicleComplete ? 'is-complete' : ''}>
          <GameIcon name={readiness.chronicleComplete ? 'reward' : 'missions'} />
          <span><strong>Concluir a crônica de Grimalkin</strong><small>Todas as missões e melhorias da Era I.</small></span>
          <b>{readiness.chronicleComplete ? 'Concluído' : 'Pendente'}</b>
        </div>
        <div className={readiness.evolutionComplete ? 'is-complete' : ''}>
          <GameIcon name="evolution" />
          <span><strong>Dominar o Protocolo Bio-Ciborgue</strong><small>Complete Cyber, Ciência e a primeira combinação.</small></span>
          <b>{readiness.evolutionComplete ? 'Concluído' : 'Pendente'}</b>
        </div>
      </section>

      {confirming ? (
        <section className="timeline-confirm" role="region" aria-labelledby="timeline-confirm-title">
          <GameIcon name="timeline" />
          <div>
            <h3 id="timeline-confirm-title">Abrir uma Nova Timeline?</h3>
            <p>Esta ação reinicia o progresso desta colônia e não pode ser desfeita.</p>
          </div>
          <button ref={cancelButtonRef} type="button" className="secondary-action" onClick={() => setConfirming(false)}>Agora não</button>
          <button type="button" className="primary-action" onClick={() => { enterNewTimeline(); setConfirming(false); }}>Atravessar</button>
        </section>
      ) : (
        <button
          ref={timelineActionRef}
          type="button"
          className="primary-action timeline-action"
          disabled={!readiness.ready}
          onClick={() => setConfirming(true)}
        >
          <GameIcon name="timeline" /> Iniciar Nova Timeline
        </button>
      )}
    </div>
  );
}
