import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { GameEngine } from '../engine/game-engine';
import { useGameStore } from '../store/game-store';
import type { GameConfig, SystemUpdateResult } from '../store/types';
import { applySystemUpdates } from '../store/update-batcher';

export function useGameEngine(config?: GameConfig) {
  const engineRef = useRef<GameEngine | null>(null);
  const stateRef = useRef(useGameStore.getState());

  // Track initialization to prevent re-initialization on progress changes
  const lastMapIdRef = useRef<string | undefined>(undefined);
  const lastRunUpgradeRef = useRef<string | undefined>(undefined);
  // Track if initial items have been generated to prevent duplicate generation
  const hasGeneratedInitialItems = useRef(false);

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
      hasGeneratedInitialItems.current = false; // Reset flag when map changes
      useGameStore.getState().initializeGame(config);
    }
  }, [config]);

  // Handle state updates from engine using batched updates
  const handleStateUpdate = useCallback((updates: SystemUpdateResult) => {
    // Handle score updates separately to calculate difference
    if (updates.score !== undefined) {
      const currentScore = stateRef.current.score;
      const scoreDiff = updates.score - currentScore;
      if (scoreDiff !== 0) {
        useGameStore.getState().addScore(scoreDiff);
      }
    }

    // Apply all other updates in a single batched call
    applySystemUpdates(updates);

    // Update state ref for next comparison
    stateRef.current = useGameStore.getState();
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

    try {
      const updates = engineRef.current.startWave(stateRef.current);
      handleStateUpdate(updates);
    } catch (error) {
      // Handle path blocking errors
      if (error instanceof Error) {
        console.error('Failed to start wave:', error);
        toast.error('Cannot Start Wave', {
          description: error.message,
          duration: 5000,
        });
      } else {
        console.error('Failed to start wave:', error);
        toast.error('Cannot Start Wave', {
          description:
            'Some spawn points are blocked. Please remove towers or items blocking the path.',
          duration: 5000,
        });
      }
    }
  }, [handleStateUpdate]);

  const generateItems = useCallback(() => {
    if (!engineRef.current) return;

    const updates = engineRef.current.generateItems(stateRef.current, 1, true);
    handleStateUpdate(updates);
  }, [handleStateUpdate]);

  const resetGame = useCallback(() => {
    if (config) {
      useGameStore.getState().initializeGame(config);
      // Reset the flag so items can be regenerated after reset
      hasGeneratedInitialItems.current = false;
      // Generate items after reset, even if mapId hasn't changed
      // This ensures placeables are regenerated when resetting the same map
      if (engineRef.current) {
        // Use setTimeout to ensure initializeGame has completed
        setTimeout(() => {
          if (engineRef.current) {
            const updates = engineRef.current.generateItems(
              useGameStore.getState(),
              1,
              true,
            );
            handleStateUpdate(updates);
            hasGeneratedInitialItems.current = true;
          }
        }, 0);
      }
    }
  }, [config, handleStateUpdate]);

  // Generate initial items when game starts (wave 0 -> wave 1)
  useEffect(() => {
    if (config && engineRef.current && !hasGeneratedInitialItems.current) {
      const currentState = useGameStore.getState();
      // Only generate if wave is 0 and no items exist
      if (currentState.wave === 0 && currentState.placeables.length === 0) {
        generateItems();
        hasGeneratedInitialItems.current = true;
      }
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
