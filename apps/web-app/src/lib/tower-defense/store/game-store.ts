import { create } from 'zustand';
import {
  GRID_SIZE,
  START_LIVES,
  START_MONEY,
  TOWER_STATS,
} from '../constants/balance';
import { getMapById } from '../game-maps';
import type {
  Landmine,
  Position,
  PowerUp,
  Tower,
  TowerType,
} from '../game-types';
import type { GameConfig, GameState } from './types';

const createInitialState = (): GameState => ({
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
  powerupIdCounter: 0,
  powerups: [],
  progress: {
    techPoints: 0,
    upgrades: {
      landmineDamage: 0,
      landmineFrequency: 0,
      powerNodeFrequency: 0,
      powerNodePotency: 0,
    },
  },
  projectileIdCounter: 0,
  projectiles: [],
  score: 0,
  selectedItem: null,
  selectedTower: null,
  selectedTowerType: null,
  showGrid: false,
  showPerformanceMonitor: false,
  spawnedEnemies: [],
  startPositions: [],
  towerIdCounter: 0,
  towers: [],
  unspawnedEnemies: [],
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
  setSelectedItem: (item: PowerUp | Landmine | null) => void;
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

  // Counter actions
  getNextTowerId: () => number;
  getNextEnemyId: () => number;
  getNextProjectileId: () => number;
  getNextParticleId: () => number;
  getNextDamageNumberId: () => number;
  getNextPowerupId: () => number;
  getNextLandmineId: () => number;
  setProjectileIdCounter: (counter: number) => void;
  setDamageNumberIdCounter: (counter: number) => void;
  setParticleIdCounter: (counter: number) => void;

  // Computed values
  getAdjacentTowers: (position: Position) => Tower[];
  canAffordTower: (type: TowerType) => boolean;
  canAffordUpgrade: (tower: Tower) => boolean;

  // Timing
  updateLastKillTime: (time: number) => void;
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
      return {
        grid: newGrid,
        money: state.money - TOWER_STATS[tower.type].cost,
        towers: [...state.towers, tower],
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

  initializeGame: (config: GameConfig) => {
    const { mapId, runUpgrade, progress } = config;
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
      powerupIdCounter: 0,
      powerups: [],
      progress,
      projectileIdCounter: 0,
      projectiles: [],
      runUpgrade,
      score: 0,
      selectedItem: null,
      selectedTower: null,
      selectedTowerType: null,
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

  removeTower: (towerId) =>
    set((state) => {
      const tower = state.towers.find((t) => t.id === towerId);
      if (!tower) return state;

      const newGrid = state.grid.map((row) => [...row]);
      const row = newGrid[tower.position.y];
      if (row) row[tower.position.x] = 'empty';

      return {
        grid: newGrid,
        towers: state.towers.filter((t) => t.id !== towerId),
      };
    }),

  resetGame: () => set(createInitialState()),
  setAutoAdvance: (auto) => set({ autoAdvance: auto }),
  setCombo: (combo) => set({ combo }),
  setDamageNumberIdCounter: (counter) =>
    set({ damageNumberIdCounter: counter }),
  setGameSpeed: (speed) => set({ gameSpeed: speed }),
  setGameStatus: (status) => set({ gameStatus: status }),
  setIsPaused: (paused) => set({ isPaused: paused }),
  setIsWaveActive: (active) => set({ isWaveActive: active }),
  setLives: (lives) => set({ lives }),

  // Game state actions
  setMoney: (money) => set({ money }),
  setParticleIdCounter: (counter) => set({ particleIdCounter: counter }),

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
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  togglePerformanceMonitor: () =>
    set((state) => ({ showPerformanceMonitor: !state.showPerformanceMonitor })),
  updateDamageNumbers: (damageNumbers) => set({ damageNumbers }),
  updateLandmines: (landmines) => set({ landmines }),

  // Timing
  updateLastKillTime: (time) => set({ lastKillTime: time }),

  // Visual effects actions
  updateParticles: (particles) => set({ particles }),
  updatePowerups: (powerups) => set({ powerups }),

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
