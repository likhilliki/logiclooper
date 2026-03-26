import { openDB, IDBPDatabase } from 'idb';
import type { GameState } from './types';

const DB_NAME = 'logic-looper-db';
const STORE_NAME = 'daily-state';
const DB_VERSION = 1;

/**
 * Initializes and returns the IndexedDB instance.
 * Safe to call multiple times in the client, but must NOT be called during SSR.
 */
export async function initDB(): Promise<IDBPDatabase | null> {
  if (typeof window === 'undefined') return null;

  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

/**
 * Persists the game state into IndexedDB overwriting any existing entry for the date key.
 * @param dateStr Format YYYY-MM-DD
 * @param state Complete game state to persist
 */
export async function saveDailyState<T>(dateStr: string, state: GameState<T>): Promise<void> {
  const db = await initDB();
  if (!db) return; // Silent return if server side

  await db.put(STORE_NAME, state, dateStr);
}

/**
 * Retrieves the game state for a given date if it exists.
 * @param dateStr Format YYYY-MM-DD
 */
export async function getDailyState<T>(dateStr: string): Promise<GameState<T> | undefined> {
  const db = await initDB();
  if (!db) return undefined;

  return await db.get(STORE_NAME, dateStr);
}

/**
 * Clears old states to prevent storage bloat.
 * Currently keeps all history (for 1 year graph), this is just an interface.
 */
export async function clearAllStates(): Promise<void> {
  const db = await initDB();
  if (!db) return;

  await db.clear(STORE_NAME);
}
