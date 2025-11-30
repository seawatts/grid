'use client';

import { Drawer, DrawerContent } from '@seawatts/ui/drawer';
import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import ActivePowerUpsDisplay from '~/components/tower-defense/active-powerups-display';
import GameBackground from '~/components/tower-defense/game-background';
import GameBoard from '~/components/tower-defense/game-board';
import GameFooter from '~/components/tower-defense/game-footer';
import GameHeader from '~/components/tower-defense/game-header';
import ItemDetails from '~/components/tower-defense/item-details';
import PerformanceMonitor from '~/components/tower-defense/performance-monitor';
import PowerUpSelector from '~/components/tower-defense/power-up-selector';
import SettingsMenu from '~/components/tower-defense/settings-menu';
import TowerManagement from '~/components/tower-defense/tower-management';
import WaveInfoDrawer from '~/components/tower-defense/wave-info-drawer';
import type {
  PlayerProgress,
  RunUpgrade,
  WavePowerUp,
} from '~/lib/tower-defense/game-types';
import { useDebugPaths } from '~/lib/tower-defense/hooks/use-debug-paths';
import { useGameControls } from '~/lib/tower-defense/hooks/use-game-controls';
import { useGameEngine } from '~/lib/tower-defense/hooks/use-game-engine';
import { useGameLifecycle } from '~/lib/tower-defense/hooks/use-game-lifecycle';
import { useResponsiveLayout } from '~/lib/tower-defense/hooks/use-responsive-layout';
import {
  selectGameEntities,
  selectGameStats,
  selectMapInfo,
  selectPowerUpState,
  selectUIActions,
  selectUIState,
  useGameStore,
} from '~/lib/tower-defense/store/game-store';
import { setupStressTest } from '~/lib/tower-defense/utils/stress-test';

interface TowerDefenseGameProps {
  mapId: string;
  initialPowerUp?: WavePowerUp;
  runUpgrade?: RunUpgrade;
  isEntering?: boolean;
  isResuming?: boolean;
  onQuit?: () => void;
  progress: PlayerProgress;
  onEarnTP: (amount: number) => void;
  onAddEnergy?: (amount: number) => void;
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
  onAddEnergy,
  onRecordMapRating,
}: TowerDefenseGameProps) {
  // Memoize config to prevent re-initialization
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

  // Custom hooks
  useResponsiveLayout();
  useDebugPaths();
  const { handlePowerUpSelect } = useGameLifecycle({
    initialPowerUp,
    isResuming,
    mapId,
    onAddEnergy,
    onRecordMapRating,
  });

  // Game controls
  const { handleCellClick, upgradeTower, deleteTower } = useGameControls();

  // Zustand selectors - grouped for better performance
  // Using useShallow to prevent infinite loops when selectors return new objects
  const gameEntities = useGameStore(useShallow(selectGameEntities));
  const uiState = useGameStore(useShallow(selectUIState));
  const gameStats = useGameStore(useShallow(selectGameStats));
  const mapInfo = useGameStore(useShallow(selectMapInfo));
  const powerUpState = useGameStore(useShallow(selectPowerUpState));
  const uiActions = useGameStore(useShallow(selectUIActions));

  // Destructure for easier access
  const {
    towers,
    spawnedEnemies,
    unspawnedEnemies,
    projectiles,
    particles,
    damageNumbers,
    placeables,
  } = gameEntities;
  const {
    cellSize,
    isMobile,
    showGrid,
    showSettings,
    showActivePowerUps,
    showWaveInfo,
    wasPausedBeforeWaveInfo,
    showPerformanceMonitor,
    showDamageNumbers,
    selectedTower,
    selectedItem,
    debugPaths,
    animatedPathLengths,
  } = uiState;
  const { wave, gameStatus, isPaused, isWaveActive, autoAdvance, maxWaves } =
    gameStats;
  const { grid, startPositions, goalPositions } = mapInfo;
  const { activeWavePowerUps, availablePowerUps, pendingPowerUpSelection } =
    powerUpState;
  const {
    setShowSettings,
    setShowActivePowerUps,
    setShowWaveInfo,
    setWasPausedBeforeWaveInfo,
    setShowGrid,
    setShowUI,
    setSelectedTower,
    setSelectedItem,
    togglePause,
    togglePerformanceMonitor,
    toggleDamageNumbers,
  } = uiActions;

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
  }, [isEntering, setShowGrid, setShowUI]);

  // Auto-advance to next wave (only if not waiting for power-up selection)
  useEffect(() => {
    if (
      autoAdvance &&
      !isWaveActive &&
      !pendingPowerUpSelection &&
      wave > 0 &&
      wave < maxWaves &&
      spawnedEnemies.length === 0 &&
      unspawnedEnemies.length === 0 &&
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
    unspawnedEnemies.length,
    gameStatus,
    startWave,
    maxWaves,
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
      <GameBackground />

      <div className="flex-1 flex flex-col max-w-[100vw] sm:max-w-4xl mx-auto w-full relative z-10 px-1 sm:px-0 pt-2 sm:pt-6">
        <GameHeader
          onOpenSettings={() => setShowSettings(true)}
          onStartWave={startWave}
          onWaveClick={() => {
            setWasPausedBeforeWaveInfo(isPaused);
            if (!isPaused) {
              togglePause();
            }
            setShowWaveInfo(true);
          }}
        />

        <div
          className={`flex-1 flex transition-all duration-1000 min-h-0 ${showGrid ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          style={{ transitionDelay: '100ms' }}
        >
          <div className="relative w-full flex items-center justify-center">
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
              maxWaves={maxWaves}
              onCellClick={handleCellClick}
              particles={particles}
              placeables={placeables}
              projectiles={projectiles}
              selectedTower={selectedTower}
              showDamageNumbers={showDamageNumbers}
              startPositions={startPositions}
              touchFeedback={null}
              towers={towers}
            />
          </div>
        </div>

        <GameFooter />
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
                money={useGameStore.getState().money}
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

      {showWaveInfo && (
        <WaveInfoDrawer
          gameState={useGameStore.getState()}
          onClose={() => {
            setShowWaveInfo(false);
            if (!wasPausedBeforeWaveInfo && isPaused) {
              togglePause();
            }
          }}
        />
      )}

      <PerformanceMonitor
        isEnabled={showPerformanceMonitor}
        particleCount={particles.length}
      />
    </div>
  );
}
