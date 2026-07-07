import { resourceKeys, resourceLabels } from '../../game/models/resources.ts';
import type { Resources } from '../../game/models/resources.ts';
import { GameIcon } from './GameIcon.tsx';

export function ResourceBar({ resources }: { resources: Resources }) {
  return (
    <section className="resource-grid" aria-label="Recursos">
      {resourceKeys.map((key) => (
        <div className="resource-tile" key={key}>
          <GameIcon name={key} />
          <div>
            <span>{resourceLabels[key]}</span>
            <strong>{resources[key]}</strong>
          </div>
        </div>
      ))}
    </section>
  );
}
