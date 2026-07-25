import { useEffect, useRef, useState } from 'react';
import {
  gearItemKeys,
  resourceKeys,
  resourceLabels,
  specialItemKeys,
  specialItemLabels,
  type ExpeditionTrophyKey,
  trophyKeys,
} from '../../game/models/resources.ts';
import { gearById, gearTierLabels } from '../../game/data/gear.ts';
import {
  expeditionTrophyById,
  expeditionTrophyRarityLabels,
} from '../../game/data/trophies.ts';
import { useGame } from '../../app/gameProvider.tsx';
import { GearArt } from '../components/GearArt.tsx';
import { GameIcon } from '../components/GameIcon.tsx';
import { TrophyArt } from '../components/TrophyArt.tsx';

export function InventoryScreen() {
  const { state, sellTrophy } = useGame();
  const [pendingSaleId, setPendingSaleId] = useState<ExpeditionTrophyKey | null>(null);
  const [returnFocusSaleId, setReturnFocusSaleId] = useState<ExpeditionTrophyKey | null>(null);
  const [focusPanelAfterSale, setFocusPanelAfterSale] = useState(false);
  const [saleAnnouncement, setSaleAnnouncement] = useState('');
  const trophyPanelRef = useRef<HTMLElement>(null);
  const trophyHeadingRef = useRef<HTMLHeadingElement>(null);
  const cancelButtonRefs = useRef<Partial<Record<ExpeditionTrophyKey, HTMLButtonElement | null>>>({});
  const sellAllButtonRefs = useRef<Partial<Record<ExpeditionTrophyKey, HTMLButtonElement | null>>>({});
  const possessedTrophyKeys = trophyKeys.filter((trophyId) => state.inventory[trophyId] > 0);
  const trophyTotalValue = trophyKeys.reduce(
    (total, trophyId) =>
      total + state.inventory[trophyId] * expeditionTrophyById[trophyId].sellValue,
    0,
  );

  useEffect(() => {
    if (pendingSaleId) {
      cancelButtonRefs.current[pendingSaleId]?.focus();
      return;
    }
    if (returnFocusSaleId) {
      const focusTarget = sellAllButtonRefs.current[returnFocusSaleId]
        ?? trophyHeadingRef.current
        ?? trophyPanelRef.current;
      focusTarget?.focus();
      setReturnFocusSaleId(null);
      return;
    }
    if (focusPanelAfterSale) {
      (trophyHeadingRef.current ?? trophyPanelRef.current)?.focus();
      setFocusPanelAfterSale(false);
    }
  }, [focusPanelAfterSale, pendingSaleId, returnFocusSaleId]);

  const sellOne = (trophyId: ExpeditionTrophyKey) => {
    setPendingSaleId(null);
    setReturnFocusSaleId(null);
    setSaleAnnouncement('');
    sellTrophy(trophyId, 'one');
  };
  const requestSellAll = (trophyId: ExpeditionTrophyKey) => {
    const trophy = expeditionTrophyById[trophyId];
    const quantity = state.inventory[trophyId];
    setReturnFocusSaleId(null);
    setPendingSaleId(trophyId);
    setSaleAnnouncement(
      `Confirme a venda de ${quantity} ${trophy.name} por ${quantity * trophy.sellValue} moedas.`,
    );
  };
  const cancelSellAll = (trophyId: ExpeditionTrophyKey) => {
    setPendingSaleId(null);
    setReturnFocusSaleId(trophyId);
    setSaleAnnouncement('Venda em lote cancelada.');
  };
  const confirmSellAll = (trophyId: ExpeditionTrophyKey) => {
    setPendingSaleId(null);
    setReturnFocusSaleId(null);
    setFocusPanelAfterSale(true);
    setSaleAnnouncement('Venda em lote confirmada.');
    sellTrophy(trophyId, 'all');
  };

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

      <section
        ref={trophyPanelRef}
        className="panel trophy-panel"
        aria-labelledby="trophy-inventory-title"
        tabIndex={-1}
      >
        <div className="trophy-panel-heading">
          <div>
            <p className="eyebrow">Espólios vendáveis</p>
            <h3 ref={trophyHeadingRef} id="trophy-inventory-title" tabIndex={-1}>
              Troféus do Além
            </h3>
          </div>
          <strong>
            <GameIcon name="coins" />
            Valor total: {trophyTotalValue}
          </strong>
        </div>
        <p className="trophy-sale-status" aria-live="polite">
          {saleAnnouncement}
        </p>
        {possessedTrophyKeys.length > 0 ? (
          <ul className="trophy-inventory-list">
            {possessedTrophyKeys.map((trophyId) => {
              const trophy = expeditionTrophyById[trophyId];
              const quantity = state.inventory[trophyId];
              const isConfirmingSale = pendingSaleId === trophyId;
              return (
                <li key={trophyId} data-rarity={trophy.rarity}>
                  <TrophyArt trophyId={trophyId} />
                  <div className="trophy-copy">
                    <strong>{trophy.name}</strong>
                    <span className={`trophy-rarity trophy-rarity-${trophy.rarity}`}>
                      {expeditionTrophyRarityLabels[trophy.rarity]}
                    </span>
                    <small>
                      {quantity} disponíveis · {trophy.sellValue} moedas cada · {quantity * trophy.sellValue} total
                    </small>
                  </div>
                  {isConfirmingSale ? (
                    <div className="trophy-sale-actions trophy-confirmation-actions">
                      <button
                        ref={(node) => {
                          cancelButtonRefs.current[trophyId] = node;
                        }}
                        type="button"
                        className="ghost-action"
                        onClick={() => cancelSellAll(trophyId)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="primary-action"
                        onClick={() => confirmSellAll(trophyId)}
                      >
                        Confirmar {quantity} por {quantity * trophy.sellValue} moedas
                      </button>
                    </div>
                  ) : (
                    <div className="trophy-sale-actions">
                      <button
                        type="button"
                        className="ghost-action"
                        aria-label={`Vender 1 ${trophy.name} por ${trophy.sellValue} moedas`}
                        onClick={() => sellOne(trophyId)}
                      >
                        Vender 1
                      </button>
                      <button
                        ref={(node) => {
                          sellAllButtonRefs.current[trophyId] = node;
                        }}
                        type="button"
                        className="primary-action"
                        aria-label={`Preparar venda de todos os ${quantity} ${trophy.name} por ${quantity * trophy.sellValue} moedas`}
                        onClick={() => requestSellAll(trophyId)}
                      >
                        Vender tudo
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="trophy-empty-state">
            <GameIcon name="expedition" />
            <div>
              <strong>O saco do Além está vazio</strong>
              <p>Envie seus gatos em expedição para encontrar troféus vendáveis.</p>
            </div>
          </div>
        )}
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
