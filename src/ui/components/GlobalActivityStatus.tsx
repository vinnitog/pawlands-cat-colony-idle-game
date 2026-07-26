import { useEffect, useRef, useState } from 'react';
import { activityById } from '../../game/data/activities.ts';
import { expeditionZoneById } from '../../game/data/zones.ts';
import type { GameState } from '../../game/models/save.ts';
import { getEffectiveActivityEndsAt } from '../../game/systems/activitySystem.ts';
import { GameIcon } from './GameIcon.tsx';
import { formatDuration } from '../formatters.ts';

type ActivityRoute = 'activities' | 'expedition';

type GlobalActivityStatusProps = {
  state: GameState;
  now: number;
  onNavigate(route: ActivityRoute): void;
};

export function GlobalActivityStatus({
  state,
  now,
  onNavigate,
}: GlobalActivityStatusProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const activities = state.cats
    .flatMap((cat) => {
      if (!cat.activity) return [];
      return [{
        cat,
        activity: activityById[cat.activity.activityId],
        endsAt: getEffectiveActivityEndsAt(cat.activity),
      }];
    })
    .sort((left, right) => left.endsAt - right.endsAt);
  const expeditions = state.cats.flatMap((cat) => {
    if (!cat.expedition) return [];
    return [{ cat, zone: expeditionZoneById[cat.expedition.zoneId] }];
  });

  const firstActivity = activities[0];
  const firstExpedition = expeditions[0];
  const extraCount = Math.max(0, activities.length + expeditions.length - 1);
  const title = firstActivity
    ? `${firstActivity.cat.name}: ${firstActivity.activity.name}`
    : firstExpedition
      ? `${firstExpedition.cat.name}: ${firstExpedition.zone.name}`
      : 'Colônia livre';
  const detail = firstActivity
    ? formatDuration(Math.max(0, firstActivity.endsAt - now))
    : firstExpedition
      ? 'Expedição contínua'
      : 'Escolher atividade';

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && wrapRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="global-activity-wrap">
      <button
        ref={triggerRef}
        className="global-activity-status"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="global-activity-popover"
        aria-label={`Atividade atual: ${title}. ${detail}${extraCount ? `. Mais ${extraCount} ocupações` : ''}`}
      >
        <GameIcon name={firstExpedition && !firstActivity ? 'expedition' : 'exploreYard'} />
        <span className="global-activity-copy">
          <small>Atividade atual</small>
          <strong>{title}</strong>
        </span>
        <span className="global-activity-meta">
          <b>{detail}</b>
          {extraCount > 0 ? <em>+{extraCount}</em> : null}
        </span>
      </button>

      {open ? (
        <section
          id="global-activity-popover"
          className="global-activity-popover"
          aria-label="Ocupações da colônia"
        >
          <header>
            <strong>Atividade atual</strong>
            <span>{activities.length + expeditions.length} ocupados</span>
          </header>
          <ul>
            {state.cats.map((cat) => {
              if (cat.activity) {
                const activity = activityById[cat.activity.activityId];
                return (
                  <li key={cat.id}>
                    <span><b>{cat.name}</b> — {activity.name}</span>
                    <strong>{formatDuration(Math.max(0, getEffectiveActivityEndsAt(cat.activity) - now))}</strong>
                  </li>
                );
              }
              if (cat.expedition) {
                return (
                  <li key={cat.id}>
                    <span><b>{cat.name}</b> — {expeditionZoneById[cat.expedition.zoneId].name}</span>
                    <strong>Expedição</strong>
                  </li>
                );
              }
              return (
                <li key={cat.id}>
                  <span><b>{cat.name}</b></span>
                  <strong>Livre</strong>
                </li>
              );
            })}
          </ul>
          <footer>
            <button type="button" onClick={() => { setOpen(false); onNavigate('activities'); }}>
              Ver Atividades
            </button>
            <button type="button" onClick={() => { setOpen(false); onNavigate('expedition'); }}>
              Ver Além
            </button>
          </footer>
        </section>
      ) : null}
    </div>
  );
}
