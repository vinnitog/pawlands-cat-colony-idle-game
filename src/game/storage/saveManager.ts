import { createInitialGameState } from '../data/initialGameState.ts';
import type { GameState } from '../models/save.ts';
import { localStorageAdapter } from './localStorageAdapter.ts';
import { migrateGameSave } from './migrations.ts';
import type { StorageAdapter } from './storageAdapter.ts';

export const saveKey = 'pawlands.save.v1';

export function loadGame(adapter: StorageAdapter = localStorageAdapter): GameState {
  try {
    const raw = adapter.read(saveKey);

    if (!raw) {
      return createInitialGameState();
    }

    return migrateGameSave(JSON.parse(raw));
  } catch {
    return createInitialGameState();
  }
}

export function saveGame(state: GameState, adapter: StorageAdapter = localStorageAdapter, now = Date.now()): void {
  try {
    adapter.write(
      saveKey,
      JSON.stringify({
        ...state,
        lastSavedAt: now,
      }),
    );
  } catch {
    // Keep the game playable even if the browser refuses persistence.
  }
}

export function clearGame(adapter: StorageAdapter = localStorageAdapter): void {
  try {
    adapter.remove(saveKey);
  } catch {
    // Clearing save is best-effort when local storage is unavailable.
  }
}
