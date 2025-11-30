import { useEffect, useRef } from 'react';
import { ENERGY_REWARD_ON_WIN } from '../constants/balance';
import { selectRandomPowerUps } from '../constants/wave-powerups';
import type { WavePowerUp } from '../game-types';
import { useGameStore } from '../store/game-store';
import { useGameStatePersistence } from './use-game-state-persistence';

interface UseGameLifecycleProps {
  initialPowerUp?: WavePowerUp;
  isResuming?: boolean;
  mapId: string;
  onAddEnergy?: (amount: number) => void;
  onRecordMapRating?: (mapId: string, stars: 1 | 2 | 3) => void;
}

export function useGameLifecycle({
  initialPowerUp,
  isResuming = false,
  mapId,
  onAddEnergy,
  onRecordMapRating,
}: UseGameLifecycleProps) {
  const hasAppliedInitialPowerUp = useRef(false);
  const hasLoadedSavedState = useRef(false);
  const initialLivesRef = useRef<number | null>(null);
  const hasRecordedRatingRef = useRef(false);
  const hasRewardedEnergyRef = useRef(false);
  const prevIsWaveActiveRef = useRef<boolean>(false);

  // Zustand selectors
  const grid = useGameStore((state) => state.grid);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const isWaveActive = useGameStore((state) => state.isWaveActive);
  const wave = useGameStore((state) => state.wave);
  const maxWaves = useGameStore((state) => state.maxWaves);
  const lives = useGameStore((state) => state.lives);
  const addWavePowerUp = useGameStore((state) => state.addWavePowerUp);
  const removeExpiredWavePowerUps = useGameStore(
    (state) => state.removeExpiredWavePowerUps,
  );
  const setPendingPowerUpSelection = useGameStore(
    (state) => state.setPendingPowerUpSelection,
  );
  const setAvailablePowerUps = useGameStore(
    (state) => state.setAvailablePowerUps,
  );
  const getSaveableState = useGameStore((state) => state.getSaveableState);
  const loadSavedState = useGameStore((state) => state.loadSavedState);

  // Persistence
  const { saveGame, loadGame, clearSavedGame } = useGameStatePersistence();

  // Apply initial power-up when game starts (not when resuming)
  useEffect(() => {
    if (
      initialPowerUp &&
      !isResuming &&
      gameStatus === 'playing' &&
      !hasAppliedInitialPowerUp.current &&
      grid.length > 0
    ) {
      addWavePowerUp(initialPowerUp);
      hasAppliedInitialPowerUp.current = true;
    }
  }, [initialPowerUp, isResuming, gameStatus, addWavePowerUp, grid.length]);

  // Reset flag when map changes
  useEffect(() => {
    hasAppliedInitialPowerUp.current = false;
  }, []);

  // Reset rating tracking when starting a new game
  useEffect(() => {
    if (!isResuming) {
      initialLivesRef.current = null;
      hasRecordedRatingRef.current = false;
      hasRewardedEnergyRef.current = false;
    }
  }, [isResuming]);

  // Track initial lives when game starts
  useEffect(() => {
    if (!isResuming && lives > 0 && initialLivesRef.current === null) {
      initialLivesRef.current = lives;
      hasRecordedRatingRef.current = false;
    }
  }, [lives, isResuming]);

  // Load saved state when resuming
  useEffect(() => {
    if (isResuming && !hasLoadedSavedState.current) {
      const savedState = loadGame();
      if (savedState) {
        loadSavedState(savedState, mapId);
        hasLoadedSavedState.current = true;
        hasRecordedRatingRef.current = true; // Prevent rating recording for resumed games
      }
    }
  }, [isResuming, loadGame, loadSavedState, mapId]);

  // Auto-save game state periodically
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      const state = getSaveableState();
      saveGame({
        ...state,
        mapId,
      });
    }, 5000); // Save every 5 seconds

    return () => clearInterval(interval);
  }, [gameStatus, getSaveableState, saveGame, mapId]);

  // Calculate and record rating when game is won
  useEffect(() => {
    if (
      gameStatus === 'won' &&
      onRecordMapRating &&
      initialLivesRef.current !== null &&
      !hasRecordedRatingRef.current
    ) {
      const livesLost = initialLivesRef.current - lives;
      let stars: 1 | 2 | 3;
      if (livesLost === 0) {
        stars = 3;
      } else if (livesLost === 1) {
        stars = 2;
      } else {
        stars = 1;
      }
      onRecordMapRating(mapId, stars);
      hasRecordedRatingRef.current = true;
    }
  }, [gameStatus, lives, mapId, onRecordMapRating]);

  // Reward energy when game is won
  useEffect(() => {
    if (gameStatus === 'won' && onAddEnergy && !hasRewardedEnergyRef.current) {
      onAddEnergy(ENERGY_REWARD_ON_WIN);
      hasRewardedEnergyRef.current = true;
    }
  }, [gameStatus, onAddEnergy]);

  // Clear saved state when game ends
  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      clearSavedGame();
    }
  }, [gameStatus, clearSavedGame]);

  // Detect wave completion and trigger power-up selection
  useEffect(() => {
    const wasWaveActive = prevIsWaveActiveRef.current;
    const isWaveComplete =
      wasWaveActive && !isWaveActive && wave > 0 && wave < maxWaves;

    prevIsWaveActiveRef.current = isWaveActive;

    if (isWaveComplete && gameStatus === 'playing') {
      removeExpiredWavePowerUps();
      const randomPowerUps = selectRandomPowerUps(3);
      setAvailablePowerUps(randomPowerUps);
      setPendingPowerUpSelection(true);
    }
  }, [
    isWaveActive,
    wave,
    maxWaves,
    gameStatus,
    removeExpiredWavePowerUps,
    setPendingPowerUpSelection,
    setAvailablePowerUps,
  ]);

  // Return handler for power-up selection
  const handlePowerUpSelect = (powerUp: WavePowerUp) => {
    addWavePowerUp(powerUp);
    setPendingPowerUpSelection(false);
    setAvailablePowerUps([]);
  };

  // Auto-advance logic will be handled in main component with startWave callback
  // This hook just provides the handler and lifecycle effects

  return {
    handlePowerUpSelect,
  };
}
