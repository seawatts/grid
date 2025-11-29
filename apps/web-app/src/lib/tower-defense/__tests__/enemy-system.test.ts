import { describe, expect, it } from 'bun:test';
import { EnemySystem } from '../engine/systems/enemy-system';
import type { Enemy } from '../game-types';
import type { GameState } from '../store/types';

describe('Enemy System Integration Tests', () => {
  const createTestState = (overrides: Partial<GameState> = {}): GameState => ({
    activeWavePowerUps: [],
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
    isWaveActive: true,
    landmineIdCounter: 0,
    landmines: [],
    lastKillTime: 0,
    lives: 10,
    money: 500,
    obstacles: [],
    particleIdCounter: 0,
    particles: [],
    pendingPowerUpSelection: false,
    placeableIdCounter: 0,
    placeables: [],
    powerupIdCounter: 0,
    powerups: [],
    progress: {
      mapRatings: {},
      techPoints: 0,
      upgrades: {
        energyRecoveryRate: 0,
        gridBugDamage: 0,
        gridBugFrequency: 0,
        landmineDamage: 0,
        landmineFrequency: 0,
        maxEnergy: 0,
        powerNodeFrequency: 0,
        powerNodePersistence: 0,
        powerNodePotency: 0,
        streamFrequency: 0,
        streamLength: 0,
      },
    },
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
    wave: 1,
    ...overrides,
  });

  const createTestEnemy = (overrides: Partial<Enemy> = {}): Enemy => ({
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
  });

  describe('Enemy spawning', () => {
    it('should spawn enemies when their spawn time arrives', () => {
      const timestamp = Date.now();
      const enemy = createTestEnemy({
        spawnTime: timestamp - 100, // Ready to spawn
      });

      const state = createTestState({
        spawnedEnemies: [],
        unspawnedEnemies: [enemy],
      });

      const enemySystem = new EnemySystem();
      const result = enemySystem.update(state, 16, timestamp);

      expect(result.spawnedEnemies).toHaveLength(1);
      expect(result.unspawnedEnemies).toHaveLength(0);
    });

    it('should not spawn enemies before their spawn time', () => {
      const timestamp = Date.now();
      const enemy = createTestEnemy({
        spawnTime: timestamp + 1000, // Not ready yet
      });

      const state = createTestState({
        spawnedEnemies: [],
        unspawnedEnemies: [enemy],
      });

      const enemySystem = new EnemySystem();
      const result = enemySystem.update(state, 16, timestamp);

      expect(result.spawnedEnemies).toHaveLength(0);
      expect(result.unspawnedEnemies).toHaveLength(1);
    });

    it('should spawn multiple enemies in order', () => {
      const timestamp = Date.now();
      const enemy1 = createTestEnemy({
        id: 1,
        spawnTime: timestamp - 200,
      });
      const enemy2 = createTestEnemy({
        id: 2,
        spawnTime: timestamp - 100,
      });
      const enemy3 = createTestEnemy({
        id: 3,
        spawnTime: timestamp + 100, // Not ready
      });

      const state = createTestState({
        spawnedEnemies: [],
        unspawnedEnemies: [enemy1, enemy2, enemy3],
      });

      const enemySystem = new EnemySystem();
      const result = enemySystem.update(state, 16, timestamp);

      expect(result.spawnedEnemies).toHaveLength(2);
      expect(result.unspawnedEnemies).toHaveLength(1);
      expect(result.unspawnedEnemies?.[0]?.id).toBe(3);
    });
  });

  describe('Enemy movement', () => {
    it('should move enemy along path', () => {
      const enemy = createTestEnemy({
        pathIndex: 0,
        position: { x: 0, y: 6 },
        speed: 0.1,
      });

      const state = createTestState({
        spawnedEnemies: [enemy],
      });

      const enemySystem = new EnemySystem();
      const result = enemySystem.update(state, 16, Date.now());

      const movedEnemy = result.spawnedEnemies?.[0];
      expect(movedEnemy).toBeDefined();
      expect(movedEnemy?.pathIndex).toBeGreaterThan(0);
    });

    it('should move faster enemies more quickly', () => {
      const slowEnemy = createTestEnemy({
        id: 1,
        path: [
          { x: 0, y: 6 },
          { x: 1, y: 6 },
          { x: 2, y: 6 },
          { x: 3, y: 6 },
          { x: 4, y: 6 },
        ],
        pathIndex: 0,
        position: { x: 0, y: 6 },
        speed: 0.05,
      });

      const fastEnemy = createTestEnemy({
        id: 2,
        path: [
          { x: 0, y: 7 },
          { x: 1, y: 7 },
          { x: 2, y: 7 },
          { x: 3, y: 7 },
          { x: 4, y: 7 },
        ],
        pathIndex: 0,
        position: { x: 0, y: 7 },
        speed: 0.2,
      });

      const state = createTestState({
        spawnedEnemies: [slowEnemy, fastEnemy],
      });

      const enemySystem = new EnemySystem();
      const result = enemySystem.update(state, 16, Date.now());

      const updatedSlow = result.spawnedEnemies?.find((e) => e.id === 1);
      const updatedFast = result.spawnedEnemies?.find((e) => e.id === 2);

      expect(updatedFast?.pathIndex).toBeDefined();
      expect(updatedSlow?.pathIndex).toBeDefined();
      if (
        updatedFast?.pathIndex !== undefined &&
        updatedSlow?.pathIndex !== undefined
      ) {
        expect(updatedFast.pathIndex).toBeGreaterThan(updatedSlow.pathIndex);
      }
    });

    it('should respect game speed multiplier', () => {
      const enemy = createTestEnemy({
        pathIndex: 0,
        position: { x: 0, y: 6 },
        speed: 0.1,
      });

      // Normal speed
      const state1 = createTestState({
        gameSpeed: 1,
        spawnedEnemies: [enemy],
      });

      const enemySystem = new EnemySystem();
      const result1 = enemySystem.update(state1, 16, Date.now());
      const normalProgress = result1.spawnedEnemies?.[0]?.pathIndex;
      expect(normalProgress).toBeDefined();

      // Double speed
      const state2 = createTestState({
        gameSpeed: 2,
        spawnedEnemies: [enemy],
      });

      const result2 = enemySystem.update(state2, 16, Date.now());
      const fastProgress = result2.spawnedEnemies?.[0]?.pathIndex;

      expect(fastProgress).toBeDefined();
      expect(normalProgress).toBeDefined();
      if (fastProgress !== undefined && normalProgress !== undefined) {
        expect(fastProgress).toBeGreaterThan(normalProgress);
      }
    });

    it('should remove enemy and reduce lives when reaching goal', () => {
      const enemy = createTestEnemy({
        path: [
          { x: 10, y: 6 },
          { x: 11, y: 6 },
        ],
        pathIndex: 1.5, // Almost at end
        position: { x: 10.5, y: 6 },
      });

      const state = createTestState({
        lives: 10,
        spawnedEnemies: [enemy],
      });

      const enemySystem = new EnemySystem();
      const result = enemySystem.update(state, 16, Date.now());

      expect(result.spawnedEnemies).toHaveLength(0);
      expect(result.lives).toBe(9);
    });

    it('should handle multiple enemies reaching goal', () => {
      const enemy1 = createTestEnemy({
        id: 1,
        path: [
          { x: 10, y: 6 },
          { x: 11, y: 6 },
        ],
        pathIndex: 1.5,
        position: { x: 10.5, y: 6 },
      });

      const enemy2 = createTestEnemy({
        id: 2,
        path: [
          { x: 10, y: 7 },
          { x: 11, y: 7 },
        ],
        pathIndex: 1.5,
        position: { x: 10.5, y: 7 },
      });

      const state = createTestState({
        lives: 10,
        spawnedEnemies: [enemy1, enemy2],
      });

      const enemySystem = new EnemySystem();
      const result = enemySystem.update(state, 16, Date.now());

      expect(result.spawnedEnemies).toHaveLength(0);
      expect(result.lives).toBe(8);
    });

    it('should not let lives go below zero', () => {
      const enemy = createTestEnemy({
        path: [
          { x: 10, y: 6 },
          { x: 11, y: 6 },
        ],
        pathIndex: 1.5,
        position: { x: 10.5, y: 6 },
      });

      const state = createTestState({
        lives: 0,
        spawnedEnemies: [enemy],
      });

      const enemySystem = new EnemySystem();
      const result = enemySystem.update(state, 16, Date.now());

      expect(result.lives).toBe(0);
    });
  });

  describe('Enemy collision prevention', () => {
    it('should prevent enemies from occupying the same cell', () => {
      const enemy1 = createTestEnemy({
        id: 1,
        path: [
          { x: 0, y: 6 },
          { x: 1, y: 6 },
          { x: 2, y: 6 },
        ],
        pathIndex: 1,
        position: { x: 1, y: 6 },
        speed: 0.1,
      });

      const enemy2 = createTestEnemy({
        id: 2,
        path: [
          { x: 0, y: 6 },
          { x: 1, y: 6 },
          { x: 2, y: 6 },
        ],
        pathIndex: 0.5,
        position: { x: 0.5, y: 6 },
        speed: 0.1,
      });

      const state = createTestState({
        spawnedEnemies: [enemy1, enemy2],
      });

      const enemySystem = new EnemySystem();
      const result = enemySystem.update(state, 16, Date.now());

      const updated1 = result.spawnedEnemies?.find((e) => e.id === 1);
      const updated2 = result.spawnedEnemies?.find((e) => e.id === 2);

      // Both should be in different cells
      const cell1 = updated1?.position
        ? `${Math.floor(updated1.position.x)},${Math.floor(updated1.position.y)}`
        : '';
      const cell2 = updated2?.position
        ? `${Math.floor(updated2.position.x)},${Math.floor(updated2.position.y)}`
        : '';

      // If enemy2 would collide, it should stay in its current position
      expect(cell1).not.toBe(cell2);
    });
  });

  describe('Slow effect', () => {
    it('should reset slow effect each frame', () => {
      const enemy = createTestEnemy({
        slowed: true, // Was slowed by a tower
      });

      const state = createTestState({
        spawnedEnemies: [enemy],
      });

      const enemySystem = new EnemySystem();
      const result = enemySystem.update(state, 16, Date.now());

      const updatedEnemy = result.spawnedEnemies?.[0];
      expect(updatedEnemy?.slowed).toBe(false);
    });
  });
});
