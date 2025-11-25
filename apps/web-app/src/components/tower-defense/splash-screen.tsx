'use client';

import { Button } from '@seawatts/ui/button';
import { useEffect, useState } from 'react';
import AnimatedLine from '~/components/animated-line';
import MapSelector from '~/components/tower-defense/map-selector';
import RunUpgradeSelector from '~/components/tower-defense/run-upgrade-selector';
import UpgradesMenu from '~/components/tower-defense/upgrades-menu';
import { RUN_UPGRADES } from '~/lib/tower-defense/game-constants';
import type {
  PlayerProgress,
  RunUpgrade,
  UpgradeType,
} from '~/lib/tower-defense/game-types';
import type { SavedGameInfo } from '~/lib/tower-defense/hooks/use-game-state-persistence';

interface SplashScreenProps {
  onStart: (mapId: string, runUpgrade?: RunUpgrade) => void;
  progress: PlayerProgress;
  onPurchaseUpgrade: (upgradeId: UpgradeType) => void;
  savedGameInfo: SavedGameInfo | null;
  onResume: () => void;
  onNewGame: () => void;
}

export default function SplashScreen({
  onStart,
  progress,
  onPurchaseUpgrade,
  savedGameInfo,
  onResume,
  onNewGame,
}: SplashScreenProps) {
  const [animate, setAnimate] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState('open');
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showRunSelector, setShowRunSelector] = useState(false);
  const [availableRunUpgrades, setAvailableRunUpgrades] = useState<
    RunUpgrade[]
  >([]);

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleMapConfirm = () => {
    const shuffled = [...RUN_UPGRADES].sort(() => 0.5 - Math.random());
    setAvailableRunUpgrades(shuffled.slice(0, 3));
    setShowMapSelector(false);
    setShowRunSelector(true);
  };

  const handleUpgradeSelect = (upgrade: RunUpgrade) => {
    onStart(selectedMapId, upgrade);
  };

  const handleNewGameClick = () => {
    onNewGame();
    setShowMapSelector(true);
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full">
          <title>Background Grid Pattern</title>
          <defs>
            <pattern
              height="40"
              id="splash-grid"
              patternUnits="userSpaceOnUse"
              width="40"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(6, 182, 212, 0.3)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect fill="url(#splash-grid)" height="100%" width="100%" />
        </svg>
      </div>

      <div className="absolute inset-0 overflow-hidden z-0">
        <AnimatedLine
          animate={animate}
          color="cyan"
          delay={0}
          direction="horizontal"
          position="25%"
        />
        <AnimatedLine
          animate={animate}
          color="pink"
          delay={200}
          direction="horizontal"
          position="50%"
        />
        <AnimatedLine
          animate={animate}
          color="purple"
          delay={400}
          direction="horizontal"
          position="75%"
        />
      </div>

      {showUpgrades && (
        <UpgradesMenu
          onClose={() => setShowUpgrades(false)}
          onPurchase={onPurchaseUpgrade}
          progress={progress}
        />
      )}

      <div className="relative z-20 text-center px-4 sm:px-8 max-w-4xl w-full">
        <div
          className={`transition-all duration-1000 ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          style={{ transitionDelay: '600ms' }}
        >
          <h1
            className="text-6xl sm:text-8xl lg:text-9xl font-tron font-bold mb-6 sm:mb-8 tracking-[0.2em] uppercase"
            style={{
              color: '#6DD5ED',
              textShadow: `
                0 0 20px rgba(109, 213, 237, 0.8),
                0 0 40px rgba(109, 213, 237, 0.6),
                0 0 60px rgba(109, 213, 237, 0.4),
                0 0 80px rgba(109, 213, 237, 0.2)
              `,
            }}
          >
            THE GRID
          </h1>

          {showRunSelector ? (
            <div className="mb-8">
              <RunUpgradeSelector
                onSelect={handleUpgradeSelect}
                upgrades={availableRunUpgrades}
              />
              <div className="flex gap-4 justify-center mt-8">
                <Button
                  className="bg-gray-700/20 hover:bg-gray-700/40 text-gray-400 border border-gray-600 px-6 py-3 text-sm font-mono"
                  onClick={() => {
                    setShowRunSelector(false);
                    setShowMapSelector(true);
                  }}
                >
                  BACK TO MAPS
                </Button>
              </div>
            </div>
          ) : showMapSelector ? (
            <div className="mb-8">
              <MapSelector
                onSelectMap={setSelectedMapId}
                selectedMapId={selectedMapId}
              />
              <div className="flex gap-4 justify-center mt-6">
                <Button
                  className="bg-gray-700/20 hover:bg-gray-700/40 text-gray-400 border border-gray-600 px-6 py-3 text-sm font-mono"
                  onClick={() => setShowMapSelector(false)}
                >
                  BACK
                </Button>
                <Button
                  className="relative group bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border-2 border-cyan-400 px-8 py-3 text-sm font-bold transition-all hover:scale-105"
                  onClick={handleMapConfirm}
                  style={{
                    boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)',
                  }}
                >
                  CONFIRM SECTOR
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8 sm:mb-12 space-y-2">
                <p className="text-cyan-400 text-lg sm:text-2xl font-mono animate-pulse">
                  CUT THEM OFF
                </p>
                <p className="text-pink-400 text-sm sm:text-lg font-mono opacity-80">
                  BUILD THE MAZE • CONTROL THE PATH • DOMINATE THE GRID
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                {savedGameInfo ? (
                  <>
                    <div className="bg-cyan-500/10 border-2 border-cyan-400/50 rounded-lg p-4 mb-2 w-full max-w-md">
                      <div className="text-center mb-3">
                        <p className="text-cyan-400 font-mono text-sm mb-1">
                          SAVED GAME DETECTED
                        </p>
                        <p className="text-gray-400 text-xs font-mono">
                          Wave {savedGameInfo.wave} • Score{' '}
                          {savedGameInfo.score} •{' '}
                          {formatTimestamp(savedGameInfo.timestamp)}
                        </p>
                      </div>
                    </div>

                    <Button
                      className="relative group bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border-2 border-cyan-400 px-12 py-6 sm:px-16 sm:py-8 text-xl sm:text-2xl font-bold transition-all hover:scale-110 active:scale-95 w-full max-w-md"
                      onClick={onResume}
                      style={{
                        boxShadow: '0 0 30px rgba(6, 182, 212, 0.5)',
                      }}
                    >
                      <span className="relative z-10">RESUME RUN</span>
                      <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/10 transition-all" />
                    </Button>

                    <Button
                      className="bg-pink-500/20 hover:bg-pink-500/40 text-pink-400 border-2 border-pink-400 px-8 py-4 text-lg font-bold transition-all hover:scale-105 w-full max-w-md"
                      onClick={handleNewGameClick}
                      style={{
                        boxShadow: '0 0 20px rgba(236, 72, 153, 0.3)',
                      }}
                    >
                      NEW RUN
                    </Button>
                  </>
                ) : (
                  <Button
                    className="relative group bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border-2 border-cyan-400 px-12 py-6 sm:px-16 sm:py-8 text-xl sm:text-2xl font-bold transition-all hover:scale-110 active:scale-95"
                    onClick={() => setShowMapSelector(true)}
                    style={{
                      boxShadow: '0 0 30px rgba(6, 182, 212, 0.5)',
                    }}
                  >
                    <span className="relative z-10">ENTER</span>
                    <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/10 transition-all" />
                  </Button>
                )}

                <Button
                  className="bg-purple-500/10 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 px-8 py-3 font-mono text-sm flex items-center gap-2 transition-all hover:scale-105"
                  onClick={() => setShowUpgrades(true)}
                >
                  <span>SYSTEM UPGRADES</span>
                  <span className="bg-purple-500/20 px-2 py-0.5 rounded text-xs border border-purple-500/30">
                    {progress.techPoints} TP
                  </span>
                </Button>
              </div>

              <p className="mt-8 sm:mt-12 text-gray-500 text-xs sm:text-sm font-mono">
                A DRIVER WHO BLOCKS THE PATH CONTROLS THE GAME
              </p>
            </>
          )}
        </div>
      </div>

      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-cyan-400 opacity-50" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-pink-400 opacity-50" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-purple-400 opacity-50" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-cyan-400 opacity-50" />
    </div>
  );
}
