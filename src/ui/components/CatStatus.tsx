import type { Cat } from '../../game/models/cat.ts';
import { xpForNextLevel } from '../../game/systems/levelSystem.ts';
import { CatSprite } from './CatSprite.tsx';
import { GameIcon } from './GameIcon.tsx';

export function CatStatus({ cat }: { cat: Cat }) {
  const nextLevelXp = xpForNextLevel(cat.level);
  const xpProgress = Math.min(100, Math.floor((cat.xp / nextLevelXp) * 100));
  const energyProgress = Math.min(100, Math.floor((cat.energy / cat.maxEnergy) * 100));

  return (
    <section className="cat-status">
      <div className="cat-portrait">
        <div className="scene-sky" />
        <div className="scene-sun" />
        <div className="scene-cloud one" />
        <div className="scene-cloud two" />
        <div className="scene-hill back" />
        <div className="scene-hill front" />
        <CatSprite hero="knight" scale={9} label={`${cat.name}, o gato cavaleiro da colônia`} />
        <div className="scene-sign">Torre de {cat.name}</div>
      </div>

      <div className="cat-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Primeiro cavaleiro</p>
            <h2>{cat.name}</h2>
          </div>
          <strong>Nível {cat.level}</strong>
        </div>

        <div className="meter-group">
          <label>
            <span>
              <GameIcon name="xp" />
              XP
            </span>
            <strong>
              {cat.xp}/{nextLevelXp}
            </strong>
          </label>
          <div className="meter">
            <span style={{ width: `${xpProgress}%` }} />
          </div>
        </div>

        <div className="meter-group">
          <label>
            <span>
              <GameIcon name="energy" />
              Energia
            </span>
            <strong>
              {cat.energy}/{cat.maxEnergy}
            </strong>
          </label>
          <div className="meter energy">
            <span style={{ width: `${energyProgress}%` }} />
          </div>
        </div>

        <dl className="stats-grid">
          <div>
            <dt>Ataque</dt>
            <dd>{cat.stats.attack}</dd>
          </div>
          <div>
            <dt>Defesa</dt>
            <dd>{cat.stats.defense}</dd>
          </div>
          <div>
            <dt>Caça</dt>
            <dd>{cat.stats.hunting}</dd>
          </div>
          <div>
            <dt>Pesca</dt>
            <dd>{cat.stats.fishing}</dd>
          </div>
          <div>
            <dt>Sorte</dt>
            <dd>{cat.stats.luck}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
