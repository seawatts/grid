'use client';

import { Button } from '@seawatts/ui/button';
import { FastForward, Pause, Play, Settings } from 'lucide-react';

export default function GameControls({
  gameSpeed,
  isWaveActive,
  isPaused,
  autoAdvance,
  gameStatus,
  onSpeedChange,
  onStartWave,
  onTogglePause,
  onToggleAutoAdvance,
  onOpenSettings,
}: {
  gameSpeed: 1 | 2 | 4;
  isWaveActive: boolean;
  isPaused: boolean;
  autoAdvance: boolean;
  gameStatus: 'playing' | 'won' | 'lost';
  onSpeedChange: () => void;
  onStartWave: () => void;
  onTogglePause: () => void;
  onToggleAutoAdvance: () => void;
  onOpenSettings: () => void;
}) {
  const handlePlayButtonClick = () => {
    if (!isWaveActive) {
      // Start wave if no wave is active
      onStartWave();
    } else {
      // Toggle pause if wave is active
      onTogglePause();
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        className="bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 border border-gray-400/30 rounded px-2 py-1.5 h-auto flex items-center justify-center font-bold active:scale-95 transition-all"
        onClick={onOpenSettings}
        style={{ boxShadow: '0 0 10px rgba(156, 163, 175, 0.2)' }}
      >
        <Settings className="w-4 h-4" />
      </Button>
      <Button
        className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-400/30 rounded px-2 py-1.5 h-auto text-sm font-bold active:scale-95 transition-all"
        onClick={onSpeedChange}
        style={{ boxShadow: '0 0 10px rgba(168, 85, 247, 0.2)' }}
      >
        {gameSpeed}X
      </Button>
      <Button
        className={`${autoAdvance ? 'bg-yellow-500/20 border-yellow-400' : 'bg-yellow-500/10 border-yellow-400/30'} hover:bg-yellow-500/20 text-yellow-400 border rounded px-2 py-1.5 h-auto flex items-center justify-center font-bold active:scale-95 transition-all`}
        onClick={onToggleAutoAdvance}
        style={{
          boxShadow: autoAdvance
            ? '0 0 15px rgba(234, 179, 8, 0.3)'
            : '0 0 10px rgba(234, 179, 8, 0.2)',
        }}
      >
        <FastForward className="w-4 h-4" />
      </Button>
      <Button
        className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 rounded disabled:opacity-30 px-2 py-1.5 h-auto font-bold active:scale-95 transition-all flex items-center justify-center"
        disabled={gameStatus !== 'playing'}
        onClick={handlePlayButtonClick}
        style={{
          boxShadow:
            !isWaveActive || isPaused
              ? '0 0 10px rgba(6, 182, 212, 0.2)'
              : 'none',
        }}
      >
        {isWaveActive && !isPaused ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
