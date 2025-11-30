import {
  createDefaultProgress,
  withProgressDefaults,
} from '../constants/progress';
import type { Enemy, PlaceableItem, Projectile, Tower } from '../game-types';
import type { GameState } from '../store/types';

/**
 * Create a base test game state with sensible defaults
 */
export function createTestState(overrides: Partial<GameState> = {}): GameState {
  const baseState: GameState = {
    activeWavePowerUps: [],
    animatedPathLengths: [],
    autoAdvance: false,
    availablePowerUps: [],
    cellSize: 28,
    combo: 0,
    damageNumberIdCounter: 0,
    damageNumbers: [],
    debugPaths: [],
    enemyIdCounter: 1,
    gameSpeed: 1,
    gameStatus: 'playing',
    goalPositions: [{ x: 11, y: 6 }],
    grid: Array(12)
      .fill(null)
      .map(() => Array(12).fill('empty')),
    gridHeight: 12,
    gridWidth: 12,
    isMobile: true,
    isPaused: false,
    isWaveActive: false,
    lastKillTime: 0,
    lives: 10,
    maxWaves: 20,
    money: 500,
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
    startPositions: [{ x: 0, y: 6 }],
    towerIdCounter: 0,
    towers: [],
    unspawnedEnemies: [],
    wasPausedBeforeWaveInfo: false,
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
  const defaultTarget = overrides.target ?? { x: 2, y: 6 };
  const defaultSource = overrides.sourcePosition ?? { x: 2, y: 5 };
  const dx = defaultTarget.x - defaultSource.x;
  const dy = defaultTarget.y - defaultSource.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const direction =
    distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 0, y: 0 };

  return {
    direction,
    hitEnemyIds: new Set<number>(),
    id: 1,
    penetrationRemaining: 0,
    position: { x: 2, y: 5 },
    sourcePosition: defaultSource,
    target: defaultTarget,
    type: 'basic',
    ...overrides,
  };
}

// Legacy function - DEPRECATED, use createTestPlaceablePowerup instead
/**
 * @deprecated Use createTestPlaceablePowerup instead
 */
export function createTestPowerup(
  overrides: Partial<PlaceableItem & { category: 'powerup' }> = {},
): PlaceableItem & { category: 'powerup' } {
  return createTestPlaceablePowerup(overrides);
}

/**
 * Create a test placeable powerup item
 */
export function createTestPlaceablePowerup(
  overrides: Partial<PlaceableItem & { category: 'powerup' }> = {},
): PlaceableItem & { category: 'powerup' } {
  return {
    boost: 1.5,
    category: 'powerup',
    id: 1,
    isTowerBound: false,
    positions: [{ x: 5, y: 5 }],
    rarity: 'common',
    remainingWaves: 3,
    type: 'powerNode',
    ...overrides,
  };
}

/**
 * Create a test placeable trap item (landmine)
 */
export function createTestPlaceableTrap(
  overrides: Partial<PlaceableItem & { category: 'trap' }> = {},
): PlaceableItem & { category: 'trap' } {
  return {
    category: 'trap',
    damage: 100,
    id: 1,
    positions: [{ x: 5, y: 5 }],
    type: 'landmine',
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
