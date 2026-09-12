import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.tsx';
import { GameProvider } from './app/gameProvider.tsx';
import './styles/global.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Elemento root não encontrado.');
}

createRoot(root).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    }).catch(() => {
      // Persistence is independent from the app-shell cache; keep the game playable.
    });
  });
}
