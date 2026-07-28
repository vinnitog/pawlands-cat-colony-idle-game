import { gearById, gearTierLabels } from '../../game/data/gear.ts';
import type { Cat } from '../../game/models/cat.ts';
import type { GearSlot } from '../../game/models/gear.ts';
import { GearArt } from './GearArt.tsx';

export const gearSlotOrder: readonly GearSlot[] = ['weapon', 'armor', 'head', 'feet'];

export const gearSlotLabels: Record<GearSlot, string> = {
  weapon: 'Arma',
  armor: 'Armadura',
  head: 'Elmo',
  feet: 'Botas',
};

type EquipmentLoadoutProps = {
  cat: Cat;
  compact?: boolean;
};

export function EquipmentLoadout({ cat, compact = false }: EquipmentLoadoutProps) {
  return (
    <section
      className={`equipment-loadout${compact ? ' equipment-loadout--compact' : ''}`}
      aria-label={`Equipamentos visíveis de ${cat.name}`}
    >
      <strong className="equipment-loadout-title">Equipado agora</strong>
      <div className="equipment-loadout-slots" role="list">
        {gearSlotOrder.map((slot) => {
          const gearId = cat.equipment[slot];
          const item = gearId ? gearById[gearId] : null;
          const description = item
            ? `${gearSlotLabels[slot]}: ${item.name}, ${gearTierLabels[item.tier]}, mais ${item.power} poder`
            : `${gearSlotLabels[slot]}: espaço vazio`;

          return (
            <span
              className={`equipment-loadout-slot${item ? ' is-equipped' : ' is-empty'}`}
              role="listitem"
              aria-label={description}
              title={description}
              key={slot}
            >
              {gearId ? (
                <GearArt gearId={gearId} />
              ) : (
                <span className="equipment-loadout-empty" aria-hidden="true">—</span>
              )}
              <small>{gearSlotLabels[slot]}</small>
            </span>
          );
        })}
      </div>
    </section>
  );
}
