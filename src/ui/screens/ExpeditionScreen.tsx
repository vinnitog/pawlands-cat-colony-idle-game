import { useMemo, useState } from 'react';
import { useGame } from '../../app/gameProvider.tsx';
import { expeditionZoneById, expeditionZones } from '../../game/data/zones.ts';
import { gearById } from '../../game/data/gear.ts';
import type { Cat } from '../../game/models/cat.ts';
import {
  EXPEDITION_PULSE_CAP,
  EXPEDITION_PULSE_MS,
  type ExpeditionZone,
  type ExpeditionZoneId,
} from '../../game/models/expedition.ts';
import { inventoryItemLabels } from '../../game/models/resources.ts';
import {
  advanceExpeditions,
  getCatPower,
  getExpeditionEfficiency,
  isExpeditionZoneUnlocked,
} from '../../game/systems/expeditionSystem.ts';
import { CatSprite } from '../components/CatSprite.tsx';
import { GameIcon } from '../components/GameIcon.tsx';
import { GearArt } from '../components/GearArt.tsx';
import { formatDuration, formatLongDuration } from '../formatters.ts';
import { useNow } from '../useNow.ts';

const zoneArt: Record<ExpeditionZoneId, string> = {
  whisperingFields: 'whispering-fields.png',
  mistwood: 'mistwood.png',
  grimalkinRuins: 'grimalkin-ruins.png',
};

function formatPulses(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function getEfficiencyLabel(efficiency: number): string {
  if (efficiency <= 0.5) return 'Ritmo cauteloso';
  if (efficiency < 1) return 'Ritmo lento';
  if (efficiency < 1.3) return 'Ritmo firme';
  return 'Ritmo veloz';
}

function getUnlockText(zone: ExpeditionZone, cat: Cat | undefined, state: ReturnType<typeof useGame>['state']) {
  if (!cat) return 'Escolha um gato livre para avaliar esta zona.';
  const unlock = zone.unlock;
  if (unlock.kind === 'always') return 'Passagem aberta.';
  if (unlock.kind === 'catLevel') {
    return cat.level >= unlock.level
      ? `Nível ${unlock.level} alcançado.`
      : `Requer nível ${unlock.level}; ${cat.name} está no nível ${cat.level}.`;
  }

  const current = state.expeditionCollections[unlock.zoneId];
  return current >= unlock.collections
    ? 'Passagem revelada pelas caçadas anteriores.'
    : `Requer ${unlock.collections} coletas em ${expeditionZoneById[unlock.zoneId].name} (${current}/${unlock.collections}).`;
}

export function ExpeditionScreen() {
  const { state, startExpedition, collectExpedition } = useGame();
  const now = useNow();
  const previewState = useMemo(() => advanceExpeditions(state, now), [state, now]);
  const freeCats = state.cats.filter((cat) => !cat.activity && !cat.expedition);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(
    () => freeCats[0]?.id ?? null,
  );
  const selectedCat = freeCats.find((cat) => cat.id === selectedCatId) ?? freeCats[0];
  const activeCats = previewState.cats.filter((cat) => cat.expedition !== null);
  const base = import.meta.env.BASE_URL;

  return (
    <div className="screen-stack expedition-screen">
      <div className="section-heading expedition-heading">
        <div>
          <p className="eyebrow">Portão do Além</p>
          <h2 id="expedition-title" tabIndex={-1}>Expedição</h2>
          <p className="expedition-intro">
            Envie um gato para caçar. O saco cresce com o tempo e nunca perde o que já guardou.
          </p>
        </div>
        <strong>
          {activeCats.length} {activeCats.length === 1 ? 'caçada ativa' : 'caçadas ativas'}
        </strong>
      </div>

      <section className="expedition-section" aria-labelledby="active-hunts-title">
        <div className="expedition-section-title">
          <GameIcon name="expedition" />
          <div>
            <p className="eyebrow">Além da muralha</p>
            <h3 id="active-hunts-title">Caçadas em andamento</h3>
          </div>
        </div>

        {activeCats.length > 0 ? (
          <div className="expedition-active-grid">
            {activeCats.map((cat) => {
              const expedition = cat.expedition;
              if (!expedition) return null;
              const zone = expeditionZoneById[expedition.zoneId];
              const efficiency = getExpeditionEfficiency(cat, zone.id);
              const accumulated = expedition.accumulatedPulses;
              const percentage = Math.min(100, (accumulated / EXPEDITION_PULSE_CAP) * 100);
              const resolvedPulses = Math.floor(Number(accumulated.toFixed(12)));
              const timeCarry = cat.expeditionTimeCarryMs[zone.id] ?? 0;
              const basePulsesToFull = Math.ceil(
                Math.max(0, EXPEDITION_PULSE_CAP - accumulated) / efficiency,
              );
              const timeToFull = Math.max(
                0,
                basePulsesToFull * EXPEDITION_PULSE_MS - timeCarry,
              );
              const nextResolvedPulse = Math.floor(Number(accumulated.toFixed(12))) + 1;
              const basePulsesToNextReward = Math.ceil(
                Math.max(0, nextResolvedPulse - accumulated) / efficiency,
              );
              const timeToNextReward = Math.max(
                0,
                basePulsesToNextReward * EXPEDITION_PULSE_MS - timeCarry,
              );

              return (
                <article className="expedition-hunt-card" key={cat.id}>
                  <div className="expedition-card-hero">
                    <img
                      className="expedition-card-art"
                      src={`${base}art/superpowers/zones/${zoneArt[zone.id]}`}
                      alt=""
                      loading="lazy"
                    />
                    <div className="expedition-card-veil" aria-hidden="true" />
                  </div>
                  <div className="expedition-hunt-content">
                    <div className="expedition-cat-line">
                      <CatSprite hero={cat.catClass} scale={3} label={cat.name} />
                      <div>
                        <p className="eyebrow">{zone.name}</p>
                        <h4>{cat.name}</h4>
                      </div>
                      <span className="expedition-efficiency">{efficiency.toFixed(2)}×</span>
                    </div>

                    <div className="expedition-bag-line">
                      <span>Saco de caça</span>
                      <strong>
                        {formatPulses(accumulated)}/{EXPEDITION_PULSE_CAP} · {Math.floor(percentage)}%
                      </strong>
                    </div>
                    <div
                      className="expedition-progress"
                      role="progressbar"
                      aria-label={`Saco de ${cat.name}`}
                      aria-valuemin={0}
                      aria-valuemax={EXPEDITION_PULSE_CAP}
                      aria-valuenow={Math.min(EXPEDITION_PULSE_CAP, accumulated)}
                      aria-valuetext={`${formatPulses(accumulated)} de ${EXPEDITION_PULSE_CAP} pulsos no saco; ${resolvedPulses} prontos para coleta`}
                    >
                      <span style={{ width: `${percentage}%` }} />
                    </div>

                    <div className="expedition-hunt-facts">
                      <span>
                        <strong>{resolvedPulses}</strong> pulsos prontos
                      </span>
                      <span>
                        <strong>{resolvedPulses * zone.xpPerPulse}</strong> XP garantido
                      </span>
                      <span>
                        {percentage >= 100
                          ? 'Nenhum novo pulso enquanto o saco estiver cheio'
                          : `Próximo pulso resolvido em ≈ ${formatDuration(timeToNextReward)}`}
                      </span>
                      <span>
                        {percentage >= 100
                          ? 'Saco cheio'
                          : `Cheio em aproximadamente ${formatLongDuration(timeToFull)}`}
                      </span>
                    </div>

                    <button
                      className="expedition-collect"
                      type="button"
                      onClick={() => collectExpedition(cat.id)}
                    >
                      <GameIcon name="reward" />
                      {resolvedPulses === 0 ? 'Voltar sem coleta' : 'Coletar e voltar'}
                    </button>
                    {resolvedPulses === 0 ? (
                      <small>O tempo e o rendimento parcial serão preservados.</small>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="expedition-empty">
            <GameIcon name="expedition" />
            <div>
              <strong>Nenhum gato atravessou o portão.</strong>
              <p>Escolha um caçador e uma zona abaixo para iniciar.</p>
            </div>
          </div>
        )}
      </section>

      <section className="expedition-section" aria-labelledby="choose-hunter-title">
        <div className="expedition-section-title">
          <GameIcon name="colony" />
          <div>
            <p className="eyebrow">Companhia</p>
            <h3 id="choose-hunter-title">Escolha um gato livre</h3>
          </div>
        </div>

        {freeCats.length > 0 ? (
          <div className="expedition-cat-picker" role="group" aria-label="Gato da próxima expedição">
            {freeCats.map((cat) => {
              const selected = cat.id === selectedCat?.id;
              return (
                <button
                  className={`expedition-cat-option${selected ? ' is-selected' : ''}`}
                  type="button"
                  key={cat.id}
                  aria-pressed={selected}
                  onClick={() => setSelectedCatId(cat.id)}
                >
                  <CatSprite
                    hero={cat.catClass}
                    scale={2}
                    label={`${cat.name}, nível ${cat.level}`}
                  />
                  <span>
                    <strong>{cat.name}</strong>
                    <small>Nv. {cat.level} · Poder {formatPulses(getCatPower(cat))}</small>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="expedition-no-cats">Todos os gatos estão ocupados. Colete uma caçada ou aguarde uma atividade.</p>
        )}
      </section>

      <section className="expedition-section" aria-labelledby="zones-title">
        <div className="expedition-section-title">
          <GameIcon name="world" />
          <div>
            <p className="eyebrow">Rotas espectrais</p>
            <h3 id="zones-title">Zonas do Além</h3>
          </div>
        </div>

        <div className="expedition-zone-grid">
          {expeditionZones.map((zone) => {
            const unlocked = selectedCat
              ? isExpeditionZoneUnlocked(state, selectedCat.id, zone.id)
              : false;
            const power = selectedCat ? getCatPower(selectedCat) : 0;
            const efficiency = selectedCat
              ? getExpeditionEfficiency(selectedCat, zone.id)
              : 0;

            return (
              <article
                className={`expedition-zone-card${unlocked ? '' : ' is-locked'}`}
                key={zone.id}
              >
                <div className="expedition-card-hero">
                  <img
                    className="expedition-card-art"
                    src={`${base}art/superpowers/zones/${zoneArt[zone.id]}`}
                    alt=""
                    loading="lazy"
                  />
                  <div className="expedition-card-veil" aria-hidden="true" />
                </div>
                <div className="expedition-zone-content">
                  <div className="expedition-zone-head">
                    <div>
                      <p className="eyebrow">Poder recomendado {zone.recommendedPower}</p>
                      <h4>{zone.name}</h4>
                    </div>
                    <span className={unlocked ? 'zone-open' : 'zone-locked'}>
                      {unlocked ? 'Aberta' : 'Bloqueada'}
                    </span>
                  </div>
                  <p>{zone.description}</p>

                  <div className="expedition-loot-promise">
                    <h5>Possíveis achados</h5>
                    <ul>
                      {zone.lootTable.map((loot) => (
                        <li key={loot.item}>
                          <GameIcon name={loot.item} />
                          <span>
                            <strong>{inventoryItemLabels[loot.item]}</strong>
                            <small>{(loot.chancePerPulse * 100).toLocaleString('pt-BR')}% por pulso</small>
                          </span>
                        </li>
                      ))}
                      {zone.gearTable.map((drop) => (
                        <li className="expedition-rare-loot" key={drop.item}>
                          <GearArt gearId={drop.item} />
                          <span>
                            <strong>{gearById[drop.item].name}</strong>
                            <small>
                              Raro · {(drop.chancePerPulse * 100).toLocaleString('pt-BR')}% por pulso
                            </small>
                          </span>
                        </li>
                      ))}
                      <li>
                        <GameIcon name="gems" />
                        <span>
                          <strong>Gema rara</strong>
                          <small>{(zone.gemChance * 100).toLocaleString('pt-BR')}% por pulso</small>
                        </span>
                      </li>
                    </ul>
                  </div>

                  <dl className="expedition-power-grid">
                    <div>
                      <dt>Poder do gato</dt>
                      <dd>{selectedCat ? formatPulses(power) : '—'}</dd>
                    </div>
                    <div>
                      <dt>Eficiência</dt>
                      <dd>{selectedCat ? `${efficiency.toFixed(2)}×` : '—'}</dd>
                    </div>
                    <div>
                      <dt>Ritmo</dt>
                      <dd>{selectedCat ? getEfficiencyLabel(efficiency) : 'Sem gato'}</dd>
                    </div>
                    <div>
                      <dt>XP por pulso</dt>
                      <dd>{zone.xpPerPulse}</dd>
                    </div>
                  </dl>

                  <p className="expedition-unlock-reason">{getUnlockText(zone, selectedCat, state)}</p>
                  <button
                    className="expedition-send"
                    type="button"
                    disabled={!selectedCat || !unlocked}
                    onClick={() => selectedCat && startExpedition(selectedCat.id, zone.id)}
                  >
                    <GameIcon name="expedition" />
                    {selectedCat ? `Enviar ${selectedCat.name}` : 'Nenhum gato livre'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
