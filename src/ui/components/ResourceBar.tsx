import { resourceKeys, resourceLabels } from '../../game/models/resources.ts';
import type { Resources } from '../../game/models/resources.ts';

export function ResourceBar({ resources }: { resources: Resources }) {
  return (
    <section className="resource-grid" aria-label="Recursos">
      {resourceKeys.map((key) => (
        <div className="resource-tile" key={key}>
          <span>{resourceLabels[key]}</span>
          <strong>{resources[key]}</strong>
        </div>
      ))}
    </section>
  );
}
