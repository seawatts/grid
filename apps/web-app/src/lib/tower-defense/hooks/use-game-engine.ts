import { useCallback, useEffect, useRef } from 'react';
import { GameEngine } from '../engine/game-engine';
import { useGameStore } from '../store/game-store';
import type { GameConfig, SystemUpdateResult } from '../store/types';

export function useGameEngine(config?: GameConfig) {
  const engineRef = useRef<GameEngine | null>(null);
  const stateRef = useRef(useGameStore.getState());

  // Track initialization to prevent re-initialization on progress changes
  const lastMapIdRef = useRef<string | undefined>(undefined);
  const lastRunUpgradeRef = useRef<string | undefined>(undefined);

  // Select only state values (not actions) to avoid dependency issues
  const gameStatus = useGameStore((state) => state.gameStatus);
  const isPaused = useGameStore((state) => state.isPaused);

  // Keep state ref updated
  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      stateRef.current = state;
    });
    return unsubscribe;
  }, []);

  // Initialize game when config is provided or when map/runUpgrade changes
  // Don't re-initialize just because progress changes (tech points earned mid-game)
  useEffect(() => {
    if (!config) return;

    const runUpgradeKey = config.runUpgrade
      ? JSON.stringify(config.runUpgrade)
      : undefined;
    const shouldInitialize =
      lastMapIdRef.current !== config.mapId ||
      lastRunUpgradeRef.current !== runUpgradeKey;

    if (shouldInitialize) {
      lastMapIdRef.current = config.mapId;
      lastRunUpgradeRef.current = runUpgradeKey;
      useGameStore.getState().initializeGame(config);
    }
  }, [config]);

  // Handle state updates from engine
  // Use getState() to avoid including actions in dependencies
  const handleStateUpdate = useCallback((updates: SystemUpdateResult) => {
    const store = useGameStore.getState();

    if (updates.spawnedEnemies !== undefined)
      store.updateSpawnedEnemies(updates.spawnedEnemies);
    if (updates.unspawnedEnemies !== undefined)
      store.updateUnspawnedEnemies(updates.unspawnedEnemies);
    if (updates.towers !== undefined) store.updateTowers(updates.towers);
    if (updates.projectiles !== undefined)
      store.updateProjectiles(updates.projectiles);
    if (updates.particles !== undefined)
      store.updateParticles(updates.particles);
    if (updates.particleIdCounter !== undefined)
      store.setParticleIdCounter(updates.particleIdCounter);
    if (updates.damageNumbers !== undefined)
      store.updateDamageNumbers(updates.damageNumbers);
    if (updates.damageNumberIdCounter !== undefined)
      store.setDamageNumberIdCounter(updates.damageNumberIdCounter);
    if (updates.placeables !== undefined)
      store.updatePlaceables(updates.placeables);
    if (updates.placeableIdCounter !== undefined)
      store.setPlaceableIdCounter(updates.placeableIdCounter);
    // Legacy updates (for backward compatibility)
    if (updates.powerups !== undefined) store.updatePowerups(updates.powerups);
    if (updates.landmines !== undefined)
      store.updateLandmines(updates.landmines);
    if (updates.money !== undefined) store.setMoney(updates.money);
    if (updates.lives !== undefined) store.setLives(updates.lives);
    if (updates.score !== undefined)
      store.addScore(updates.score - stateRef.current.score);
    if (updates.combo !== undefined) store.setCombo(updates.combo);
    if (updates.wave !== undefined) store.setWave(updates.wave);
    if (updates.isWaveActive !== undefined)
      store.setIsWaveActive(updates.isWaveActive);
    if (updates.gameStatus !== undefined)
      store.setGameStatus(updates.gameStatus);
    if (updates.lastKillTime !== undefined)
      store.updateLastKillTime(updates.lastKillTime);
    if (updates.projectileIdCounter !== undefined)
      store.setProjectileIdCounter(updates.projectileIdCounter);
    if (updates.enemyIdCounter !== undefined)
      store.setEnemyIdCounter(updates.enemyIdCounter);
    if (updates.powerupIdCounter !== undefined)
      store.setPowerupIdCounter(updates.powerupIdCounter);
    if (updates.landmineIdCounter !== undefined)
      store.setLandmineIdCounter(updates.landmineIdCounter);
  }, []); // Empty dependencies - we use getState() inside

  // Initialize engine
  useEffect(() => {
    engineRef.current = new GameEngine(handleStateUpdate);

    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, [handleStateUpdate]);

  // Start/stop engine based on game status and pause state
  useEffect(() => {
    if (!engineRef.current) return;

    if (gameStatus === 'playing' && !isPaused) {
      engineRef.current.start();
    } else {
      engineRef.current.pause();
    }
  }, [gameStatus, isPaused]);

  // Update engine with current state every frame
  useEffect(() => {
    if (!engineRef.current || gameStatus !== 'playing' || isPaused) return;

    const interval = setInterval(() => {
      if (engineRef.current) {
        engineRef.current.update(stateRef.current);
      }
    }, 50); // Update at ~20 FPS

    return () => clearInterval(interval);
  }, [gameStatus, isPaused]);

  const startWave = useCallback(() => {
    if (!engineRef.current) return;

    const updates = engineRef.current.startWave(stateRef.current);
    handleStateUpdate(updates);
  }, [handleStateUpdate]);

  const generateItems = useCallback(() => {
    if (!engineRef.current) return;

    const updates = engineRef.current.generateItems(stateRef.current, 1, true);
    handleStateUpdate(updates);
  }, [handleStateUpdate]);

  const resetGame = useCallback(() => {
    if (config) {
      useGameStore.getState().initializeGame(config);
    }
  }, [config]);

  // Generate initial items when game starts (wave 0 -> wave 1)
  useEffect(() => {
    if (config && engineRef.current) {
      // Generate items for wave 1 on initialization
      generateItems();
    }
  }, [
    config?.mapId, // Generate items for wave 1 on initialization
    generateItems,
    config,
  ]); // Only run when map changes

  return {
    engine: engineRef.current,
    generateItems,
    resetGame,
    startWave,
  };
}
