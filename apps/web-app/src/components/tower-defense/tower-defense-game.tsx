'use client';

import { Drawer, DrawerContent } from '@seawatts/ui/drawer';
import { Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ActivePowerUpsDisplay from '~/components/tower-defense/active-powerups-display';
import GameBoard from '~/components/tower-defense/game-board';
import GameControls from '~/components/tower-defense/game-controls';
import GameStats from '~/components/tower-defense/game-stats';
import ItemDetails from '~/components/tower-defense/item-details';
import PerformanceMonitor from '~/components/tower-defense/performance-monitor';
import PowerUpSelector from '~/components/tower-defense/power-up-selector';
import SettingsMenu from '~/components/tower-defense/settings-menu';
import TowerManagement from '~/components/tower-defense/tower-management';
import TowerSelector from '~/components/tower-defense/tower-selector';
import { MAX_WAVES } from '~/lib/tower-defense/constants/balance';
import {
  MAX_CELL_SIZE,
  MIN_CELL_SIZE,
} from '~/lib/tower-defense/constants/visuals';
import { selectRandomPowerUps } from '~/lib/tower-defense/constants/wave-powerups';
import type {
  PlayerProgress,
  Position,
  RunUpgrade,
  WavePowerUp,
} from '~/lib/tower-defense/game-types';
import { useGameControls } from '~/lib/tower-defense/hooks/use-game-controls';
import { useGameEngine } from '~/lib/tower-defense/hooks/use-game-engine';
import { useGameStatePersistence } from '~/lib/tower-defense/hooks/use-game-state-persistence';
import { findPathsForMultipleStartsAndGoals } from '~/lib/tower-defense/pathfinding';
import { useGameStore } from '~/lib/tower-defense/store/game-store';
import { setupStressTest } from '~/lib/tower-defense/utils/stress-test';

interface TowerDefenseGameProps {
  mapId: string;
  initialPowerUp?: WavePowerUp;
  runUpgrade?: RunUpgrade; // Kept for backward compatibility with resumed games
  isEntering?: boolean;
  isResuming?: boolean;
  onQuit?: () => void;
  progress: PlayerProgress;
  onEarnTP: (amount: number) => void;
  onRecordMapRating?: (mapId: string, stars: 1 | 2 | 3) => void;
}

export default function TowerDefenseGame({
  mapId,
  initialPowerUp,
  runUpgrade,
  isEntering = false,
  isResuming = false,
  onQuit,
  progress,
  onRecordMapRating,
}: TowerDefenseGameProps) {
  // UI state
  const [cellSize, setCellSize] = useState(28);
  const [isMobile, setIsMobile] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [showActivePowerUps, setShowActivePowerUps] = useState(false);
  const [debugPaths, setDebugPaths] = useState<Position[][]>([]);
  const [animatedPathLengths, setAnimatedPathLengths] = useState<number[]>([]);
  const initialLivesRef = useRef<number | null>(null);
  const hasRecordedRatingRef = useRef(false);
  const prevIsWaveActiveRef = useRef<boolean>(false);
  const [availablePowerUps, setAvailablePowerUps] = useState<WavePowerUp[]>([]);

  // Game store
  const {
    grid,
    towers,
    spawnedEnemies,
    projectiles,
    particles,
    damageNumbers,
    placeables,
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
    showPerformanceMonitor,
    showDamageNumbers,
    startPositions,
    goalPositions,
    obstacles,
    setSelectedTowerType,
    setSelectedTower,
    setSelectedItem,
    togglePause,
    cycleGameSpeed,
    toggleAutoAdvance,
    togglePerformanceMonitor,
    toggleDamageNumbers,
    getSaveableState,
    loadSavedState,
    pendingPowerUpSelection,
    setPendingPowerUpSelection,
    removeExpiredWavePowerUps,
    addWavePowerUp,
    activeWavePowerUps,
  } = useGameStore();

  // Persistence
  const { saveGame, loadGame, clearSavedGame } = useGameStatePersistence();
  const hasLoadedSavedState = useRef(false);

  // Memoize config to prevent re-initialization
  // Only re-initialize when map or runUpgrade changes, not when progress changes mid-game
  const gameConfig = useMemo(
    () => ({
      mapId,
      progress,
      runUpgrade,
    }),
    [mapId, runUpgrade, progress],
  );

  // Initialize game engine
  const { engine, startWave, resetGame } = useGameEngine(gameConfig);

  // Apply initial power-up when game starts (not when resuming)
  const hasAppliedInitialPowerUp = useRef(false);
  useEffect(() => {
    if (
      initialPowerUp &&
      !isResuming &&
      gameStatus === 'playing' &&
      !hasAppliedInitialPowerUp.current &&
      grid.length > 0
    ) {
      // Add the initial power-up to active power-ups
      addWavePowerUp(initialPowerUp);
      hasAppliedInitialPowerUp.current = true;
    }
  }, [initialPowerUp, isResuming, gameStatus, addWavePowerUp, grid.length]);

  // Reset flag when map changes
  useEffect(() => {
    hasAppliedInitialPowerUp.current = false;
  }, []);

  // Game controls
  const { handleCellClick, upgradeTower, deleteTower } = useGameControls();

  const closeDetailPanels = () => {
    setSelectedTower(null);
    setSelectedItem(null);
  };
  const hasDetailSelection = Boolean(selectedTower || selectedItem);

  // Setup stress test for performance testing (dev only)
  useEffect(() => {
    if (!engine || process.env.NODE_ENV !== 'development') return;

    const cleanup = setupStressTest(() => engine.getParticlePool());
    return cleanup;
  }, [engine]);

  // Reset rating tracking when starting a new game (mapId changes)
  useEffect(() => {
    if (!isResuming) {
      initialLivesRef.current = null;
      hasRecordedRatingRef.current = false;
    }
  }, [isResuming]);

  // Track initial lives when game starts (capture after initialization)
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
        // Don't track initial lives for resumed games - we can't accurately
        // calculate lives lost, so we won't record ratings for resumed games
        hasRecordedRatingRef.current = true; // Prevent rating recording
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

  // Clear saved state when game ends
  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      clearSavedGame();
    }
  }, [gameStatus, clearSavedGame]);

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

  // Update debug paths when towers or blocking placeables change
  useEffect(() => {
    if (grid.length === 0) return;

    const baseBlockedPositions = [
      ...towers.map((t) => t.position),
      ...obstacles,
    ];

    const newPaths = findPathsForMultipleStartsAndGoals(
      startPositions,
      goalPositions,
      baseBlockedPositions,
      grid.length,
      placeables,
    ).filter((path): path is Position[] => path !== null);

    setDebugPaths(newPaths);
    setAnimatedPathLengths(newPaths.map(() => newPaths[0]?.length || 0));
  }, [grid, towers, obstacles, placeables, startPositions, goalPositions]);

  // Detect wave completion and trigger power-up selection
  useEffect(() => {
    const wasWaveActive = prevIsWaveActiveRef.current;
    const isWaveComplete =
      wasWaveActive && !isWaveActive && wave > 0 && wave < MAX_WAVES;

    prevIsWaveActiveRef.current = isWaveActive;

    if (isWaveComplete && gameStatus === 'playing') {
      // Remove expired power-ups first
      removeExpiredWavePowerUps();
      // Generate random power-ups for selection
      const randomPowerUps = selectRandomPowerUps(3);
      setAvailablePowerUps(randomPowerUps);
      // Trigger power-up selection
      setPendingPowerUpSelection(true);
    }
  }, [
    isWaveActive,
    wave,
    gameStatus,
    removeExpiredWavePowerUps,
    setPendingPowerUpSelection,
  ]);

  const handlePowerUpSelect = (powerUp: WavePowerUp) => {
    addWavePowerUp(powerUp);
    setPendingPowerUpSelection(false);
    setAvailablePowerUps([]);
  };

  // Auto-advance to next wave (only if not waiting for power-up selection)
  useEffect(() => {
    if (
      autoAdvance &&
      !isWaveActive &&
      !pendingPowerUpSelection &&
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
    pendingPowerUpSelection,
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
    <div className="min-h-dvh bg-black flex flex-col p-2 sm:p-6 lg:p-8 font-mono overflow-hidden relative">
      {/* Background grid */}
      <div
        className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${showGrid ? 'opacity-100' : 'opacity-0'}`}
        style={{
          animation: showGrid ? 'grid-sweep 1.2s ease-out forwards' : 'none',
        }}
      >
        <svg aria-hidden="true" className="w-full h-full">
          <title>Background Grid</title>
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
          <div className="flex items-center gap-2">
            <GameStats
              combo={combo}
              lives={lives}
              maxWaves={MAX_WAVES}
              money={money}
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
              placeables={placeables}
              powerups={powerups}
              projectiles={projectiles}
              selectedTower={selectedTower}
              showDamageNumbers={showDamageNumbers}
              startPositions={startPositions}
              touchFeedback={null}
              towers={towers}
            />
          </div>
        </div>

        <div
          className={`transition-all duration-700 mb-2 ${showUI ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '500ms' }}
        >
          <div
            className={
              hasDetailSelection ? 'invisible pointer-events-none' : ''
            }
          >
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
          </div>
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

      <Drawer
        direction="bottom"
        onOpenChange={(open) => {
          if (!open) {
            closeDetailPanels();
          }
        }}
        open={hasDetailSelection}
      >
        <DrawerContent className="border-t border-cyan-500/30 bg-black/95 text-white shadow-[0_0_45px_rgba(34,211,238,0.35)] backdrop-blur-lg [&>div:first-child]:hidden">
          <div className="mx-auto w-full max-w-md">
            {selectedTower ? (
              <TowerManagement
                money={money}
                onClose={closeDetailPanels}
                onDelete={deleteTower}
                onUpgrade={upgradeTower}
                tower={selectedTower}
              />
            ) : selectedItem ? (
              <ItemDetails item={selectedItem} onClose={closeDetailPanels} />
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>

      {showSettings && (
        <SettingsMenu
          onClose={() => setShowSettings(false)}
          onQuit={() => onQuit?.()}
          onRestart={resetGame}
          onToggleDamageNumbers={toggleDamageNumbers}
          onTogglePerformanceMonitor={togglePerformanceMonitor}
          showDamageNumbers={showDamageNumbers}
          showPerformanceMonitor={showPerformanceMonitor}
        />
      )}

      {pendingPowerUpSelection && availablePowerUps.length > 0 && (
        <PowerUpSelector
          onSelect={handlePowerUpSelect}
          powerUps={availablePowerUps}
        />
      )}

      {showActivePowerUps && (
        <ActivePowerUpsDisplay
          activePowerUps={activeWavePowerUps}
          onClose={() => setShowActivePowerUps(false)}
        />
      )}

      <PerformanceMonitor
        isEnabled={showPerformanceMonitor}
        particleCount={particles.length}
      />
    </div>
  );
}
