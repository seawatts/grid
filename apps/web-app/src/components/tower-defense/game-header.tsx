'use client';

import { Zap } from 'lucide-react';
import { useGameStore } from '~/lib/tower-defense/store/game-store';
import GameControls from './game-controls';
import GameStats from './game-stats';

interface GameHeaderProps {
  onWaveClick: () => void;
  onOpenSettings: () => void;
  onStartWave: () => void;
}

export default function GameHeader({
  onWaveClick,
  onOpenSettings,
  onStartWave,
}: GameHeaderProps) {
  // Zustand selectors
  const combo = useGameStore((state) => state.combo);
  const lives = useGameStore((state) => state.lives);
  const money = useGameStore((state) => state.money);
  const score = useGameStore((state) => state.score);
  const wave = useGameStore((state) => state.wave);
  const maxWaves = useGameStore((state) => state.maxWaves);
  const activeWavePowerUps = useGameStore((state) => state.activeWavePowerUps);
  const runUpgrade = useGameStore((state) => state.runUpgrade);
  const autoAdvance = useGameStore((state) => state.autoAdvance);
  const gameSpeed = useGameStore((state) => state.gameSpeed);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const isPaused = useGameStore((state) => state.isPaused);
  const isWaveActive = useGameStore((state) => state.isWaveActive);
  const showUI = useGameStore((state) => state.showUI);
  const togglePause = useGameStore((state) => state.togglePause);
  const cycleGameSpeed = useGameStore((state) => state.cycleGameSpeed);
  const toggleAutoAdvance = useGameStore((state) => state.toggleAutoAdvance);
  const setShowActivePowerUps = useGameStore(
    (state) => state.setShowActivePowerUps,
  );

  return (
    <div
      className={`mb-2 sm:mb-6 flex flex-row gap-1 sm:gap-4 justify-between items-center transition-all duration-700 ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
      style={{ transitionDelay: '300ms' }}
    >
      <div className="flex items-center gap-2">
        <GameStats
          combo={combo}
          lives={lives}
          maxWaves={maxWaves}
          money={money}
          onWaveClick={onWaveClick}
          score={score}
          wave={wave}
        />

        {activeWavePowerUps.length > 0 && (
          <button
            className="relative flex items-center gap-1 px-2 py-1.5 rounded border border-purple-400/30 bg-purple-500/10 hover:bg-purple-500/20 transition-all group"
            onClick={() => setShowActivePowerUps(true)}
            style={{
              boxShadow: '0 0 10px rgba(168, 85, 247, 0.2)',
            }}
            type="button"
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-white font-bold text-sm">
              {activeWavePowerUps.length}
            </span>
            {activeWavePowerUps.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            )}
          </button>
        )}
      </div>

      {runUpgrade && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded bg-cyan-950/30 border border-cyan-500/20 text-xs font-mono text-cyan-400">
          <span className="font-bold">ACTIVE BONUS:</span>
          <span>{runUpgrade.name}</span>
        </div>
      )}

      <GameControls
        autoAdvance={autoAdvance}
        gameSpeed={gameSpeed}
        gameStatus={gameStatus}
        isPaused={isPaused}
        isWaveActive={isWaveActive}
        onOpenSettings={onOpenSettings}
        onSpeedChange={cycleGameSpeed}
        onStartWave={onStartWave}
        onToggleAutoAdvance={toggleAutoAdvance}
        onTogglePause={togglePause}
      />
    </div>
  );
}
