import { describe, expect, it } from 'bun:test';
import { CollisionSystem } from '../engine/systems/collision-system';
import {
  createTestEnemy,
  createTestPowerup,
  createTestProjectile,
  createTestState,
  createTestTower,
} from './test-helpers';

describe('Collision System Tests', () => {
  describe('Projectile-enemy collisions', () => {
    it('should detect collision when projectile reaches target', () => {
      const enemy = createTestEnemy({
        health: 100,
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic', // 20 damage
      });

      const projectile = createTestProjectile({
        position: { x: 2, y: 6 }, // At target
        sourcePosition: { x: 2, y: 5 },
        target: { x: 2, y: 6 },
        targetEnemyId: 1,
        type: 'basic',
      });

      const state = createTestState({
        projectiles: [projectile],
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const collisionSystem = new CollisionSystem();
      const timestamp = Date.now();
      const result = collisionSystem.update(state, 16, timestamp);

      // Enemy should take damage
      const damagedEnemy = result.spawnedEnemies?.[0];
      expect(damagedEnemy?.health).toBeLessThan(100);

      // Projectile should be removed
      expect(result.projectiles).toHaveLength(0);

      // Damage number should be created
      expect(result.damageNumbers).toBeDefined();
      expect(result.damageNumbers?.length).toBeGreaterThan(0);
    });

    it('should track enemy by ID even if position changed', () => {
      const enemy = createTestEnemy({
        health: 100,
        id: 1,
        pathIndex: 3,
        position: { x: 3, y: 6 }, // Moved from original target
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic',
      });

      const projectile = createTestProjectile({
        position: { x: 3, y: 6 }, // Followed enemy
        sourcePosition: { x: 2, y: 5 },
        target: { x: 3, y: 6 },
        targetEnemyId: 1,
        type: 'basic',
      });

      const state = createTestState({
        projectiles: [projectile],
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const collisionSystem = new CollisionSystem();
      const timestamp = Date.now();
      const result = collisionSystem.update(state, 16, timestamp);

      // Should hit by ID even though position changed
      expect(result.spawnedEnemies?.[0]?.health).toBeLessThan(100);
    });

    it('should kill enemy and award rewards', () => {
      const enemy = createTestEnemy({
        health: 10, // Low health
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
        reward: 10,
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic', // 20 damage - enough to kill
      });

      const projectile = createTestProjectile({
        position: { x: 2, y: 6 },
        sourcePosition: { x: 2, y: 5 },
        target: { x: 2, y: 6 },
        targetEnemyId: 1,
        type: 'basic',
      });

      const state = createTestState({
        money: 100,
        projectiles: [projectile],
        score: 0,
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const collisionSystem = new CollisionSystem();
      const timestamp = Date.now();
      const result = collisionSystem.update(state, 16, timestamp);

      // Enemy should be removed
      expect(result.spawnedEnemies).toHaveLength(0);

      // Money should be awarded
      expect(result.money).toBeGreaterThan(100);

      // Score should be awarded
      expect(result.score).toBeGreaterThan(0);
    });

    it('should handle slow tower effects', () => {
      const enemy = createTestEnemy({
        health: 100,
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
        slowed: false,
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'slow',
      });

      const projectile = createTestProjectile({
        position: { x: 2, y: 6 },
        sourcePosition: { x: 2, y: 5 },
        target: { x: 2, y: 6 },
        targetEnemyId: 1,
        type: 'slow',
      });

      const state = createTestState({
        projectiles: [projectile],
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const collisionSystem = new CollisionSystem();
      const timestamp = Date.now();
      const result = collisionSystem.update(state, 16, timestamp);

      // Enemy should be slowed
      expect(result.spawnedEnemies?.[0]?.slowed).toBe(true);
    });
  });

  describe('Bomb tower splash damage', () => {
    it('should apply splash damage to nearby enemies', () => {
      const primaryEnemy = createTestEnemy({
        health: 100,
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const nearbyEnemy = createTestEnemy({
        health: 100,
        id: 2,
        pathIndex: 3,
        position: { x: 3, y: 6 }, // Within splash range (1.5)
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'bomb', // 50 damage, 50% splash
      });

      const projectile = createTestProjectile({
        position: { x: 2, y: 6 },
        sourcePosition: { x: 2, y: 5 },
        target: { x: 2, y: 6 },
        targetEnemyId: 1,
        type: 'bomb',
      });

      const state = createTestState({
        projectiles: [projectile],
        spawnedEnemies: [primaryEnemy, nearbyEnemy],
        towers: [tower],
      });

      const collisionSystem = new CollisionSystem();
      const timestamp = Date.now();
      const result = collisionSystem.update(state, 16, timestamp);

      // Both enemies should take damage
      expect(result.spawnedEnemies?.[0]?.health).toBeLessThan(100);
      expect(result.spawnedEnemies?.[1]?.health).toBeLessThan(100);

      // Primary target takes full damage, splash target takes 50%
      const primary = result.spawnedEnemies?.find((e) => e.id === 1);
      const splash = result.spawnedEnemies?.find((e) => e.id === 2);
      expect(primary?.health).toBeDefined();
      expect(splash?.health).toBeDefined();
      if (primary?.health !== undefined && splash?.health !== undefined) {
        expect(primary.health).toBeLessThan(splash.health);
      }
    });

    it('should not apply splash damage to enemies out of range', () => {
      const primaryEnemy = createTestEnemy({
        health: 100,
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const farEnemy = createTestEnemy({
        health: 100,
        id: 2,
        pathIndex: 5,
        position: { x: 5, y: 6 }, // Too far for splash
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'bomb',
      });

      const projectile = createTestProjectile({
        position: { x: 2, y: 6 },
        sourcePosition: { x: 2, y: 5 },
        target: { x: 2, y: 6 },
        targetEnemyId: 1,
        type: 'bomb',
      });

      const state = createTestState({
        projectiles: [projectile],
        spawnedEnemies: [primaryEnemy, farEnemy],
        towers: [tower],
      });

      const collisionSystem = new CollisionSystem();
      const timestamp = Date.now();
      const result = collisionSystem.update(state, 16, timestamp);

      // Only primary enemy should take damage
      const primary = result.spawnedEnemies?.find((e) => e.id === 1);
      const far = result.spawnedEnemies?.find((e) => e.id === 2);
      expect(primary?.health).toBeLessThan(100);
      expect(far?.health).toBe(100);
    });
  });

  describe('Landmine collisions', () => {
    it('should trigger landmine when enemy steps on it', () => {
      const enemy = createTestEnemy({
        health: 100,
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const state = createTestState({
        landmines: [
          {
            damage: 30,
            id: 1,
            position: { x: 2, y: 6 },
          },
        ],
        spawnedEnemies: [enemy],
      });

      const collisionSystem = new CollisionSystem();
      const timestamp = Date.now();
      const result = collisionSystem.update(state, 16, timestamp);

      // Enemy should take damage
      expect(result.spawnedEnemies?.[0]?.health).toBeLessThan(100);

      // Landmine should be removed
      expect(result.landmines).toHaveLength(0);
    });

    it('should kill enemy with landmine', () => {
      const enemy = createTestEnemy({
        health: 20,
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
        reward: 10,
      });

      const state = createTestState({
        combo: 0,
        landmines: [
          {
            damage: 50,
            id: 1,
            position: { x: 2, y: 6 },
          },
        ],
        money: 100,
        score: 0,
        spawnedEnemies: [enemy],
      });

      const collisionSystem = new CollisionSystem();
      const timestamp = Date.now();
      const result = collisionSystem.update(state, 16, timestamp);

      // Enemy should be killed
      expect(result.spawnedEnemies).toHaveLength(0);

      // Should award money
      expect(result.money).toBeGreaterThan(100);

      // Should increment combo
      expect(result.combo).toBeGreaterThan(0);
    });
  });

  describe('Combo mechanics', () => {
    it('should increment combo on successive kills', () => {
      const enemy = createTestEnemy({
        health: 10,
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic',
      });

      const projectile = createTestProjectile({
        position: { x: 2, y: 6 },
        sourcePosition: { x: 2, y: 5 },
        target: { x: 2, y: 6 },
        targetEnemyId: 1,
        type: 'basic',
      });

      const state = createTestState({
        combo: 5,
        lastKillTime: Date.now() - 500, // Recent kill
        projectiles: [projectile],
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const collisionSystem = new CollisionSystem();
      const timestamp = Date.now();
      const result = collisionSystem.update(state, 16, timestamp);

      // Combo should increment
      expect(result.combo).toBeGreaterThan(5);
    });

    it('should reset combo after timeout', () => {
      const enemy = createTestEnemy({
        health: 10,
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic',
      });

      const projectile = createTestProjectile({
        position: { x: 2, y: 6 },
        sourcePosition: { x: 2, y: 5 },
        target: { x: 2, y: 6 },
        targetEnemyId: 1,
        type: 'basic',
      });

      const state = createTestState({
        combo: 5,
        lastKillTime: Date.now() - 3000, // Long time ago (>2s)
        projectiles: [projectile],
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const collisionSystem = new CollisionSystem();
      const timestamp = Date.now();
      const result = collisionSystem.update(state, 16, timestamp);

      // Combo should reset to 1
      expect(result.combo).toBe(1);
    });

    it('should apply combo multiplier to score', () => {
      const enemy = createTestEnemy({
        health: 10,
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
        reward: 10,
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic',
      });

      const projectile = createTestProjectile({
        position: { x: 2, y: 6 },
        sourcePosition: { x: 2, y: 5 },
        target: { x: 2, y: 6 },
        targetEnemyId: 1,
        type: 'basic',
      });

      const state = createTestState({
        combo: 10,
        lastKillTime: Date.now() - 500,
        projectiles: [projectile],
        score: 0,
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const collisionSystem = new CollisionSystem();
      const timestamp = Date.now();
      const result = collisionSystem.update(state, 16, timestamp);

      // Score should be multiplied by combo
      expect(result.score).toBeGreaterThan(10);
    });
  });

  describe('Adjacent tower bonus', () => {
    it('should apply damage bonus for adjacent towers', () => {
      const enemy = createTestEnemy({
        health: 100,
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const tower = createTestTower({
        id: 1,
        position: { x: 2, y: 5 },
        type: 'basic', // 20 base damage
      });

      const adjacentTower = createTestTower({
        id: 2,
        position: { x: 3, y: 5 }, // Adjacent to tower 1
        type: 'basic',
      });

      const projectile = createTestProjectile({
        position: { x: 2, y: 6 },
        sourcePosition: { x: 2, y: 5 },
        target: { x: 2, y: 6 },
        targetEnemyId: 1,
        type: 'basic',
      });

      const state = createTestState({
        projectiles: [projectile],
        spawnedEnemies: [enemy],
        towers: [tower, adjacentTower],
      });

      const collisionSystem = new CollisionSystem();
      const timestamp = Date.now();
      const result = collisionSystem.update(state, 16, timestamp);

      // Damage should be increased due to adjacent tower
      const enemyHealth = result.spawnedEnemies?.[0]?.health;
      expect(enemyHealth).toBeDefined();
      if (enemyHealth !== undefined) {
        const damageTaken = 100 - enemyHealth;
        expect(damageTaken).toBeGreaterThan(20); // Base damage is 20
      }
    });
  });

  describe('Powerup effects', () => {
    it('should apply powerup damage multiplier', () => {
      const enemy = createTestEnemy({
        health: 100,
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic', // 20 base damage
      });

      const projectile = createTestProjectile({
        position: { x: 2, y: 6 },
        sourcePosition: { x: 2, y: 5 },
        target: { x: 2, y: 6 },
        targetEnemyId: 1,
        type: 'basic',
      });

      const state = createTestState({
        powerups: [
          createTestPowerup({
            boost: 2.0, // 2x damage
            id: 1,
            position: { x: 2, y: 5 }, // Same position as tower
          }),
        ],
        projectiles: [projectile],
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const collisionSystem = new CollisionSystem();
      const timestamp = Date.now();
      const result = collisionSystem.update(state, 16, timestamp);

      // Damage should be doubled
      const enemyHealth = result.spawnedEnemies?.[0]?.health;
      expect(enemyHealth).toBeDefined();
      if (enemyHealth !== undefined) {
        const damageTaken = 100 - enemyHealth;
        expect(damageTaken).toBeGreaterThanOrEqual(40); // 20 * 2 = 40
      }
    });
  });

  describe('Multiple collisions', () => {
    it('should handle multiple projectiles hitting at once', () => {
      const enemy = createTestEnemy({
        health: 100,
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic',
      });

      const projectile1 = createTestProjectile({
        id: 1,
        position: { x: 2, y: 6 },
        sourcePosition: { x: 2, y: 5 },
        target: { x: 2, y: 6 },
        targetEnemyId: 1,
        type: 'basic',
      });

      const projectile2 = createTestProjectile({
        id: 2,
        position: { x: 2, y: 6 },
        sourcePosition: { x: 2, y: 5 },
        target: { x: 2, y: 6 },
        targetEnemyId: 1,
        type: 'basic',
      });

      const state = createTestState({
        projectiles: [projectile1, projectile2],
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const collisionSystem = new CollisionSystem();
      const timestamp = Date.now();
      const result = collisionSystem.update(state, 16, timestamp);

      // Both projectiles should be removed
      expect(result.projectiles).toHaveLength(0);

      // Enemy should take damage from both
      const enemyHealth = result.spawnedEnemies?.[0]?.health;
      expect(enemyHealth).toBeDefined();
      if (enemyHealth !== undefined) {
        const damageTaken = 100 - enemyHealth;
        expect(damageTaken).toBeGreaterThanOrEqual(40); // 20 * 2
      }
    });
  });
});
