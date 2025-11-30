import { useGameStore } from './game-store';
import type { SystemUpdateResult } from './types';

/**
 * Batches multiple state updates into a single Zustand set() call
 * This improves performance by reducing the number of store updates
 */
export function applySystemUpdates(updates: SystemUpdateResult): void {
  const store = useGameStore.getState();
  const state = store;

  // Build a single update object
  const batchedUpdate: Partial<typeof state> = {};

  // Handle entity updates
  if (updates.spawnedEnemies !== undefined) {
    batchedUpdate.spawnedEnemies = updates.spawnedEnemies;
  }
  if (updates.unspawnedEnemies !== undefined) {
    batchedUpdate.unspawnedEnemies = updates.unspawnedEnemies;
  }
  if (updates.towers !== undefined) {
    batchedUpdate.towers = updates.towers;
  }
  if (updates.projectiles !== undefined) {
    batchedUpdate.projectiles = updates.projectiles;
  }
  if (updates.particles !== undefined) {
    batchedUpdate.particles = updates.particles;
  }
  if (updates.damageNumbers !== undefined) {
    batchedUpdate.damageNumbers = updates.damageNumbers;
  }
  if (updates.placeables !== undefined) {
    batchedUpdate.placeables = updates.placeables;
  }

  // Handle counter updates
  if (updates.particleIdCounter !== undefined) {
    batchedUpdate.particleIdCounter = updates.particleIdCounter;
  }
  if (updates.damageNumberIdCounter !== undefined) {
    batchedUpdate.damageNumberIdCounter = updates.damageNumberIdCounter;
  }
  if (updates.placeableIdCounter !== undefined) {
    batchedUpdate.placeableIdCounter = updates.placeableIdCounter;
  }
  if (updates.projectileIdCounter !== undefined) {
    batchedUpdate.projectileIdCounter = updates.projectileIdCounter;
  }
  if (updates.enemyIdCounter !== undefined) {
    batchedUpdate.enemyIdCounter = updates.enemyIdCounter;
  }

  // Handle game state updates
  if (updates.money !== undefined) {
    batchedUpdate.money = updates.money;
  }
  if (updates.lives !== undefined) {
    batchedUpdate.lives = updates.lives;
  }
  if (updates.score !== undefined) {
    // Use addScore to handle score increments properly
    const currentScore = state.score;
    const scoreDiff = updates.score - currentScore;
    if (scoreDiff !== 0) {
      store.addScore(scoreDiff);
    }
  }
  if (updates.combo !== undefined) {
    batchedUpdate.combo = updates.combo;
  }
  if (updates.wave !== undefined) {
    batchedUpdate.wave = updates.wave;
  }
  if (updates.isWaveActive !== undefined) {
    batchedUpdate.isWaveActive = updates.isWaveActive;
  }
  if (updates.gameStatus !== undefined) {
    batchedUpdate.gameStatus = updates.gameStatus;
  }
  if (updates.lastKillTime !== undefined) {
    batchedUpdate.lastKillTime = updates.lastKillTime;
  }

  // Apply all updates in a single set() call
  if (Object.keys(batchedUpdate).length > 0) {
    useGameStore.setState(batchedUpdate);
  }
}
