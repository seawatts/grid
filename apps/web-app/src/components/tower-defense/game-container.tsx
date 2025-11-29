'use client';

import { useEffect, useState } from 'react';
import AdminDebugDrawer from '~/components/tower-defense/admin-debug-drawer';
import SplashScreen from '~/components/tower-defense/splash-screen';
import TowerDefenseGame from '~/components/tower-defense/tower-defense-game';
import { ENERGY_COST_PER_MAP } from '~/lib/tower-defense/constants/balance';
import type { WavePowerUp } from '~/lib/tower-defense/game-types';
import { useGameProgress } from '~/lib/tower-defense/hooks/use-game-progress';
import { useGameStatePersistence } from '~/lib/tower-defense/hooks/use-game-state-persistence';

export default function GameContainer() {
  const [showSplash, setShowSplash] = useState(true);
  const [gameEntered, setGameEntered] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState('open');
  const [selectedInitialPowerUp, setSelectedInitialPowerUp] = useState<
    WavePowerUp | undefined
  >(undefined);
  const [isResuming, setIsResuming] = useState(false);
  const [showAdminDebug, setShowAdminDebug] = useState(false);

  const {
    progress,
    purchaseUpgrade,
    earnTechPoints,
    recordMapRating,
    spendEnergy,
    addEnergy,
  } = useGameProgress();
  const { savedGameInfo, clearSavedGame } = useGameStatePersistence();

  // Handle keyboard shortcut for admin debug drawer (Ctrl+D / Cmd+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setShowAdminDebug((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEnterGame = (mapId: string, initialPowerUp?: WavePowerUp) => {
    // Check energy before starting (resumed games don't need energy)
    if (!isResuming && !spendEnergy(ENERGY_COST_PER_MAP)) {
      // Not enough energy - could show error message here
      return;
    }
    setSelectedMapId(mapId);
    setSelectedInitialPowerUp(initialPowerUp);
    setShowSplash(false);
    setGameEntered(true);
    setIsResuming(false);
  };

  const handleResumeGame = () => {
    if (savedGameInfo) {
      setSelectedMapId(savedGameInfo.mapId);
      setShowSplash(false);
      setGameEntered(true);
      setIsResuming(true);
    }
  };

  const handleNewGame = () => {
    clearSavedGame();
    setIsResuming(false);
  };

  const handleQuit = () => {
    setShowSplash(true);
    setGameEntered(false);
    setSelectedInitialPowerUp(undefined);
    setIsResuming(false);
  };

  return (
    <>
      {showSplash ? (
        <SplashScreen
          addEnergy={addEnergy}
          onNewGame={handleNewGame}
          onPurchaseUpgrade={purchaseUpgrade}
          onResume={handleResumeGame}
          onStart={handleEnterGame}
          progress={progress}
          savedGameInfo={savedGameInfo}
          spendEnergy={spendEnergy}
        />
      ) : (
        <TowerDefenseGame
          initialPowerUp={selectedInitialPowerUp}
          isEntering={gameEntered}
          isResuming={isResuming}
          mapId={selectedMapId}
          onAddEnergy={addEnergy}
          onEarnTP={earnTechPoints}
          onQuit={handleQuit}
          onRecordMapRating={recordMapRating}
          progress={progress}
        />
      )}

      <AdminDebugDrawer
        isGameActive={!showSplash}
        onAddEnergy={addEnergy}
        onOpenChange={setShowAdminDebug}
        open={showAdminDebug}
        progress={progress}
      />
    </>
  );
}
