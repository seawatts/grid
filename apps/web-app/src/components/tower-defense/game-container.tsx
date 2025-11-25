'use client';

import { useState } from 'react';
import SplashScreen from '~/components/tower-defense/splash-screen';
import TowerDefenseGame from '~/components/tower-defense/tower-defense-game';
import type { RunUpgrade } from '~/lib/tower-defense/game-types';
import { useGameProgress } from '~/lib/tower-defense/hooks/use-game-progress';
import { useGameStatePersistence } from '~/lib/tower-defense/hooks/use-game-state-persistence';

export default function GameContainer() {
  const [showSplash, setShowSplash] = useState(true);
  const [gameEntered, setGameEntered] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState('open');
  const [selectedRunUpgrade, setSelectedRunUpgrade] = useState<
    RunUpgrade | undefined
  >(undefined);
  const [isResuming, setIsResuming] = useState(false);

  const { progress, purchaseUpgrade, earnTechPoints } = useGameProgress();
  const { savedGameInfo, clearSavedGame } = useGameStatePersistence();

  const handleEnterGame = (mapId: string, runUpgrade?: RunUpgrade) => {
    setSelectedMapId(mapId);
    setSelectedRunUpgrade(runUpgrade);
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
    setSelectedRunUpgrade(undefined);
    setIsResuming(false);
  };

  if (showSplash) {
    return (
      <SplashScreen
        onNewGame={handleNewGame}
        onPurchaseUpgrade={purchaseUpgrade}
        onResume={handleResumeGame}
        onStart={handleEnterGame}
        progress={progress}
        savedGameInfo={savedGameInfo}
      />
    );
  }

  return (
    <TowerDefenseGame
      isEntering={gameEntered}
      isResuming={isResuming}
      mapId={selectedMapId}
      onEarnTP={earnTechPoints}
      onQuit={handleQuit}
      progress={progress}
      runUpgrade={selectedRunUpgrade}
    />
  );
}
