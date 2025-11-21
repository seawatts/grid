import { useCallback, useEffect, useState } from 'react';
import type {
  Enemy,
  Landmine,
  PlayerProgress,
  Position,
  PowerUp,
  RunUpgrade,
  Tower,
} from '../game-types';

const STORAGE_KEY = 'grid_defense_game_state';
const STORAGE_VERSION = 1;

export interface SavedGameState {
  version: number;
  timestamp: number;

  // Core game state
  grid: string[][];
  towers: Tower[];
  unspawnedEnemies: Enemy[]; // Keep enemies that haven't spawned yet
  powerups: PowerUp[];
  landmines: Landmine[];

  // Game stats
  money: number;
  lives: number;
  score: number;
  wave: number;

  // Game status
  gameStatus: 'playing' | 'won' | 'lost';
  isPaused: boolean;
  gameSpeed: 1 | 2 | 4;
  isWaveActive: boolean;

  // Map info
  mapId: string;
  startPositions: Position[];
  goalPositions: Position[];
  obstacles: Position[];

  // Upgrades and bonuses
  progress: PlayerProgress;
  runUpgrade?: RunUpgrade;

  // Settings
  autoAdvance: boolean;

  // Counters
  towerIdCounter: number;
  enemyIdCounter: number;
  projectileIdCounter: number;
  particleIdCounter: number;
  damageNumberIdCounter: number;
  powerupIdCounter: number;
  landmineIdCounter: number;
}

export interface SavedGameInfo {
  mapId: string;
  wave: number;
  score: number;
  lives: number;
  money: number;
  timestamp: number;
}

export function useGameStatePersistence() {
  const [savedGameInfo, setSavedGameInfo] = useState<SavedGameInfo | null>(
    null,
  );

  // Check for saved game on mount
  useEffect(() => {
    const info = getSavedGameInfo();
    setSavedGameInfo(info);
  }, []);

  const saveGame = useCallback((state: Partial<SavedGameState>) => {
    try {
      const savedState: SavedGameState = {
        timestamp: Date.now(),
        version: STORAGE_VERSION,
        ...state,
      } as SavedGameState;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      // Update info
      setSavedGameInfo({
        lives: savedState.lives,
        mapId: savedState.mapId,
        money: savedState.money,
        score: savedState.score,
        timestamp: savedState.timestamp,
        wave: savedState.wave,
      });
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }, []);

  const clearSavedGame = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSavedGameInfo(null);
    } catch (error) {
      console.error('Failed to clear saved game:', error);
    }
  }, []);

  const loadGame = useCallback((): SavedGameState | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const parsed = JSON.parse(saved) as SavedGameState;

      // Version check
      if (parsed.version !== STORAGE_VERSION) {
        console.warn('Saved game version mismatch, clearing saved state');
        clearSavedGame();
        return null;
      }

      // Validate required fields
      if (
        !parsed.mapId ||
        typeof parsed.wave !== 'number' ||
        typeof parsed.money !== 'number'
      ) {
        console.warn('Invalid saved game state, clearing');
        clearSavedGame();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to load game state:', error);
      clearSavedGame();
      return null;
    }
  }, [clearSavedGame]);

  return {
    clearSavedGame,
    hasSavedGame: savedGameInfo !== null,
    loadGame,
    savedGameInfo,
    saveGame,
  };
}

// Helper function to get saved game info without the full hook
export function getSavedGameInfo(): SavedGameInfo | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as SavedGameState;

    if (parsed.version !== STORAGE_VERSION) {
      return null;
    }

    return {
      lives: parsed.lives,
      mapId: parsed.mapId,
      money: parsed.money,
      score: parsed.score,
      timestamp: parsed.timestamp,
      wave: parsed.wave,
    };
  } catch {
    return null;
  }
}
