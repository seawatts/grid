import { describe, expect, it } from 'bun:test';
import { TowerSystem } from '../engine/systems/tower-system';
import {
  createTestEnemy,
  createTestState,
  createTestTower,
} from './test-helpers';

describe('Tower System Tests', () => {
  describe('Tower targeting', () => {
    it('should target enemy within range', () => {
      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic', // range: 2
      });

      const enemy = createTestEnemy({
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const state = createTestState({
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const towerSystem = new TowerSystem();
      const timestamp = Date.now();
      const result = towerSystem.update(state, 16, timestamp);

      expect(result.projectiles).toHaveLength(1);
      expect(result.projectiles?.[0]?.targetEnemyId).toBe(enemy.id);
    });

    it('should not target enemy out of range', () => {
      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic', // range: 2
      });

      const enemy = createTestEnemy({
        pathIndex: 10,
        position: { x: 10, y: 6 }, // Too far
      });

      const state = createTestState({
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const towerSystem = new TowerSystem();
      const timestamp = Date.now();
      const result = towerSystem.update(state, 16, timestamp);

      expect(result.projectiles || []).toHaveLength(0);
    });

    it('should target furthest enemy along path when multiple in range', () => {
      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic', // range: 2
      });

      const enemy1 = createTestEnemy({
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const enemy2 = createTestEnemy({
        id: 2,
        pathIndex: 3,
        position: { x: 3, y: 6 },
      });

      const state = createTestState({
        spawnedEnemies: [enemy1, enemy2],
        towers: [tower],
      });

      const towerSystem = new TowerSystem();
      const timestamp = Date.now();
      const result = towerSystem.update(state, 16, timestamp);

      expect(result.projectiles).toHaveLength(1);
      expect(result.projectiles?.[0]?.targetEnemyId).toBe(enemy2.id);
    });

    it('should handle sniper tower with longer range', () => {
      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'sniper', // range: 5
      });

      const enemy = createTestEnemy({
        pathIndex: 8,
        position: { x: 6, y: 6 }, // Distance ~4.5, within sniper range of 5
      });

      const state = createTestState({
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const towerSystem = new TowerSystem();
      const timestamp = Date.now();
      const result = towerSystem.update(state, 16, timestamp);

      expect(result.projectiles).toHaveLength(1);
    });
  });

  describe('Fire rate cooldown', () => {
    it('should respect fire rate cooldown', () => {
      const tower = createTestTower({
        lastShot: 0,
        position: { x: 2, y: 5 },
        type: 'basic', // fireRate: 500ms
      });

      const enemy = createTestEnemy({
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const state = createTestState({
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const towerSystem = new TowerSystem();
      const timestamp = 100; // Only 100ms since last shot

      const result = towerSystem.update(state, 16, timestamp);

      // Should not fire yet
      expect(result.projectiles || []).toHaveLength(0);
    });

    it('should fire after cooldown expires', () => {
      const tower = createTestTower({
        lastShot: 0,
        position: { x: 2, y: 5 },
        type: 'basic', // fireRate: 500ms
      });

      const enemy = createTestEnemy({
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const state = createTestState({
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const towerSystem = new TowerSystem();
      const timestamp = 600; // 600ms since last shot

      const result = towerSystem.update(state, 16, timestamp);

      // Should fire
      expect(result.projectiles).toHaveLength(1);
      expect(result.towers?.[0]?.lastShot).toBe(timestamp);
    });

    it('should handle different tower types with different fire rates', () => {
      const basicTower = createTestTower({
        id: 1,
        lastShot: 0,
        position: { x: 2, y: 5 },
        type: 'basic', // fireRate: 500ms
      });

      const bombTower = createTestTower({
        id: 2,
        lastShot: 0,
        position: { x: 4, y: 5 },
        type: 'bomb', // fireRate: 2000ms
      });

      const enemy = createTestEnemy({
        pathIndex: 2,
        position: { x: 3, y: 6 },
      });

      const state = createTestState({
        spawnedEnemies: [enemy],
        towers: [basicTower, bombTower],
      });

      const towerSystem = new TowerSystem();
      const timestamp = 600; // Enough for basic, not enough for bomb

      const result = towerSystem.update(state, 16, timestamp);

      // Only basic tower should fire
      expect(result.projectiles).toHaveLength(1);
      expect(result.projectiles?.[0]?.sourcePosition.x).toBe(2);
    });
  });

  describe('Projectile creation', () => {
    it('should create projectile with correct properties', () => {
      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic',
      });

      const enemy = createTestEnemy({
        id: 42,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const state = createTestState({
        projectileIdCounter: 10,
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const towerSystem = new TowerSystem();
      const timestamp = Date.now();
      const result = towerSystem.update(state, 16, timestamp);

      const projectile = result.projectiles?.[0];
      expect(projectile).toBeDefined();
      expect(projectile?.id).toBe(10);
      expect(projectile?.position).toEqual({ x: 2, y: 5 });
      expect(projectile?.sourcePosition).toEqual({ x: 2, y: 5 });
      expect(projectile?.target).toEqual({ x: 2, y: 6 });
      expect(projectile?.targetEnemyId).toBe(42);
      expect(projectile?.type).toBe('basic');
    });

    it('should increment projectile counter', () => {
      const tower = createTestTower({
        position: { x: 2, y: 5 },
      });

      const enemy = createTestEnemy({
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const state = createTestState({
        projectileIdCounter: 5,
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const towerSystem = new TowerSystem();
      const timestamp = Date.now();
      const result = towerSystem.update(state, 16, timestamp);

      expect(result.projectileIdCounter).toBe(6);
    });
  });

  describe('Multiple towers', () => {
    it('should allow multiple towers to fire at different enemies', () => {
      const tower1 = createTestTower({
        id: 1,
        position: { x: 2, y: 5 },
      });

      const tower2 = createTestTower({
        id: 2,
        position: { x: 6, y: 5 },
      });

      const enemy1 = createTestEnemy({
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const enemy2 = createTestEnemy({
        id: 2,
        pathIndex: 6,
        position: { x: 6, y: 6 },
      });

      const state = createTestState({
        spawnedEnemies: [enemy1, enemy2],
        towers: [tower1, tower2],
      });

      const towerSystem = new TowerSystem();
      const timestamp = Date.now();
      const result = towerSystem.update(state, 16, timestamp);

      expect(result.projectiles).toHaveLength(2);

      const projectile1 = result.projectiles?.find(
        (p) => p.sourcePosition.x === 2,
      );
      const projectile2 = result.projectiles?.find(
        (p) => p.sourcePosition.x === 6,
      );

      expect(projectile1?.targetEnemyId).toBe(1);
      expect(projectile2?.targetEnemyId).toBe(2);
    });

    it('should handle towers with no targets', () => {
      const tower1 = createTestTower({
        id: 1,
        position: { x: 2, y: 5 },
      });

      const tower2 = createTestTower({
        id: 2,
        position: { x: 10, y: 5 }, // Far from enemy
      });

      const enemy = createTestEnemy({
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const state = createTestState({
        spawnedEnemies: [enemy],
        towers: [tower1, tower2],
      });

      const towerSystem = new TowerSystem();
      const timestamp = Date.now();
      const result = towerSystem.update(state, 16, timestamp);

      // Only tower1 should fire
      expect(result.projectiles).toHaveLength(1);
      expect(result.projectiles?.[0]?.sourcePosition.x).toBe(2);
    });
  });

  describe('Game speed multiplier', () => {
    it('should adjust fire rate based on game speed', () => {
      const tower = createTestTower({
        lastShot: 0,
        position: { x: 2, y: 5 },
        type: 'basic', // fireRate: 500ms
      });

      const enemy = createTestEnemy({
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      // At 2x speed, fire rate should be halved (250ms effective cooldown)
      const state = createTestState({
        gameSpeed: 2,
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const towerSystem = new TowerSystem();
      const timestamp = 300; // Would not fire at 1x speed, should fire at 2x

      const result = towerSystem.update(state, 16, timestamp);

      // Should fire due to 2x game speed
      expect(result.projectiles).toHaveLength(1);
    });
  });
});
