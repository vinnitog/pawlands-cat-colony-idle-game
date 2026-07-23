import { useState } from 'react';
import { catClasses, defaultCatClass, type CatClass } from '../../game/models/catClass.ts';
import {
  catNameMaxLength,
  catNameMinLength,
  isValidCatName,
  normalizeCatName,
} from '../../game/systems/onboardingSystem.ts';
import { CatSprite } from '../components/CatSprite.tsx';

type StarterScreenProps = {
  onConfirm(choice: { name: string; catClass: CatClass }): void;
};

export function StarterScreen({ onConfirm }: StarterScreenProps) {
  const [selected, setSelected] = useState<CatClass>(defaultCatClass);
  const [name, setName] = useState('');
  const nameOk = isValidCatName(name);

  const submit = () => {
    if (!nameOk) return;
    onConfirm({ name: normalizeCatName(name), catClass: selected });
  };

  return (
    <div className="starter-screen">
      <div className="starter-veil" />

      <div className="starter-content">
        <header className="starter-head">
          <p className="eyebrow">Reino de Pawlands</p>
          <h1>Escolha seu Guardião</h1>
          <p className="starter-sub">
            Ele lidera a colônia — o gato que caça e defende. Os outros virão com o tempo.
          </p>
        </header>

        <div className="starter-cards" role="radiogroup" aria-label="Classe do guardião">
          {catClasses.map((cat) => {
            const isSelected = cat.id === selected;
            return (
              <button
                key={cat.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`starter-card starter-card--${cat.id}${isSelected ? ' is-selected' : ''}`}
                onClick={() => setSelected(cat.id)}
              >
                <div className="starter-card-stage">
                  <span className="starter-aura" aria-hidden="true" />
                  <CatSprite hero={cat.id} scale={7} label={`${cat.name}, ${cat.role}`} />
                </div>
                <h2>{cat.name}</h2>
                <p className="starter-role">{cat.role}</p>
                <p className="starter-blurb">{cat.blurb}</p>
                {isSelected ? <span className="starter-chosen">✓ Escolhido</span> : null}
              </button>
            );
          })}
        </div>

        <div className="starter-name">
          <label htmlFor="cat-name">Nome do guardião</label>
          <input
            id="cat-name"
            type="text"
            value={name}
            maxLength={catNameMaxLength}
            placeholder={`${catNameMinLength} a ${catNameMaxLength} letras`}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit();
            }}
          />
        </div>

        <button
          type="button"
          className="primary-action starter-start"
          disabled={!nameOk}
          onClick={submit}
        >
          ⚔ Começar a Jornada
        </button>
      </div>
    </div>
  );
}
