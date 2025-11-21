'use client';

import { useState } from 'react';
import SplashScreen from '~/components/tower-defense/splash-screen';
import TowerDefenseGame from '~/components/tower-defense/tower-defense-game';
import type { RunUpgrade } from '~/lib/tower-defense/game-types';
import { useGameProgress } from '~/lib/tower-defense/hooks/use-game-progress';

export default function GameContainer() {
  const [showSplash, setShowSplash] = useState(true);
  const [gameEntered, setGameEntered] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState('open');
  const [selectedRunUpgrade, setSelectedRunUpgrade] = useState<
    RunUpgrade | undefined
  >(undefined);

  const { progress, purchaseUpgrade, earnTechPoints } = useGameProgress();

  const handleEnterGame = (mapId: string, runUpgrade?: RunUpgrade) => {
    setSelectedMapId(mapId);
    setSelectedRunUpgrade(runUpgrade);
    setShowSplash(false);
    setGameEntered(true);
  };

  const handleQuit = () => {
    setShowSplash(true);
    setGameEntered(false);
    setSelectedRunUpgrade(undefined);
  };

  if (showSplash) {
    return (
      <SplashScreen
        onPurchaseUpgrade={purchaseUpgrade}
        onStart={handleEnterGame}
        progress={progress}
      />
    );
  }

  return (
    <TowerDefenseGame
      isEntering={gameEntered}
      mapId={selectedMapId}
      onEarnTP={earnTechPoints}
      onQuit={handleQuit}
      progress={progress}
      runUpgrade={selectedRunUpgrade}
    />
  );
}
