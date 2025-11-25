import {
  createDefaultProgress,
  withProgressDefaults,
} from '../constants/progress';
import type { Enemy, PowerUp, Projectile, Tower } from '../game-types';
import type { GameState } from '../store/types';

/**
 * Create a base test game state with sensible defaults
 */
export function createTestState(overrides: Partial<GameState> = {}): GameState {
  const baseState: GameState = {
    autoAdvance: false,
    combo: 0,
    damageNumberIdCounter: 0,
    damageNumbers: [],
    enemyIdCounter: 1,
    gameSpeed: 1,
    gameStatus: 'playing',
    goalPositions: [{ x: 11, y: 6 }],
    grid: Array(12)
      .fill(null)
      .map(() => Array(12).fill('empty')),
    isPaused: false,
    isWaveActive: false,
    landmineIdCounter: 0,
    landmines: [],
    lastKillTime: 0,
    lives: 10,
    money: 500,
    obstacles: [],
    particleIdCounter: 0,
    particles: [],
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
    startPositions: [{ x: 0, y: 6 }],
    towerIdCounter: 0,
    towers: [],
    unspawnedEnemies: [],
    wave: 0,
  };

  const mergedState: GameState = {
    ...baseState,
    ...overrides,
    showDamageNumbers:
      overrides.showDamageNumbers ?? baseState.showDamageNumbers,
  };

  if (overrides.progress) {
    mergedState.progress = withProgressDefaults(overrides.progress);
  }

  return mergedState;
}

/**
 * Create a test enemy with a simple straight path
 */
export function createTestEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    health: 100,
    id: 1,
    maxHealth: 100,
    path: [
      { x: 0, y: 6 },
      { x: 1, y: 6 },
      { x: 2, y: 6 },
      { x: 3, y: 6 },
      { x: 4, y: 6 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
      { x: 7, y: 6 },
      { x: 8, y: 6 },
      { x: 9, y: 6 },
      { x: 10, y: 6 },
      { x: 11, y: 6 },
    ],
    pathIndex: 0,
    position: { x: 0, y: 6 },
    reward: 10,
    slowed: false,
    spawnTime: 0,
    speed: 0.1,
    type: 'basic',
    ...overrides,
  };
}

/**
 * Create a test tower
 */
export function createTestTower(overrides: Partial<Tower> = {}): Tower {
  return {
    id: 1,
    lastShot: 0,
    level: 1,
    position: { x: 2, y: 5 },
    type: 'basic',
    ...overrides,
  };
}

/**
 * Create a test projectile
 */
export function createTestProjectile(
  overrides: Partial<Projectile> = {},
): Projectile {
  return {
    id: 1,
    position: { x: 2, y: 5 },
    sourcePosition: { x: 2, y: 5 },
    target: { x: 2, y: 6 },
    type: 'basic',
    ...overrides,
  };
}

export function createTestPowerup(overrides: Partial<PowerUp> = {}): PowerUp {
  return {
    boost: 1.5,
    id: 1,
    isTowerBound: false,
    position: { x: 5, y: 5 },
    remainingWaves: 3,
    ...overrides,
  };
}

/**
 * Simulate multiple game frames
 */
export function simulateFrames(
  updateFn: (deltaTime: number, timestamp: number) => void,
  frameCount: number,
  frameTime = 16,
): void {
  const baseTime = Date.now();
  for (let i = 0; i < frameCount; i++) {
    updateFn(frameTime, baseTime + i * frameTime);
  }
}

/**
 * Advance game state until a condition is met or max iterations reached
 */
export function advanceUntilCondition(
  updateFn: (deltaTime: number, timestamp: number) => boolean,
  maxIterations = 1000,
  frameTime = 16,
): number {
  const baseTime = Date.now();
  for (let i = 0; i < maxIterations; i++) {
    const shouldStop = updateFn(frameTime, baseTime + i * frameTime);
    if (shouldStop) {
      return i;
    }
  }
  return maxIterations;
}
