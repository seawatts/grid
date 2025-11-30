import { describe, expect, it } from 'bun:test';
import { CollisionSystem } from '../engine/systems/collision-system';
import { EnemySystem } from '../engine/systems/enemy-system';
import { ProjectileSystem } from '../engine/systems/projectile-system';
import { TowerSystem } from '../engine/systems/tower-system';
import type { Enemy, Tower } from '../game-types';
import type { GameState } from '../store/types';

describe('Projectile Tracking Integration Tests', () => {
  const createTestState = (overrides: Partial<GameState> = {}): GameState => ({
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
    isMobile: false,
    isPaused: false,
    isWaveActive: true,
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
    progress: {
      energy: 100,
      energyRecoveryRate: 1,
      lastEnergyUpdate: Date.now(),
      mapRatings: {},
      maxEnergy: 100,
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

  const createTestTower = (overrides: Partial<Tower> = {}): Tower => ({
    id: 1,
    lastShot: 0,
    level: 1,
    position: { x: 2, y: 5 },
    type: 'basic',
    ...overrides,
  });

  describe('First enemy damage bug fix', () => {
    it('should track and damage the first enemy that spawns', () => {
      // Setup: Create a fast-moving enemy that would outrun projectiles
      const enemy = createTestEnemy({
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
        speed: 0.18, // Fast enemy
        type: 'fast',
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
      });

      let state = createTestState({
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const towerSystem = new TowerSystem();
      const projectileSystem = new ProjectileSystem();
      const collisionSystem = new CollisionSystem();
      const enemySystem = new EnemySystem();

      const timestamp = Date.now();

      // Step 1: Tower fires at enemy
      const towerUpdate = towerSystem.update(state, 16, timestamp);
      state = { ...state, ...towerUpdate };

      // Verify projectile was created with targetEnemyId
      expect(state.projectiles).toHaveLength(1);
      expect(state.projectiles[0]?.targetEnemyId).toBe(enemy.id);
      expect(state.projectiles[0]?.target).toEqual({ x: 2, y: 6 });

      // Step 2: Enemy moves forward (multiple frames to simulate fast movement)
      for (let i = 0; i < 5; i++) {
        const enemyUpdate = enemySystem.update(state, 16, timestamp + i * 16);
        state = { ...state, ...enemyUpdate };
      }

      // Enemy should have moved significantly
      const movedEnemy = state.spawnedEnemies[0];
      expect(movedEnemy).toBeDefined();
      expect(movedEnemy?.position.x).toBeGreaterThan(2);

      // Step 3: Projectile tracks the moving enemy
      for (let i = 0; i < 10; i++) {
        const projectileUpdate = projectileSystem.update(
          state,
          16,
          timestamp + i * 16,
        );
        state = { ...state, ...projectileUpdate };
      }

      // Projectile target should update to follow enemy
      const trackedProjectile = state.projectiles[0];
      expect(trackedProjectile).toBeDefined();
      expect(movedEnemy?.position.x).toBeDefined();
      if (trackedProjectile && movedEnemy?.position.x !== undefined) {
        expect(trackedProjectile.target.x).toBeCloseTo(
          movedEnemy.position.x,
          1,
        );
      }

      // Step 4: Continue updates until projectile reaches target
      for (let i = 0; i < 20; i++) {
        const projectileUpdate = projectileSystem.update(
          state,
          16,
          timestamp + i * 16,
        );
        state = { ...state, ...projectileUpdate };

        const collisionUpdate = collisionSystem.update(
          state,
          16,
          timestamp + i * 16,
        );
        state = { ...state, ...collisionUpdate };

        // If projectile hit and was removed, break
        if (state.projectiles.length === 0) {
          break;
        }
      }

      // Step 5: Verify damage was applied
      const finalEnemy = state.spawnedEnemies[0];
      if (finalEnemy) {
        // Enemy should have taken damage (not full health)
        expect(finalEnemy.health).toBeLessThan(100);
      } else {
        // Or enemy was killed (acceptable outcome)
        expect(state.spawnedEnemies).toHaveLength(0);
      }
    });

    it('should handle multiple projectiles tracking different enemies', () => {
      const enemy1 = createTestEnemy({
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const enemy2 = createTestEnemy({
        id: 2,
        pathIndex: 4,
        position: { x: 4, y: 6 },
      });

      const tower1 = createTestTower({
        id: 1,
        position: { x: 2, y: 5 },
      });

      const tower2 = createTestTower({
        id: 2,
        position: { x: 4, y: 5 },
      });

      let state = createTestState({
        enemyIdCounter: 3,
        spawnedEnemies: [enemy1, enemy2],
        towerIdCounter: 3,
        towers: [tower1, tower2],
      });

      const towerSystem = new TowerSystem();
      const projectileSystem = new ProjectileSystem();
      const collisionSystem = new CollisionSystem();
      const enemySystem = new EnemySystem();

      const timestamp = Date.now();

      // Both towers fire
      const towerUpdate = towerSystem.update(state, 16, timestamp);
      state = { ...state, ...towerUpdate };

      expect(state.projectiles).toHaveLength(2);

      // Verify each projectile tracks the correct enemy
      const projectile1 = state.projectiles.find(
        (p) => p.sourcePosition.x === 2,
      );
      const projectile2 = state.projectiles.find(
        (p) => p.sourcePosition.x === 4,
      );

      expect(projectile1?.targetEnemyId).toBe(enemy1.id);
      expect(projectile2?.targetEnemyId).toBe(enemy2.id);

      // Move enemies
      for (let i = 0; i < 5; i++) {
        const enemyUpdate = enemySystem.update(state, 16, timestamp + i * 16);
        state = { ...state, ...enemyUpdate };
      }

      // Track with projectiles
      for (let i = 0; i < 10; i++) {
        const projectileUpdate = projectileSystem.update(
          state,
          16,
          timestamp + i * 16,
        );
        state = { ...state, ...projectileUpdate };
      }

      // Both projectiles should still be tracking
      expect(state.projectiles.length).toBeGreaterThan(0);

      // Process collisions
      for (let i = 0; i < 30; i++) {
        const projectileUpdate = projectileSystem.update(
          state,
          16,
          timestamp + i * 16,
        );
        state = { ...state, ...projectileUpdate };

        const collisionUpdate = collisionSystem.update(
          state,
          16,
          timestamp + i * 16,
        );
        state = { ...state, ...collisionUpdate };

        if (state.projectiles.length === 0) {
          break;
        }
      }

      // Both enemies should have taken damage or been killed
      const remainingHealth = state.spawnedEnemies.reduce(
        (sum, e) => sum + e.health,
        0,
      );
      expect(remainingHealth).toBeLessThan(200); // Started with 200 total
    });

    it('should handle projectile when target enemy is killed before impact', () => {
      const enemy = createTestEnemy({
        health: 1, // Very low health
        id: 1,
        maxHealth: 100,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
      });

      let state = createTestState({
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const towerSystem = new TowerSystem();
      const projectileSystem = new ProjectileSystem();
      const collisionSystem = new CollisionSystem();

      const timestamp = Date.now();

      // Tower fires
      const towerUpdate = towerSystem.update(state, 16, timestamp);
      state = { ...state, ...towerUpdate };

      expect(state.projectiles).toHaveLength(1);
      const projectileId = state.projectiles[0]?.id;

      // Kill the enemy (simulate another tower or landmine killing it)
      state = {
        ...state,
        spawnedEnemies: [],
      };

      // Update projectile system - should handle missing target gracefully
      for (let i = 0; i < 20; i++) {
        const projectileUpdate = projectileSystem.update(
          state,
          16,
          timestamp + i * 16,
        );
        state = { ...state, ...projectileUpdate };

        const collisionUpdate = collisionSystem.update(
          state,
          16,
          timestamp + i * 16,
        );
        state = { ...state, ...collisionUpdate };

        // Projectile should eventually be removed when it reaches target position
        if (!state.projectiles.find((p) => p.id === projectileId)) {
          break;
        }
      }

      // Test passes if we don't crash
      expect(state.spawnedEnemies).toHaveLength(0);
    });
  });

  describe('Backward compatibility', () => {
    it('should still work with projectiles that have no targetEnemyId (legacy)', () => {
      const enemy = createTestEnemy({
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const tower = createTestTower({
        id: 1,
        position: { x: 2, y: 5 },
      });

      let state = createTestState({
        // Create a legacy projectile without targetEnemyId
        projectiles: [
          {
            direction: { x: 0, y: 1 },
            hitEnemyIds: new Set<number>(),
            id: 1,
            penetrationRemaining: 0,
            position: { x: 2, y: 5.5 },
            sourcePosition: { x: 2, y: 5 },
            target: { x: 2, y: 6 },
            type: 'basic',
            // No targetEnemyId
          },
        ],
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const projectileSystem = new ProjectileSystem();
      const collisionSystem = new CollisionSystem();

      const timestamp = Date.now();

      // Update projectile - should use position-based fallback
      for (let i = 0; i < 20; i++) {
        const projectileUpdate = projectileSystem.update(
          state,
          16,
          timestamp + i * 16,
        );
        state = { ...state, ...projectileUpdate };

        const collisionUpdate = collisionSystem.update(
          state,
          16,
          timestamp + i * 16,
        );
        state = { ...state, ...collisionUpdate };

        if (state.projectiles.length === 0) {
          break;
        }
      }

      // Should still damage enemy via position-based collision
      const finalEnemy = state.spawnedEnemies[0];
      if (finalEnemy) {
        expect(finalEnemy.health).toBeLessThan(100);
      } else {
        // Or killed
        expect(state.spawnedEnemies).toHaveLength(0);
      }
    });
  });
});
