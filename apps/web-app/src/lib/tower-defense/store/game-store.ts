import { create } from 'zustand';
import {
  GRID_SIZE,
  START_LIVES,
  START_MONEY,
  TOWER_STATS,
} from '../constants/balance';
import { itemBlocksPath } from '../constants/placeables';
import {
  createDefaultProgress,
  withProgressDefaults,
} from '../constants/progress';
import { getMapById } from '../game-maps';
import type {
  ItemCategory,
  Landmine,
  PlaceableItem,
  Position,
  PowerUp,
  PowerupType,
  Tower,
  TowerType,
  TrapType,
  WavePowerUp,
} from '../game-types';
import type { SavedGameState } from '../hooks/use-game-state-persistence';
import { hasTowerOnPowerup } from '../utils/powerups';
import type { GameConfig, GameState } from './types';

const createInitialState = (): GameState => ({
  activeWavePowerUps: [],
  autoAdvance: false,
  combo: 0,
  damageNumberIdCounter: 0,
  damageNumbers: [],
  enemyIdCounter: 0,
  gameSpeed: 1,
  gameStatus: 'playing',
  goalPositions: [],
  grid: [],
  isPaused: false,
  isWaveActive: false,
  landmineIdCounter: 0,
  landmines: [],
  lastKillTime: 0,
  lives: START_LIVES,
  money: START_MONEY,
  obstacles: [],
  particleIdCounter: 0,
  particles: [],
  pendingPowerUpSelection: false,
  placeableIdCounter: 0,
  placeables: [],
  powerupIdCounter: 0,
  powerups: [],
  progress: createDefaultProgress(),
  projectileIdCounter: 0,
  projectiles: [],
  score: 0,
  selectedItem: null,
  selectedTower: null,
  selectedTowerType: null,
  showDamageNumbers: true,
  showGrid: false,
  showPerformanceMonitor: false,
  spawnedEnemies: [],
  startPositions: [],
  towerIdCounter: 0,
  towers: [],
  unspawnedEnemies: [],
  wave: 0,
});

const bindPowerupsToTowers = (powerups: PowerUp[], towers: Tower[]) =>
  powerups.map((powerup) => ({
    ...powerup,
    isTowerBound: hasTowerOnPowerup(powerup, towers),
  }));

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
  setSelectedItem: (item: PlaceableItem | PowerUp | Landmine | null) => void;
  updatePlaceables: (placeables: PlaceableItem[]) => void;
  getPlaceablesByCategory: (category: ItemCategory) => PlaceableItem[];
  getPlaceablesByType: (type: TrapType | PowerupType) => PlaceableItem[];
  getPlaceablesAtPosition: (pos: Position) => PlaceableItem[];
  getBlockingPlaceables: () => PlaceableItem[];
  getNextPlaceableId: () => number;
  setPlaceableIdCounter: (counter: number) => void;
  // Legacy methods (kept for backward compatibility)
  updatePowerups: (powerups: PowerUp[]) => void;
  updateLandmines: (landmines: Landmine[]) => void;

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

  // Counter actions
  getNextTowerId: () => number;
  getNextEnemyId: () => number;
  getNextProjectileId: () => number;
  getNextParticleId: () => number;
  getNextDamageNumberId: () => number;
  getNextPlaceableId: () => number;
  // Legacy methods (kept for backward compatibility)
  getNextPowerupId: () => number;
  getNextLandmineId: () => number;
  setProjectileIdCounter: (counter: number) => void;
  setDamageNumberIdCounter: (counter: number) => void;
  setParticleIdCounter: (counter: number) => void;
  setEnemyIdCounter: (counter: number) => void;
  setPlaceableIdCounter: (counter: number) => void;
  // Legacy methods (kept for backward compatibility)
  setPowerupIdCounter: (counter: number) => void;
  setLandmineIdCounter: (counter: number) => void;

  // Computed values
  getAdjacentTowers: (position: Position) => Tower[];
  canAffordTower: (type: TowerType) => boolean;
  canAffordUpgrade: (tower: Tower) => boolean;

  // Timing
  updateLastKillTime: (time: number) => void;

  // Wave power-up actions
  addWavePowerUp: (powerUp: WavePowerUp) => void;
  removeExpiredWavePowerUps: () => void;
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
        powerups: bindPowerupsToTowers(state.powerups, nextTowers),
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

  getNextDamageNumberId: () => {
    const id = get().damageNumberIdCounter;
    set((state) => ({
      damageNumberIdCounter: state.damageNumberIdCounter + 1,
    }));
    return id;
  },

  getNextEnemyId: () => {
    const id = get().enemyIdCounter;
    set((state) => ({ enemyIdCounter: state.enemyIdCounter + 1 }));
    return id;
  },

  getNextLandmineId: () => {
    const id = get().landmineIdCounter;
    set((state) => ({ landmineIdCounter: state.landmineIdCounter + 1 }));
    return id;
  },

  getNextParticleId: () => {
    const id = get().particleIdCounter;
    set((state) => ({ particleIdCounter: state.particleIdCounter + 1 }));
    return id;
  },

  getNextPlaceableId: () => {
    const id = get().placeableIdCounter;
    set((state) => ({ placeableIdCounter: state.placeableIdCounter + 1 }));
    return id;
  },

  getNextPowerupId: () => {
    const id = get().powerupIdCounter;
    set((state) => ({ powerupIdCounter: state.powerupIdCounter + 1 }));
    return id;
  },

  getNextProjectileId: () => {
    const id = get().projectileIdCounter;
    set((state) => ({ projectileIdCounter: state.projectileIdCounter + 1 }));
    return id;
  },

  // Counter actions
  getNextTowerId: () => {
    const id = get().towerIdCounter;
    set((state) => ({ towerIdCounter: state.towerIdCounter + 1 }));
    return id;
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
      landmineIdCounter: state.landmineIdCounter,
      landmines: state.landmines,
      lives: state.lives,
      money: state.money,
      obstacles: state.obstacles,
      particleIdCounter: state.particleIdCounter,
      placeableIdCounter: state.placeableIdCounter,
      placeables: state.placeables,
      powerupIdCounter: state.powerupIdCounter,
      powerups: state.powerups,
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

    const newGrid = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill('empty'));

    selectedMap.starts.forEach((pos) => {
      const row = newGrid[pos.y];
      if (row) row[pos.x] = 'start';
    });

    selectedMap.goals.forEach((pos) => {
      const row = newGrid[pos.y];
      if (row) row[pos.x] = 'goal';
    });

    selectedMap.obstacles.forEach((obstacle) => {
      const isStart = selectedMap.starts.some(
        (s) => s.x === obstacle.x && s.y === obstacle.y,
      );
      const isGoal = selectedMap.goals.some(
        (g) => g.x === obstacle.x && g.y === obstacle.y,
      );

      if (!isStart && !isGoal) {
        const row = newGrid[obstacle.y];
        if (row) row[obstacle.x] = 'obstacle';
      }
    });

    const initialMoney =
      START_MONEY +
      (runUpgrade?.effect.type === 'startMoney' ? runUpgrade.effect.value : 0);
    const initialLives =
      START_LIVES +
      (runUpgrade?.effect.type === 'startLives' ? runUpgrade.effect.value : 0);

    set({
      activeWavePowerUps: [],
      autoAdvance: false,
      combo: 0,
      damageNumberIdCounter: 0,
      damageNumbers: [],
      enemyIdCounter: 0,
      gameSpeed: 1,
      gameStatus: 'playing',
      goalPositions: selectedMap.goals,
      grid: newGrid,
      isPaused: false,
      isWaveActive: false,
      landmineIdCounter: 0,
      landmines: [],
      lastKillTime: 0,
      lives: initialLives,
      money: initialMoney,
      obstacles: selectedMap.obstacles,
      particleIdCounter: 0,
      particles: [],
      pendingPowerUpSelection: false,
      placeableIdCounter: 0,
      placeables: [],
      powerupIdCounter: 0,
      powerups: [],
      progress: effectiveProgress,
      projectileIdCounter: 0,
      projectiles: [],
      runUpgrade,
      score: 0,
      selectedItem: null,
      selectedTower: null,
      selectedTowerType: null,
      showDamageNumbers: true,
      showGrid: false,
      showPerformanceMonitor: false,
      spawnedEnemies: [],
      startPositions: selectedMap.starts,
      towerIdCounter: 0,
      towers: [],
      unspawnedEnemies: [],
      wave: 0,
    });
  },

  loadSavedState: (savedState: SavedGameState, _mapId: string) => {
    set({
      activeWavePowerUps: savedState.activeWavePowerUps ?? [],
      autoAdvance: savedState.autoAdvance,
      combo: 0,
      damageNumberIdCounter: savedState.damageNumberIdCounter,
      damageNumbers: [],
      enemyIdCounter: savedState.enemyIdCounter,
      gameSpeed: savedState.gameSpeed,
      gameStatus: savedState.gameStatus,
      goalPositions: savedState.goalPositions,
      // Load saved state
      grid: savedState.grid,
      isPaused: savedState.isPaused,
      isWaveActive: savedState.isWaveActive,
      landmineIdCounter: savedState.landmineIdCounter,
      landmines: savedState.landmines,
      lastKillTime: 0,
      lives: savedState.lives,
      money: savedState.money,
      obstacles: savedState.obstacles,
      particleIdCounter: savedState.particleIdCounter,
      particles: [],
      pendingPowerUpSelection: false,
      placeableIdCounter: savedState.placeableIdCounter ?? 0,
      placeables: savedState.placeables ?? [],
      powerupIdCounter: savedState.powerupIdCounter,
      powerups: bindPowerupsToTowers(savedState.powerups, savedState.towers),
      progress: withProgressDefaults(savedState.progress),
      projectileIdCounter: savedState.projectileIdCounter,
      projectiles: [],
      runUpgrade: savedState.runUpgrade,
      score: savedState.score,
      selectedItem: null,
      selectedTower: null,
      selectedTowerType: null,
      showGrid: false,
      showPerformanceMonitor: false,

      // Reset transient state that doesn't persist
      spawnedEnemies: [],
      startPositions: savedState.startPositions,
      towerIdCounter: savedState.towerIdCounter,
      towers: savedState.towers,
      unspawnedEnemies: savedState.unspawnedEnemies,
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
        powerups: bindPowerupsToTowers(state.powerups, nextTowers),
        towers: nextTowers,
      };
    }),

  resetGame: () => set(createInitialState()),
  setAutoAdvance: (auto) => set({ autoAdvance: auto }),
  setCombo: (combo) => set({ combo }),
  setDamageNumberIdCounter: (counter) =>
    set({ damageNumberIdCounter: counter }),
  setEnemyIdCounter: (counter) => set({ enemyIdCounter: counter }),
  setGameSpeed: (speed) => set({ gameSpeed: speed }),
  setGameStatus: (status) => set({ gameStatus: status }),
  setIsPaused: (paused) => set({ isPaused: paused }),
  setIsWaveActive: (active) => set({ isWaveActive: active }),
  setLandmineIdCounter: (counter) => set({ landmineIdCounter: counter }),
  setLives: (lives) => set({ lives }),

  // Game state actions
  setMoney: (money) => set({ money }),
  setParticleIdCounter: (counter) => set({ particleIdCounter: counter }),

  setPendingPowerUpSelection: (pending) =>
    set({ pendingPowerUpSelection: pending }),
  setPlaceableIdCounter: (counter) => set({ placeableIdCounter: counter }),
  setPowerupIdCounter: (counter) => set({ powerupIdCounter: counter }),

  setProjectileIdCounter: (counter) => set({ projectileIdCounter: counter }),
  setScore: (score) => set({ score }),

  // Items actions
  setSelectedItem: (item) => set({ selectedItem: item }),
  setSelectedTower: (tower) => set({ selectedTower: tower }),

  // Tower actions
  setSelectedTowerType: (type) => set({ selectedTowerType: type }),
  setShowGrid: (show) => set({ showGrid: show }),
  setWave: (wave) => set({ wave }),
  toggleAutoAdvance: () =>
    set((state) => ({ autoAdvance: !state.autoAdvance })),
  toggleDamageNumbers: () =>
    set((state) => ({ showDamageNumbers: !state.showDamageNumbers })),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  togglePerformanceMonitor: () =>
    set((state) => ({ showPerformanceMonitor: !state.showPerformanceMonitor })),
  updateDamageNumbers: (damageNumbers) => set({ damageNumbers }),
  updateLandmines: (landmines) => set({ landmines }),

  // Timing
  updateLastKillTime: (time) => set({ lastKillTime: time }),

  // Visual effects actions
  updateParticles: (particles) => set({ particles }),
  updatePlaceables: (placeables) => set({ placeables }),
  updatePowerups: (powerups) =>
    set((state) => ({
      powerups: bindPowerupsToTowers(powerups, state.towers),
    })),

  // Projectile actions
  updateProjectiles: (projectiles) => set({ projectiles }),

  // Enemy actions
  updateSpawnedEnemies: (enemies) => set({ spawnedEnemies: enemies }),

  updateTowers: (towers) =>
    set((state) => ({
      powerups: bindPowerupsToTowers(state.powerups, towers),
      towers,
    })),
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
