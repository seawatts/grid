'use client';

import { useEffect, useState } from 'react';
import GameBoard from '~/components/tower-defense/game-board';
import GameControls from '~/components/tower-defense/game-controls';
import GameStats from '~/components/tower-defense/game-stats';
import ItemDetails from '~/components/tower-defense/item-details';
import SettingsMenu from '~/components/tower-defense/settings-menu';
import TowerManagement from '~/components/tower-defense/tower-management';
import TowerSelector from '~/components/tower-defense/tower-selector';
import { MAX_WAVES } from '~/lib/tower-defense/constants/balance';
import {
  MAX_CELL_SIZE,
  MIN_CELL_SIZE,
} from '~/lib/tower-defense/constants/visuals';
import type {
  PlayerProgress,
  Position,
  RunUpgrade,
} from '~/lib/tower-defense/game-types';
import { useGameControls } from '~/lib/tower-defense/hooks/use-game-controls';
import { useGameEngine } from '~/lib/tower-defense/hooks/use-game-engine';
import { findPathsForMultipleStartsAndGoals } from '~/lib/tower-defense/pathfinding';
import { useGameStore } from '~/lib/tower-defense/store/game-store';

interface TowerDefenseGameProps {
  mapId: string;
  runUpgrade?: RunUpgrade;
  isEntering?: boolean;
  onQuit?: () => void;
  progress: PlayerProgress;
  onEarnTP: (amount: number) => void;
}

export default function TowerDefenseGame({
  mapId,
  runUpgrade,
  isEntering = false,
  onQuit,
  progress,
}: TowerDefenseGameProps) {
  // UI state
  const [cellSize, setCellSize] = useState(28);
  const [isMobile, setIsMobile] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const [debugPaths, setDebugPaths] = useState<Position[][]>([]);
  const [animatedPathLengths, setAnimatedPathLengths] = useState<number[]>([]);
  const [touchFeedback, _setTouchFeedback] = useState<Position | null>(null);

  // Game store
  const {
    grid,
    towers,
    spawnedEnemies,
    projectiles,
    particles,
    damageNumbers,
    powerups,
    landmines,
    money,
    lives,
    score,
    combo,
    wave,
    selectedTowerType,
    selectedTower,
    selectedItem,
    isWaveActive,
    gameStatus,
    isPaused,
    gameSpeed,
    autoAdvance,
    startPositions,
    goalPositions,
    obstacles,
    setSelectedTowerType,
    setSelectedTower,
    setSelectedItem,
    togglePause,
    cycleGameSpeed,
    toggleAutoAdvance,
  } = useGameStore();

  // Initialize game engine
  const { startWave, resetGame } = useGameEngine({
    mapId,
    progress,
    runUpgrade,
  });

  // Game controls
  const { handleCellClick, upgradeTower, deleteTower } = useGameControls();

  // Handle entering animation
  useEffect(() => {
    if (isEntering) {
      const gridTimer = setTimeout(() => {
        setShowGrid(true);
      }, 300);

      const uiTimer = setTimeout(() => {
        setShowUI(true);
      }, 1200);

      return () => {
        clearTimeout(gridTimer);
        clearTimeout(uiTimer);
      };
    }
  }, [isEntering]);

  // Handle responsive cell size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width < 640);

      const headerHeight = width < 640 ? 100 : 120;
      const footerHeight = width < 640 ? 140 : 160;
      const padding = 32;

      const availableHeight = height - headerHeight - footerHeight - padding;
      const availableWidth = Math.min(width - padding, 896);

      const maxCellSizeHeight = Math.floor(availableHeight / grid.length);
      const maxCellSizeWidth = Math.floor(availableWidth / grid.length);

      const newCellSize = Math.min(
        Math.max(Math.min(maxCellSizeHeight, maxCellSizeWidth), MIN_CELL_SIZE),
        MAX_CELL_SIZE,
      );

      setCellSize(newCellSize);
    };

    if (grid.length > 0) {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [grid.length]);

  // Update debug paths when towers change
  useEffect(() => {
    if (grid.length === 0) return;

    const blockedPositions = [...towers.map((t) => t.position), ...obstacles];

    const newPaths = findPathsForMultipleStartsAndGoals(
      startPositions,
      goalPositions,
      blockedPositions,
      grid.length,
    ).filter((path): path is Position[] => path !== null);

    setDebugPaths(newPaths);
    setAnimatedPathLengths(newPaths.map(() => newPaths[0]?.length || 0));
  }, [grid, towers, obstacles, startPositions, goalPositions]);

  // Auto-advance to next wave
  useEffect(() => {
    if (
      autoAdvance &&
      !isWaveActive &&
      wave > 0 &&
      wave < MAX_WAVES &&
      spawnedEnemies.length === 0 &&
      gameStatus === 'playing'
    ) {
      const timer = setTimeout(() => {
        startWave();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [
    autoAdvance,
    isWaveActive,
    wave,
    spawnedEnemies.length,
    gameStatus,
    startWave,
  ]);

  if (grid.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div
            className="text-4xl font-bold animate-pulse"
            style={{
              background:
                'linear-gradient(135deg, rgb(6, 182, 212), rgb(168, 85, 247))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            INITIALIZING GRID...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col p-2 sm:p-6 lg:p-8 font-mono overflow-hidden relative">
      {/* Background grid */}
      <div
        className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${showGrid ? 'opacity-100' : 'opacity-0'}`}
        style={{
          animation: showGrid ? 'grid-sweep 1.2s ease-out forwards' : 'none',
        }}
      >
        <svg
          aria-label="Game background grid"
          className="w-full h-full"
          role="img"
        >
          <defs>
            <pattern
              height="40"
              id="fullpage-grid"
              patternUnits="userSpaceOnUse"
              width="40"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(6, 182, 212, 0.15)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect
            className="animate-pulse"
            fill="url(#fullpage-grid)"
            height="100%"
            style={{ animationDuration: '3s' }}
            width="100%"
          />
        </svg>
      </div>

      {/* Corner decorations */}
      <div
        className={`absolute top-4 left-4 w-12 h-12 sm:w-16 sm:h-16 border-l-2 border-t-2 border-cyan-400/50 pointer-events-none transition-all duration-1000 ${showGrid ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
        style={{ transitionDelay: '200ms' }}
      />
      <div
        className={`absolute top-4 right-4 w-12 h-12 sm:w-16 sm:h-16 border-r-2 border-t-2 border-pink-400/50 pointer-events-none transition-all duration-1000 ${showGrid ? 'opacity-100 scale-100' : 'opacity-0 scale-40'}`}
        style={{ transitionDelay: '400ms' }}
      />
      <div
        className={`absolute bottom-4 left-4 w-12 h-12 sm:w-16 sm:h-16 border-l-2 border-b-2 border-purple-400/50 pointer-events-none transition-all duration-1000 ${showGrid ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{ transitionDelay: '600ms' }}
      />
      <div
        className={`absolute bottom-4 right-4 w-12 h-12 sm:w-16 sm:h-16 border-r-2 border-b-2 border-cyan-400/50 pointer-events-none transition-all duration-1000 ${showGrid ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
        style={{ transitionDelay: '800ms' }}
      />

      <div className="flex-1 flex flex-col max-w-[100vw] sm:max-w-4xl mx-auto w-full relative z-10 px-1 sm:px-0 pt-2 sm:pt-6">
        <div
          className={`mb-2 sm:mb-6 flex flex-row gap-1 sm:gap-4 justify-between items-center transition-all duration-700 ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          style={{ transitionDelay: '300ms' }}
        >
          <GameStats
            combo={combo}
            lives={lives}
            maxWaves={MAX_WAVES}
            money={money}
            score={score}
            wave={wave}
          />

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
            onOpenSettings={() => setShowSettings(true)}
            onSpeedChange={cycleGameSpeed}
            onStartWave={startWave}
            onToggleAutoAdvance={toggleAutoAdvance}
            onTogglePause={togglePause}
          />
        </div>

        <div
          className={`flex-1 flex items-center justify-center my-1 sm:my-4 transition-all duration-1000 ${showGrid ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          style={{ transitionDelay: '100ms' }}
        >
          <div className="relative">
            <GameBoard
              animatedPathLengths={animatedPathLengths}
              cellSize={cellSize}
              damageNumbers={damageNumbers}
              debugPaths={debugPaths}
              enemies={spawnedEnemies}
              gameStatus={gameStatus}
              goalPositions={goalPositions}
              grid={grid}
              isMobile={isMobile}
              landmines={landmines}
              onCellClick={handleCellClick}
              particles={particles}
              powerups={powerups}
              projectiles={projectiles}
              selectedTower={selectedTower}
              startPositions={startPositions}
              touchFeedback={touchFeedback}
              towers={towers}
            />
          </div>
        </div>

        <div
          className={`transition-all duration-700 mb-2 ${showUI ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '500ms' }}
        >
          {selectedTower ? (
            <TowerManagement
              money={money}
              onClose={() => setSelectedTower(null)}
              onDelete={deleteTower}
              onUpgrade={upgradeTower}
              tower={selectedTower}
            />
          ) : selectedItem ? (
            <ItemDetails
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
            />
          ) : (
            <TowerSelector
              gameStatus={gameStatus}
              isMobile={isMobile}
              money={money}
              onSelectTower={(type) => {
                if (selectedTowerType === type) {
                  setSelectedTowerType(null);
                } else {
                  setSelectedTowerType(type);
                }
                setSelectedTower(null);
                setSelectedItem(null);
              }}
              selectedTowerType={selectedTowerType}
            />
          )}
        </div>

        <div
          className={`text-center text-[9px] sm:text-xs pb-safe transition-all duration-700 ${showUI ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '700ms' }}
        >
          {isMobile
            ? 'TAP TOWER • TAP GRID • BUILD THE MAZE'
            : 'SELECT TOWER • CLICK GRID • CONTROL THE PATH'}
        </div>
      </div>

      {showSettings && (
        <SettingsMenu
          onClose={() => setShowSettings(false)}
          onQuit={() => onQuit?.()}
          onRestart={resetGame}
          onTogglePerformanceMonitor={() =>
            setShowPerformanceMonitor(!showPerformanceMonitor)
          }
          showPerformanceMonitor={showPerformanceMonitor}
        />
      )}
    </div>
  );
}
