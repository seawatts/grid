import { create } from 'zustand';
import {
  calculateOptimalGridDimensions,
  MAX_WAVES,
  START_LIVES,
  START_MONEY,
  TOWER_STATS,
} from '../constants/balance';
import { itemBlocksPath } from '../constants/placeables';
import {
  createDefaultProgress,
  withProgressDefaults,
} from '../constants/progress';
import { GRID_SIZE } from '../game-constants';
import { adaptMapPositions, getMapById } from '../game-maps';
import type {
  ItemCategory,
  PlaceableItem,
  Position,
  PowerupType,
  Tower,
  TowerType,
  TrapType,
  WavePowerUp,
} from '../game-types';
import type { SavedGameState } from '../hooks/use-game-state-persistence';
import { findPathsForMultipleStartsAndGoals } from '../pathfinding';
import type { GameConfig, GameState } from './types';

// Entity types for counter management
export type EntityType =
  | 'tower'
  | 'enemy'
  | 'projectile'
  | 'particle'
  | 'damageNumber'
  | 'placeable';

const ENTITY_COUNTER_MAP: Record<EntityType, keyof GameState> = {
  damageNumber: 'damageNumberIdCounter',
  enemy: 'enemyIdCounter',
  particle: 'particleIdCounter',
  placeable: 'placeableIdCounter',
  projectile: 'projectileIdCounter',
  tower: 'towerIdCounter',
} as const;

const createInitialState = (): GameState => ({
  activeWavePowerUps: [],
  animatedPathLengths: [],
  autoAdvance: false,
  availablePowerUps: [],
  cellSize: 28,
  combo: 0,
  damageNumberIdCounter: 0,
  damageNumbers: [],
  debugPaths: [],
  enemyIdCounter: 0,
  gameSpeed: 1,
  gameStatus: 'playing',
  goalPositions: [],
  grid: [],
  gridHeight: 12, // Default rows
  gridWidth: 12, // Default columns
  isMobile: true,
  isPaused: false,
  isWaveActive: false,
  lastKillTime: 0,
  lives: START_LIVES,
  maxWaves: MAX_WAVES,
  money: START_MONEY,
  obstacles: [],
  particleIdCounter: 0,
  particles: [],
  pendingPowerUpSelection: false,
  placeableIdCounter: 0,
  placeables: [],
  progress: createDefaultProgress(),
  projectileIdCounter: 0,
  projectiles: [],
  score: 0,
  selectedItem: null,
  selectedTower: null,
  selectedTowerType: null,
  showActivePowerUps: false,
  showDamageNumbers: true,
  showGrid: false,
  showPerformanceMonitor: false,
  showSettings: false,
  showUI: false,
  showWaveInfo: false,
  spawnedEnemies: [],
  startPositions: [],
  towerIdCounter: 0,
  towers: [],
  unspawnedEnemies: [],
  wasPausedBeforeWaveInfo: false,
  wave: 0,
});

interface GameStore extends GameState {
  // Actions
  initializeGame: (config: GameConfig) => void;
  resetGame: () => void;

  // Tower actions
  setSelectedTowerType: (type: TowerType | null) => void;
  setSelectedTower: (tower: Tower | null) => void;
  addTower: (tower: Tower) => void;
  updateTowers: (towers: Tower[]) => void;
  removeTower: (towerId: number) => void;
  upgradeTower: (towerId: number) => void;

  // Enemy actions
  updateSpawnedEnemies: (enemies: GameState['spawnedEnemies']) => void;
  updateUnspawnedEnemies: (enemies: GameState['unspawnedEnemies']) => void;

  // Projectile actions
  updateProjectiles: (projectiles: GameState['projectiles']) => void;

  // Visual effects actions
  updateParticles: (particles: GameState['particles']) => void;
  updateDamageNumbers: (damageNumbers: GameState['damageNumbers']) => void;

  // Items actions
  setSelectedItem: (item: PlaceableItem | null) => void;
  updatePlaceables: (placeables: PlaceableItem[]) => void;
  getPlaceablesByCategory: (category: ItemCategory) => PlaceableItem[];
  getPlaceablesByType: (type: TrapType | PowerupType) => PlaceableItem[];
  getPlaceablesAtPosition: (pos: Position) => PlaceableItem[];
  getBlockingPlaceables: () => PlaceableItem[];

  // Game state actions
  setMoney: (money: number) => void;
  addMoney: (amount: number) => void;
  setLives: (lives: number) => void;
  setScore: (score: number) => void;
  addScore: (amount: number) => void;
  setCombo: (combo: number) => void;
  setWave: (wave: number) => void;
  setIsWaveActive: (active: boolean) => void;
  setGameStatus: (status: GameState['gameStatus']) => void;
  setIsPaused: (paused: boolean) => void;
  togglePause: () => void;
  setGameSpeed: (speed: GameState['gameSpeed']) => void;
  cycleGameSpeed: () => void;
  setAutoAdvance: (auto: boolean) => void;
  toggleAutoAdvance: () => void;
  setShowGrid: (show: boolean) => void;
  togglePerformanceMonitor: () => void;
  toggleDamageNumbers: () => void;

  // UI state actions
  setCellSize: (size: number) => void;
  setIsMobile: (isMobile: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowUI: (show: boolean) => void;
  setShowActivePowerUps: (show: boolean) => void;
  setShowWaveInfo: (show: boolean) => void;
  setWasPausedBeforeWaveInfo: (wasPaused: boolean) => void;
  setDebugPaths: (paths: Position[][]) => void;
  setAnimatedPathLengths: (lengths: number[]) => void;
  setAvailablePowerUps: (powerUps: WavePowerUp[]) => void;

  // Counter actions
  getNextId: (entityType: EntityType) => number;
  // Legacy individual methods (kept for backward compatibility, use getNextId instead)
  getNextTowerId: () => number;
  getNextEnemyId: () => number;
  getNextProjectileId: () => number;
  getNextParticleId: () => number;
  getNextDamageNumberId: () => number;
  getNextPlaceableId: () => number;
  setProjectileIdCounter: (counter: number) => void;
  setDamageNumberIdCounter: (counter: number) => void;
  setParticleIdCounter: (counter: number) => void;
  setEnemyIdCounter: (counter: number) => void;
  setPlaceableIdCounter: (counter: number) => void;

  // Computed values
  getAdjacentTowers: (position: Position) => Tower[];
  canAffordTower: (type: TowerType) => boolean;
  canAffordUpgrade: (tower: Tower) => boolean;

  // Timing
  updateLastKillTime: (time: number) => void;

  // Wave power-up actions
  addWavePowerUp: (powerUp: WavePowerUp) => void;
  removeExpiredWavePowerUps: () => void;
  removeWavePowerUp: (powerUpId: string) => void;
  setPendingPowerUpSelection: (pending: boolean) => void;

  // Persistence actions
  getSaveableState: () => Partial<SavedGameState>;
  loadSavedState: (savedState: SavedGameState, mapId: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),
  addMoney: (amount) => set((state) => ({ money: state.money + amount })),
  addScore: (amount) => set((state) => ({ score: state.score + amount })),

  addTower: (tower) =>
    set((state) => {
      const newGrid = state.grid.map((row) => [...row]);
      const row = newGrid[tower.position.y];
      if (row) {
        row[tower.position.x] = 'tower';
      }
      const nextTowers = [...state.towers, tower];
      return {
        grid: newGrid,
        money: state.money - TOWER_STATS[tower.type].cost,
        towers: nextTowers,
      };
    }),

  // Wave power-up actions
  addWavePowerUp: (powerUp) =>
    set((state) => {
      // Apply immediate effects
      let newMoney = state.money;
      let newLives = state.lives;

      if (powerUp.effect.type === 'addMoney') {
        newMoney += powerUp.effect.value;
      } else if (powerUp.effect.type === 'addLives') {
        newLives += powerUp.effect.value;
      }

      // Initialize wavesRemaining for non-permanent power-ups
      const powerUpWithDuration: WavePowerUp = {
        ...powerUp,
        wavesRemaining:
          powerUp.duration === 'permanent' ? undefined : powerUp.duration,
      };

      return {
        activeWavePowerUps: [...state.activeWavePowerUps, powerUpWithDuration],
        lives: newLives,
        money: newMoney,
      };
    }),

  canAffordTower: (type) => {
    const state = get();
    return state.money >= TOWER_STATS[type].cost;
  },

  canAffordUpgrade: (tower) => {
    const state = get();
    return state.money >= TOWER_STATS[tower.type].upgradeCost;
  },
  cycleGameSpeed: () =>
    set((state) => ({
      gameSpeed: (state.gameSpeed === 1 ? 2 : state.gameSpeed === 2 ? 4 : 1) as
        | 1
        | 2
        | 4,
    })),

  // Computed values
  getAdjacentTowers: (position) => {
    const state = get();
    const adjacentPositions = [
      { x: position.x, y: position.y - 1 },
      { x: position.x, y: position.y + 1 },
      { x: position.x - 1, y: position.y },
      { x: position.x + 1, y: position.y },
    ];

    return state.towers.filter((t) =>
      adjacentPositions.some(
        (pos) => pos.x === t.position.x && pos.y === t.position.y,
      ),
    );
  },

  getBlockingPlaceables: () => {
    const state = get();
    return state.placeables.filter((item) => itemBlocksPath(item));
  },

  // Legacy individual methods (kept for backward compatibility)
  getNextDamageNumberId: () => {
    return get().getNextId('damageNumber');
  },

  getNextEnemyId: () => {
    return get().getNextId('enemy');
  },

  // Generic counter manager
  getNextId: (entityType: EntityType) => {
    const counterKey = ENTITY_COUNTER_MAP[entityType];
    const state = get();
    const id = state[counterKey] as number;
    set((prevState) => ({
      ...prevState,
      [counterKey]: (prevState[counterKey] as number) + 1,
    }));
    return id;
  },

  getNextParticleId: () => {
    return get().getNextId('particle');
  },

  getNextPlaceableId: () => {
    return get().getNextId('placeable');
  },

  getNextProjectileId: () => {
    return get().getNextId('projectile');
  },

  getNextTowerId: () => {
    return get().getNextId('tower');
  },

  getPlaceablesAtPosition: (pos) => {
    const state = get();
    return state.placeables.filter((item) =>
      item.positions.some(
        (p) =>
          Math.floor(p.x) === Math.floor(pos.x) &&
          Math.floor(p.y) === Math.floor(pos.y),
      ),
    );
  },

  getPlaceablesByCategory: (category) => {
    const state = get();
    return state.placeables.filter((item) => item.category === category);
  },

  getPlaceablesByType: (type) => {
    const state = get();
    return state.placeables.filter((item) => item.type === type);
  },

  // Persistence actions
  getSaveableState: () => {
    const state = get();
    return {
      activeWavePowerUps: state.activeWavePowerUps,
      autoAdvance: state.autoAdvance,
      damageNumberIdCounter: state.damageNumberIdCounter,
      enemyIdCounter: state.enemyIdCounter,
      gameSpeed: state.gameSpeed,
      gameStatus: state.gameStatus,
      goalPositions: state.goalPositions,
      grid: state.grid,
      isPaused: state.isPaused,
      isWaveActive: state.isWaveActive,
      lives: state.lives,
      money: state.money,
      obstacles: state.obstacles,
      particleIdCounter: state.particleIdCounter,
      placeableIdCounter: state.placeableIdCounter,
      placeables: state.placeables,
      progress: state.progress,
      projectileIdCounter: state.projectileIdCounter,
      runUpgrade: state.runUpgrade,
      score: state.score,
      startPositions: state.startPositions,
      towerIdCounter: state.towerIdCounter,
      towers: state.towers,
      unspawnedEnemies: state.unspawnedEnemies,
      wave: state.wave,
    };
  },

  initializeGame: (config: GameConfig) => {
    const { mapId, runUpgrade, progress } = config;
    const effectiveProgress = withProgressDefaults(progress);
    const selectedMap = getMapById(mapId);

    // Calculate optimal grid dimensions based on available screen space
    // Use window dimensions if available, otherwise use defaults
    let gridWidth = 12;
    let gridHeight = 12;

    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const headerHeight = width < 640 ? 100 : 120;
      const footerHeight = width < 640 ? 140 : 160;
      const padding = 32;

      const availableHeight = height - headerHeight - footerHeight - padding;
      const availableWidth = Math.min(width - padding, 896);

      const dimensions = calculateOptimalGridDimensions(
        availableWidth,
        availableHeight,
      );
      gridWidth = dimensions.columns;
      gridHeight = dimensions.rows;
    }

    const newGrid = Array(gridHeight)
      .fill(null)
      .map(() => Array(gridWidth).fill('empty'));

    // Use preferred grid size from map if available, otherwise use GRID_SIZE (12) as original
    const originalGridWidth =
      selectedMap.preferredGridSize?.columns ?? GRID_SIZE;
    const originalGridHeight = selectedMap.preferredGridSize?.rows ?? GRID_SIZE;

    // Adapt map positions if grid is different from original
    const adaptedStarts = adaptMapPositions(
      selectedMap.starts,
      originalGridWidth,
      originalGridHeight,
      gridWidth,
      gridHeight,
    );
    const adaptedGoals = adaptMapPositions(
      selectedMap.goals,
      originalGridWidth,
      originalGridHeight,
      gridWidth,
      gridHeight,
    );
    const adaptedObstacles = adaptMapPositions(
      selectedMap.obstacles,
      originalGridWidth,
      originalGridHeight,
      gridWidth,
      gridHeight,
    );

    adaptedStarts.forEach((pos) => {
      if (pos.x >= 0 && pos.x < gridWidth && pos.y >= 0 && pos.y < gridHeight) {
        const row = newGrid[pos.y];
        if (row) row[pos.x] = 'start';
      }
    });

    adaptedGoals.forEach((pos) => {
      if (pos.x >= 0 && pos.x < gridWidth && pos.y >= 0 && pos.y < gridHeight) {
        const row = newGrid[pos.y];
        if (row) row[pos.x] = 'goal';
      }
    });

    adaptedObstacles.forEach((obstacle) => {
      if (
        obstacle.x >= 0 &&
        obstacle.x < gridWidth &&
        obstacle.y >= 0 &&
        obstacle.y < gridHeight
      ) {
        const isStart = adaptedStarts.some(
          (s) => s.x === obstacle.x && s.y === obstacle.y,
        );
        const isGoal = adaptedGoals.some(
          (g) => g.x === obstacle.x && g.y === obstacle.y,
        );

        if (!isStart && !isGoal) {
          const row = newGrid[obstacle.y];
          if (row) row[obstacle.x] = 'obstacle';
        }
      }
    });

    // Validate that paths exist from all start positions to goal positions
    // This catches map configuration issues where obstacles block all paths
    const initialPaths = findPathsForMultipleStartsAndGoals(
      adaptedStarts,
      adaptedGoals,
      adaptedObstacles,
      gridWidth,
      gridHeight,
    );

    if (initialPaths.some((p) => !p)) {
      const blockedStartIndices = initialPaths
        .map((path, idx) => (path === null ? idx : -1))
        .filter((idx) => idx !== -1);
      console.error(
        'Map configuration error: Some spawn points are blocked by map obstacles after grid adaptation.',
        {
          adaptedGoals,
          adaptedObstacles,
          adaptedStarts,
          blockedStartIndices,
          gridHeight,
          gridWidth,
          mapId,
        },
      );
      // Still set the state, but the error will be caught when trying to start a wave
      // This allows the UI to load and show the problematic map
    }

    const initialMoney =
      START_MONEY +
      (runUpgrade?.effect.type === 'startMoney' ? runUpgrade.effect.value : 0);
    const initialLives =
      START_LIVES +
      (runUpgrade?.effect.type === 'startLives' ? runUpgrade.effect.value : 0);

    set({
      activeWavePowerUps: [],
      animatedPathLengths: [],
      autoAdvance: false,
      availablePowerUps: [],
      cellSize: 28,
      combo: 0,
      damageNumberIdCounter: 0,
      damageNumbers: [],
      debugPaths: [],
      enemyIdCounter: 0,
      gameSpeed: 1,
      gameStatus: 'playing',
      goalPositions: adaptedGoals,
      grid: newGrid,
      gridHeight,
      gridWidth,
      isMobile: true,
      isPaused: false,
      isWaveActive: false,
      lastKillTime: 0,
      lives: initialLives,
      maxWaves: selectedMap.maxWaves,
      money: initialMoney,
      obstacles: adaptedObstacles,
      particleIdCounter: 0,
      particles: [],
      pendingPowerUpSelection: false,
      placeableIdCounter: 0,
      placeables: [],
      progress: effectiveProgress,
      projectileIdCounter: 0,
      projectiles: [],
      runUpgrade,
      score: 0,
      selectedItem: null,
      selectedTower: null,
      selectedTowerType: null,
      showActivePowerUps: false,
      showDamageNumbers: true,
      showGrid: false,
      showPerformanceMonitor: false,
      showSettings: false,
      showUI: false,
      showWaveInfo: false,
      spawnedEnemies: [],
      startPositions: adaptedStarts,
      towerIdCounter: 0,
      towers: [],
      unspawnedEnemies: [],
      wasPausedBeforeWaveInfo: false,
      wave: 0,
    });
  },

  loadSavedState: (savedState: SavedGameState, mapId: string) => {
    // Ensure activeWavePowerUps have rarity (default to 'common' for backward compatibility)
    const activeWavePowerUps = (savedState.activeWavePowerUps ?? []).map(
      (powerup) => ({
        ...powerup,
        rarity: powerup.rarity ?? 'common',
      }),
    );

    // Calculate grid dimensions from saved grid (for backward compatibility)
    const gridHeight = savedState.grid.length;
    const gridWidth = savedState.grid[0]?.length || 12;

    set({
      activeWavePowerUps,
      animatedPathLengths: [],
      autoAdvance: savedState.autoAdvance,
      availablePowerUps: [],
      cellSize: 28,
      combo: 0,
      damageNumberIdCounter: savedState.damageNumberIdCounter,
      damageNumbers: [],
      debugPaths: [],
      enemyIdCounter: savedState.enemyIdCounter,
      gameSpeed: savedState.gameSpeed,
      gameStatus: savedState.gameStatus,
      goalPositions: savedState.goalPositions,
      // Load saved state
      grid: savedState.grid,
      gridHeight,
      gridWidth,
      isMobile: true,
      isPaused: savedState.isPaused,
      isWaveActive: savedState.isWaveActive,
      lastKillTime: 0,
      lives: savedState.lives,
      maxWaves: getMapById(mapId).maxWaves,
      money: savedState.money,
      obstacles: savedState.obstacles,
      particleIdCounter: savedState.particleIdCounter,
      particles: [],
      pendingPowerUpSelection: false,
      placeableIdCounter: savedState.placeableIdCounter ?? 0,
      placeables: savedState.placeables ?? [],
      progress: withProgressDefaults(savedState.progress),
      projectileIdCounter: savedState.projectileIdCounter,
      projectiles: [],
      runUpgrade: savedState.runUpgrade,
      score: savedState.score,
      selectedItem: null,
      selectedTower: null,
      selectedTowerType: null,
      showActivePowerUps: false,
      showGrid: false,
      showPerformanceMonitor: false,
      showSettings: false,
      showUI: false,
      showWaveInfo: false,

      // Reset transient state that doesn't persist
      spawnedEnemies: [],
      startPositions: savedState.startPositions,
      towerIdCounter: savedState.towerIdCounter,
      towers: savedState.towers,
      unspawnedEnemies: savedState.unspawnedEnemies,
      wasPausedBeforeWaveInfo: false,
      wave: savedState.wave,
    });
  },

  removeExpiredWavePowerUps: () =>
    set((state) => {
      const activePowerUps = state.activeWavePowerUps.filter((powerUp) => {
        if (powerUp.duration === 'permanent') {
          return true;
        }
        // Remove if wavesRemaining is 0 or less
        return (powerUp.wavesRemaining ?? 0) > 0;
      });

      // Decrement wavesRemaining for non-permanent power-ups
      const updatedPowerUps = activePowerUps.map((powerUp) => {
        if (powerUp.duration === 'permanent') {
          return powerUp;
        }
        return {
          ...powerUp,
          wavesRemaining: (powerUp.wavesRemaining ?? 0) - 1,
        };
      });

      return {
        activeWavePowerUps: updatedPowerUps,
      };
    }),

  removeTower: (towerId) =>
    set((state) => {
      const tower = state.towers.find((t) => t.id === towerId);
      if (!tower) return state;

      const newGrid = state.grid.map((row) => [...row]);
      const row = newGrid[tower.position.y];
      if (row) row[tower.position.x] = 'empty';

      const nextTowers = state.towers.filter((t) => t.id !== towerId);
      return {
        grid: newGrid,
        towers: nextTowers,
      };
    }),

  removeWavePowerUp: (powerUpId) =>
    set((state) => ({
      activeWavePowerUps: state.activeWavePowerUps.filter(
        (powerUp) => powerUp.id !== powerUpId,
      ),
    })),

  resetGame: () => set(createInitialState()),

  // UI state actions
  setAnimatedPathLengths: (lengths) => set({ animatedPathLengths: lengths }),
  setAutoAdvance: (auto) => set({ autoAdvance: auto }),
  setAvailablePowerUps: (powerUps) => set({ availablePowerUps: powerUps }),
  setCellSize: (size) => set({ cellSize: size }),
  setCombo: (combo) => set({ combo }),
  setDamageNumberIdCounter: (counter) =>
    set({ damageNumberIdCounter: counter }),
  setDebugPaths: (paths) => set({ debugPaths: paths }),
  setEnemyIdCounter: (counter) => set({ enemyIdCounter: counter }),
  setGameSpeed: (speed) => set({ gameSpeed: speed }),
  setGameStatus: (status) => set({ gameStatus: status }),
  setIsMobile: (isMobile) => set({ isMobile }),
  setIsPaused: (paused) => set({ isPaused: paused }),
  setIsWaveActive: (active) => set({ isWaveActive: active }),
  setLives: (lives) => set({ lives }),

  // Game state actions
  setMoney: (money) => set({ money }),
  setParticleIdCounter: (counter) => set({ particleIdCounter: counter }),

  setPendingPowerUpSelection: (pending) =>
    set({ pendingPowerUpSelection: pending }),
  setPlaceableIdCounter: (counter) => set({ placeableIdCounter: counter }),

  setProjectileIdCounter: (counter) => set({ projectileIdCounter: counter }),
  setScore: (score) => set({ score }),

  // Items actions
  setSelectedItem: (item) => set({ selectedItem: item }),
  setSelectedTower: (tower) => set({ selectedTower: tower }),

  // Tower actions
  setSelectedTowerType: (type) => set({ selectedTowerType: type }),
  setShowActivePowerUps: (show) => set({ showActivePowerUps: show }),
  setShowGrid: (show) => set({ showGrid: show }),
  setShowSettings: (show) => set({ showSettings: show }),
  setShowUI: (show) => set({ showUI: show }),
  setShowWaveInfo: (show) => set({ showWaveInfo: show }),
  setWasPausedBeforeWaveInfo: (wasPaused) =>
    set({ wasPausedBeforeWaveInfo: wasPaused }),

  setWave: (wave) => set({ wave }),
  toggleAutoAdvance: () =>
    set((state) => ({ autoAdvance: !state.autoAdvance })),
  toggleDamageNumbers: () =>
    set((state) => ({ showDamageNumbers: !state.showDamageNumbers })),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  togglePerformanceMonitor: () =>
    set((state) => ({ showPerformanceMonitor: !state.showPerformanceMonitor })),
  updateDamageNumbers: (damageNumbers) => set({ damageNumbers }),

  // Timing
  updateLastKillTime: (time) => set({ lastKillTime: time }),

  // Visual effects actions
  updateParticles: (particles) => set({ particles }),
  updatePlaceables: (placeables) => set({ placeables }),

  // Projectile actions
  updateProjectiles: (projectiles) => set({ projectiles }),

  // Enemy actions
  updateSpawnedEnemies: (enemies) => set({ spawnedEnemies: enemies }),

  updateTowers: (towers) => set({ towers }),
  updateUnspawnedEnemies: (enemies) => set({ unspawnedEnemies: enemies }),

  upgradeTower: (towerId) =>
    set((state) => {
      const tower = state.towers.find((t) => t.id === towerId);
      if (!tower) return state;

      const upgradeCost = TOWER_STATS[tower.type].upgradeCost;
      if (state.money < upgradeCost) return state;

      return {
        money: state.money - upgradeCost,
        selectedTower: null,
        towers: state.towers.map((t) =>
          t.id === towerId ? { ...t, level: t.level + 1 } : t,
        ),
      };
    }),
}));

// Grouped selectors for better performance and organization
export const selectGameEntities = (state: GameStore) => ({
  damageNumbers: state.damageNumbers,
  particles: state.particles,
  placeables: state.placeables,
  projectiles: state.projectiles,
  spawnedEnemies: state.spawnedEnemies,
  towers: state.towers,
  unspawnedEnemies: state.unspawnedEnemies,
});

export const selectUIState = (state: GameStore) => ({
  animatedPathLengths: state.animatedPathLengths,
  cellSize: state.cellSize,
  debugPaths: state.debugPaths,
  isMobile: state.isMobile,
  selectedItem: state.selectedItem,
  selectedTower: state.selectedTower,
  selectedTowerType: state.selectedTowerType,
  showActivePowerUps: state.showActivePowerUps,
  showDamageNumbers: state.showDamageNumbers,
  showGrid: state.showGrid,
  showPerformanceMonitor: state.showPerformanceMonitor,
  showSettings: state.showSettings,
  showUI: state.showUI,
  showWaveInfo: state.showWaveInfo,
  wasPausedBeforeWaveInfo: state.wasPausedBeforeWaveInfo,
});

export const selectGameStats = (state: GameStore) => ({
  autoAdvance: state.autoAdvance,
  combo: state.combo,
  gameSpeed: state.gameSpeed,
  gameStatus: state.gameStatus,
  isPaused: state.isPaused,
  isWaveActive: state.isWaveActive,
  lives: state.lives,
  maxWaves: state.maxWaves,
  money: state.money,
  score: state.score,
  wave: state.wave,
});

export const selectMapInfo = (state: GameStore) => ({
  goalPositions: state.goalPositions,
  grid: state.grid,
  obstacles: state.obstacles,
  startPositions: state.startPositions,
});

export const selectPowerUpState = (state: GameStore) => ({
  activeWavePowerUps: state.activeWavePowerUps,
  availablePowerUps: state.availablePowerUps,
  pendingPowerUpSelection: state.pendingPowerUpSelection,
});

export const selectUIActions = (state: GameStore) => ({
  setSelectedItem: state.setSelectedItem,
  setSelectedTower: state.setSelectedTower,
  setShowActivePowerUps: state.setShowActivePowerUps,
  setShowGrid: state.setShowGrid,
  setShowSettings: state.setShowSettings,
  setShowUI: state.setShowUI,
  setShowWaveInfo: state.setShowWaveInfo,
  setWasPausedBeforeWaveInfo: state.setWasPausedBeforeWaveInfo,
  toggleDamageNumbers: state.toggleDamageNumbers,
  togglePause: state.togglePause,
  togglePerformanceMonitor: state.togglePerformanceMonitor,
});
