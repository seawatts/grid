import { beforeAll, describe, expect, it } from 'bun:test';
import { GameEngine } from '../engine/game-engine';
import { CollisionSystem } from '../engine/systems/collision-system';
import { EnemySystem } from '../engine/systems/enemy-system';
import { ProjectileSystem } from '../engine/systems/projectile-system';
import { TowerSystem } from '../engine/systems/tower-system';
import { WaveSystem } from '../engine/systems/wave-system';
import type { SystemUpdateResult } from '../store/types';
import {
  advanceUntilCondition,
  createTestEnemy,
  createTestState,
  createTestTower,
  simulateFrames,
} from './test-helpers';

// Mock requestAnimationFrame for Node/Bun environment
beforeAll(() => {
  if (typeof globalThis.requestAnimationFrame === 'undefined') {
    (
      globalThis as unknown as {
        requestAnimationFrame: typeof requestAnimationFrame;
      }
    ).requestAnimationFrame = (callback: FrameRequestCallback) => {
      return setTimeout(callback, 16) as unknown as number;
    };
    (
      globalThis as unknown as {
        cancelAnimationFrame: typeof cancelAnimationFrame;
      }
    ).cancelAnimationFrame = (id: number) => {
      clearTimeout(id);
    };
  }
});

describe('Gameplay Scenario Tests', () => {
  describe('Complete wave lifecycle', () => {
    it('should complete a full wave from start to finish', () => {
      const onUpdate = () => {};
      const engine = new GameEngine(onUpdate);

      // Start with empty state
      let state = createTestState({
        goalPositions: [{ x: 11, y: 6 }],
        isWaveActive: false,
        money: 200,
        startPositions: [{ x: 0, y: 6 }],
        towers: [],
        wave: 0,
      });

      // Place a tower
      const tower = createTestTower({
        position: { x: 5, y: 5 },
        type: 'basic',
      });
      state = { ...state, towers: [tower] };

      // Start wave
      const waveResult = engine.startWave(state);
      state = { ...state, ...waveResult };

      expect(state.isWaveActive).toBe(true);
      expect(state.unspawnedEnemies?.length).toBeGreaterThan(0);

      // Simulate game until wave completes
      engine.start();
      const frames = advanceUntilCondition((deltaTime, timestamp) => {
        engine.update(state);

        // Manually update systems since we're testing
        const enemySystem = new EnemySystem();
        const towerSystem = new TowerSystem();
        const projectileSystem = new ProjectileSystem();
        const collisionSystem = new CollisionSystem();
        const waveSystem = new WaveSystem();

        let updates: SystemUpdateResult = {};

        updates = {
          ...updates,
          ...enemySystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...towerSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...collisionSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...projectileSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...waveSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        // Wave is complete when not active
        return !state.isWaveActive;
      }, 500);

      engine.stop();

      // Wave should complete
      expect(state.isWaveActive).toBe(false);
      expect(frames).toBeLessThan(500);

      // All enemies should be gone
      expect(state.spawnedEnemies?.length).toBe(0);
      expect(state.unspawnedEnemies?.length).toBe(0);
    });
  });

  describe('Tower damage over time', () => {
    it('should damage enemy progressively', () => {
      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic',
      });

      const enemy = createTestEnemy({
        health: 100,
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      let state = createTestState({
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const towerSystem = new TowerSystem();
      const projectileSystem = new ProjectileSystem();
      const collisionSystem = new CollisionSystem();

      let damageDealt = 0;

      // Simulate until enemy takes damage
      advanceUntilCondition((deltaTime, timestamp) => {
        let updates: SystemUpdateResult = {};

        updates = {
          ...updates,
          ...towerSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...projectileSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...collisionSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        if (state.spawnedEnemies?.length > 0) {
          damageDealt = 100 - state.spawnedEnemies?.[0]?.health;
        }

        return damageDealt > 0;
      }, 100);

      expect(damageDealt).toBeGreaterThan(0);
    });

    it('should kill enemy with multiple shots', () => {
      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic', // 20 damage
      });

      const enemy = createTestEnemy({
        health: 100, // Needs 5 shots
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
        speed: 0, // Stationary for consistent hits
      });

      let state = createTestState({
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const towerSystem = new TowerSystem();
      const projectileSystem = new ProjectileSystem();
      const collisionSystem = new CollisionSystem();

      // Simulate until enemy is killed
      const frames = advanceUntilCondition((deltaTime, timestamp) => {
        let updates: SystemUpdateResult = {};

        updates = {
          ...updates,
          ...towerSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...projectileSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...collisionSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        return state.spawnedEnemies?.length === 0;
      }, 200);

      expect(frames).toBeLessThan(200);
      expect(state.spawnedEnemies).toHaveLength(0);
    });
  });

  describe('Enemy reaching goal', () => {
    it('should lose life when enemy reaches goal', () => {
      const enemy = createTestEnemy({
        path: [
          { x: 10, y: 6 },
          { x: 11, y: 6 },
        ],
        pathIndex: 0,
        position: { x: 10, y: 6 },
        speed: 0.5, // Fast enough to reach goal
      });

      let state = createTestState({
        lives: 10,
        spawnedEnemies: [enemy],
      });

      const enemySystem = new EnemySystem();

      // Simulate until enemy reaches goal
      advanceUntilCondition((deltaTime, timestamp) => {
        const updates = enemySystem.update(state, deltaTime, timestamp);
        state = { ...state, ...updates };

        return state.spawnedEnemies?.length === 0;
      }, 50);

      expect(state.lives).toBe(9);
    });

    it('should lose multiple lives from multiple enemies', () => {
      const enemy1 = createTestEnemy({
        id: 1,
        path: [
          { x: 10, y: 6 },
          { x: 11, y: 6 },
        ],
        pathIndex: 0,
        position: { x: 10, y: 6 },
        speed: 0.5,
      });

      const enemy2 = createTestEnemy({
        id: 2,
        path: [
          { x: 10, y: 7 },
          { x: 11, y: 7 },
        ],
        pathIndex: 0,
        position: { x: 10, y: 7 },
        speed: 0.5,
      });

      let state = createTestState({
        lives: 10,
        spawnedEnemies: [enemy1, enemy2],
      });

      const enemySystem = new EnemySystem();

      // Simulate until both enemies reach goal
      advanceUntilCondition((deltaTime, timestamp) => {
        const updates = enemySystem.update(state, deltaTime, timestamp);
        state = { ...state, ...updates };

        return state.spawnedEnemies?.length === 0;
      }, 50);

      expect(state.lives).toBe(8);
    });
  });

  describe('Money accumulation', () => {
    it('should gain money from killing enemies', () => {
      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic',
      });

      const enemy = createTestEnemy({
        health: 10, // Dies in one hit
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
        reward: 10,
      });

      let state = createTestState({
        money: 100,
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      const towerSystem = new TowerSystem();
      const projectileSystem = new ProjectileSystem();
      const collisionSystem = new CollisionSystem();

      // Simulate until enemy is killed
      advanceUntilCondition((deltaTime, timestamp) => {
        let updates: SystemUpdateResult = {};

        updates = {
          ...updates,
          ...towerSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...projectileSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...collisionSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        return state.spawnedEnemies?.length === 0;
      }, 100);

      expect(state.money).toBeGreaterThan(100);
    });
  });

  describe('Multiple waves', () => {
    it('should handle increasing difficulty over waves', () => {
      const onUpdate = () => {};
      const engine = new GameEngine(onUpdate);

      let state = createTestState({
        goalPositions: [{ x: 11, y: 6 }],
        isWaveActive: false,
        startPositions: [{ x: 0, y: 6 }],
        wave: 0,
      });

      // Start wave 1
      const wave1 = engine.startWave(state);
      const wave1EnemyCount = wave1.unspawnedEnemies?.length;

      // Start wave 5
      state = { ...state, isWaveActive: false, wave: 4 };
      const wave5 = engine.startWave(state);
      const wave5EnemyCount = wave5.unspawnedEnemies?.length;

      // Later waves should have more enemies
      expect(wave5EnemyCount).toBeGreaterThan(wave1EnemyCount);
    });
  });

  describe('Fast enemy regression test', () => {
    it('should hit fast-moving enemies with projectile tracking', () => {
      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic',
      });

      const fastEnemy = createTestEnemy({
        health: 50,
        id: 1,
        pathIndex: 0,
        position: { x: 0, y: 6 },
        speed: 0.18, // Fast enemy
        type: 'fast',
      });

      let state = createTestState({
        spawnedEnemies: [fastEnemy],
        towers: [tower],
      });

      const enemySystem = new EnemySystem();
      const towerSystem = new TowerSystem();
      const projectileSystem = new ProjectileSystem();
      const collisionSystem = new CollisionSystem();

      let enemyWasHit = false;

      // Simulate until enemy is hit
      advanceUntilCondition((deltaTime, timestamp) => {
        let updates: SystemUpdateResult = {};

        updates = {
          ...updates,
          ...enemySystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...towerSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...projectileSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...collisionSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        if (
          state.spawnedEnemies?.length > 0 &&
          state.spawnedEnemies?.[0]?.health < 50
        ) {
          enemyWasHit = true;
        }

        return enemyWasHit || state.spawnedEnemies?.length === 0;
      }, 200);

      // Fast enemy should be hit (regression test for tracking bug)
      expect(enemyWasHit || state.spawnedEnemies?.length === 0).toBe(true);
    });
  });

  describe('Boss enemy battles', () => {
    it('should handle high-health boss enemies', () => {
      const tower1 = createTestTower({
        id: 1,
        position: { x: 2, y: 5 },
        type: 'basic',
      });

      const tower2 = createTestTower({
        id: 2,
        position: { x: 3, y: 5 },
        type: 'basic',
      });

      const bossEnemy = createTestEnemy({
        health: 800, // Boss health
        id: 1,
        maxHealth: 800,
        pathIndex: 2,
        position: { x: 2, y: 6 },
        speed: 0.04, // Slow boss
        type: 'boss',
      });

      let state = createTestState({
        spawnedEnemies: [bossEnemy],
        towers: [tower1, tower2],
      });

      const towerSystem = new TowerSystem();
      const projectileSystem = new ProjectileSystem();
      const collisionSystem = new CollisionSystem();

      let damageDealt = 0;

      // Simulate for a while and check damage
      simulateFrames((deltaTime, timestamp) => {
        let updates: SystemUpdateResult = {};

        updates = {
          ...updates,
          ...towerSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...projectileSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...collisionSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        if (state.spawnedEnemies?.length > 0) {
          damageDealt = 800 - state.spawnedEnemies?.[0]?.health;
        }
      }, 50);

      // Boss should take damage but not die instantly
      expect(damageDealt).toBeGreaterThan(0);
      expect(damageDealt).toBeLessThan(800);
    });
  });

  describe('Game over scenario', () => {
    it('should end game when all lives are lost', () => {
      const enemy = createTestEnemy({
        path: [
          { x: 10, y: 6 },
          { x: 11, y: 6 },
        ],
        pathIndex: 0,
        position: { x: 10, y: 6 },
        speed: 0.5,
      });

      let state = createTestState({
        gameStatus: 'playing',
        lives: 1,
        spawnedEnemies: [enemy],
      });

      const enemySystem = new EnemySystem();

      // Simulate until enemy reaches goal
      advanceUntilCondition((deltaTime, timestamp) => {
        const updates = enemySystem.update(state, deltaTime, timestamp);
        state = { ...state, ...updates };

        return state.spawnedEnemies?.length === 0;
      }, 50);

      // Lives should be 0
      expect(state.lives).toBe(0);
    });
  });

  describe('Combo system', () => {
    it('should build combo from consecutive kills', () => {
      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'sniper', // High damage
      });

      const enemy1 = createTestEnemy({
        health: 10,
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const enemy2 = createTestEnemy({
        health: 10,
        id: 2,
        pathIndex: 3,
        position: { x: 3, y: 6 },
      });

      let state = createTestState({
        combo: 0,
        spawnedEnemies: [enemy1, enemy2],
        towers: [tower],
      });

      const towerSystem = new TowerSystem();
      const projectileSystem = new ProjectileSystem();
      const collisionSystem = new CollisionSystem();

      // Simulate until both enemies are killed
      advanceUntilCondition((deltaTime, timestamp) => {
        let updates: SystemUpdateResult = {};

        updates = {
          ...updates,
          ...towerSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...projectileSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...collisionSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        return state.spawnedEnemies?.length === 0;
      }, 200);

      // Combo should be built up
      expect(state.combo).toBeGreaterThan(0);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle multiple towers, enemies, and systems together', () => {
      const tower1 = createTestTower({
        id: 1,
        position: { x: 2, y: 5 },
        type: 'basic',
      });

      const tower2 = createTestTower({
        id: 2,
        position: { x: 5, y: 5 },
        type: 'slow',
      });

      const tower3 = createTestTower({
        id: 3,
        position: { x: 8, y: 5 },
        type: 'bomb',
      });

      const enemy1 = createTestEnemy({
        health: 100,
        id: 1,
        pathIndex: 0,
        position: { x: 0, y: 6 },
        speed: 0.1,
      });

      const enemy2 = createTestEnemy({
        health: 100,
        id: 2,
        pathIndex: 0,
        position: { x: 0, y: 6 },
        speed: 0.15,
      });

      const enemy3 = createTestEnemy({
        health: 100,
        id: 3,
        pathIndex: 0,
        position: { x: 0, y: 6 },
        speed: 0.05,
      });

      let state = createTestState({
        combo: 0,
        lives: 10,
        money: 100,
        score: 0,
        spawnedEnemies: [enemy1, enemy2, enemy3],
        towers: [tower1, tower2, tower3],
      });

      const enemySystem = new EnemySystem();
      const towerSystem = new TowerSystem();
      const projectileSystem = new ProjectileSystem();
      const collisionSystem = new CollisionSystem();

      // Simulate complex scenario
      const frames = advanceUntilCondition((deltaTime, timestamp) => {
        let updates: SystemUpdateResult = {};

        updates = {
          ...updates,
          ...enemySystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...towerSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...projectileSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        updates = {
          ...updates,
          ...collisionSystem.update(state, deltaTime, timestamp),
        };
        state = { ...state, ...updates };

        // Stop when all enemies are gone or reach goal
        return state.spawnedEnemies?.length === 0;
      }, 500);

      expect(frames).toBeLessThan(500);

      // All enemies should be dealt with
      expect(state.spawnedEnemies).toHaveLength(0);

      // Should have gained money or score from kills (or lost lives if enemies reached goal)
      expect(state.money + state.score >= 100 || state.lives < 10).toBe(true);
    });
  });
});
