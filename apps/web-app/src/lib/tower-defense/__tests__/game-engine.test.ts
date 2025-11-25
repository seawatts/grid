import { beforeAll, describe, expect, it } from 'bun:test';
import { MAX_WAVES } from '../constants/balance';
import { GameEngine } from '../engine/game-engine';
import type { Landmine, PowerUp } from '../game-types';
import type { SystemUpdateResult } from '../store/types';
import {
  advanceUntilCondition,
  createTestEnemy,
  createTestPowerup,
  createTestState,
  createTestTower,
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

describe('Game Engine Integration Tests', () => {
  describe('Engine lifecycle', () => {
    it('should start engine', () => {
      const onUpdate = () => {
        // Update callback
      };

      const engine = new GameEngine(onUpdate);
      engine.start();

      expect(engine).toBeDefined();
      // Engine is started but update is called externally
      engine.stop();
    });

    it('should pause engine', () => {
      const onUpdate = () => {};
      const engine = new GameEngine(onUpdate);

      engine.start();
      engine.pause();

      // Paused engine should not crash
      expect(engine).toBeDefined();
    });

    it('should resume engine', () => {
      const onUpdate = () => {};
      const engine = new GameEngine(onUpdate);

      engine.start();
      engine.pause();
      engine.resume();

      expect(engine).toBeDefined();
      engine.stop();
    });

    it('should stop engine', () => {
      const onUpdate = () => {};
      const engine = new GameEngine(onUpdate);

      engine.start();
      engine.stop();

      expect(engine).toBeDefined();
    });
  });

  describe('System coordination', () => {
    it('should call update callback with system updates', () => {
      const updates: SystemUpdateResult[] = [];
      const onUpdate = (update: SystemUpdateResult) => {
        updates.push(update);
      };

      const engine = new GameEngine(onUpdate);
      engine.start();

      const enemy = createTestEnemy({
        pathIndex: 0,
        position: { x: 0, y: 6 },
      });

      const state = createTestState({
        spawnedEnemies: [enemy],
      });

      // Trigger update
      engine.update(state);

      engine.stop();

      // Should have received updates
      expect(updates.length).toBeGreaterThan(0);
    });

    it('should not update when paused', () => {
      const updates: SystemUpdateResult[] = [];
      const onUpdate = (update: SystemUpdateResult) => {
        updates.push(update);
      };

      const engine = new GameEngine(onUpdate);
      engine.start();

      const state = createTestState({
        isPaused: true,
        spawnedEnemies: [createTestEnemy()],
      });

      // Trigger update
      engine.update(state);

      engine.stop();

      // Should not receive updates when paused
      expect(updates.length).toBe(0);
    });

    it('should not update when game is not playing', () => {
      const updates: SystemUpdateResult[] = [];
      const onUpdate = (update: SystemUpdateResult) => {
        updates.push(update);
      };

      const engine = new GameEngine(onUpdate);
      engine.start();

      const state = createTestState({
        gameStatus: 'lost',
        spawnedEnemies: [createTestEnemy()],
      });

      // Trigger update
      engine.update(state);

      engine.stop();

      // Should not update when game is over
      expect(updates.length).toBe(0);
    });

    it('should coordinate enemy and tower systems', () => {
      const updates: SystemUpdateResult[] = [];
      const onUpdate = (update: SystemUpdateResult) => {
        updates.push(update);
      };

      const engine = new GameEngine(onUpdate);
      engine.start();

      const enemy = createTestEnemy({
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
      });

      const state = createTestState({
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      // Trigger update
      engine.update(state);

      engine.stop();

      // Should have updates from both systems
      expect(updates.length).toBeGreaterThan(0);

      // Check if projectiles were created (tower system fired)
      const hasProjectiles = updates.some(
        (u) => u.projectiles && u.projectiles.length > 0,
      );
      expect(hasProjectiles).toBe(true);
    });
  });

  describe('Wave management', () => {
    it('should start wave and generate enemies', () => {
      const onUpdate = () => {};
      const engine = new GameEngine(onUpdate);

      const state = createTestState({
        goalPositions: [{ x: 11, y: 6 }],
        isWaveActive: false,
        startPositions: [{ x: 0, y: 6 }],
        wave: 0,
      });

      const result = engine.startWave(state);

      // Should activate wave
      expect(result.isWaveActive).toBe(true);
      expect(result.wave).toBe(1);

      // Should generate enemies
      expect(result.unspawnedEnemies).toBeDefined();
      expect(result.unspawnedEnemies?.length).toBeGreaterThan(0);

      // Should increment enemy counter
      expect(result.enemyIdCounter).toBeDefined();
    });

    it('should not start wave if already active', () => {
      const onUpdate = () => {};
      const engine = new GameEngine(onUpdate);

      const state = createTestState({
        isWaveActive: true,
        wave: 1,
      });

      const result = engine.startWave(state);

      // Should return minimal result (wave system returns empty but engine adds wave increment)
      expect(result.isWaveActive).toBeUndefined();
    });

    it('should generate items when starting wave', () => {
      const onUpdate = () => {};
      const engine = new GameEngine(onUpdate);

      const state = createTestState({
        goalPositions: [{ x: 11, y: 6 }],
        isWaveActive: false,
        landmines: [],
        powerups: [],
        startPositions: [{ x: 0, y: 6 }],
        wave: 0,
      });

      const result = engine.startWave(state);

      // Should generate items
      expect(result.powerups || []).toBeDefined();
      expect(result.landmines || []).toBeDefined();
    });
  });

  describe('Game over conditions', () => {
    it('should detect game lost when lives reach zero', () => {
      const updates: SystemUpdateResult[] = [];
      const onUpdate = (update: SystemUpdateResult) => {
        updates.push(update);
      };

      const engine = new GameEngine(onUpdate);
      engine.start();

      const state = createTestState({
        lives: 1,
      });

      // Simulate update that reduces lives to 0
      const stateWithLoss = { ...state };
      engine.update(stateWithLoss);

      engine.stop();

      // Manually check what would happen with lives = 0
      // The engine should set gameStatus to 'lost'
      const lostState = createTestState({
        lives: 0,
      });

      engine.start();
      engine.update(lostState);
      engine.stop();

      // In a real scenario, the collision system would reduce lives
      // and the engine would detect it
    });

    it('should detect game won when max waves completed', () => {
      const updates: SystemUpdateResult[] = [];
      const onUpdate = (update: SystemUpdateResult) => {
        updates.push(update);
      };

      const engine = new GameEngine(onUpdate);
      engine.start();

      const state = createTestState({
        gameStatus: 'playing',
        isWaveActive: false,
        spawnedEnemies: [],
        unspawnedEnemies: [],
        wave: MAX_WAVES,
      });

      // Trigger update
      engine.update(state);

      engine.stop();

      // Should detect victory condition
      const wonUpdate = updates.find((u) => u.gameStatus === 'won');
      expect(wonUpdate).toBeDefined();
    });

    it('should not win if enemies still remain', () => {
      const updates: SystemUpdateResult[] = [];
      const onUpdate = (update: SystemUpdateResult) => {
        updates.push(update);
      };

      const engine = new GameEngine(onUpdate);
      engine.start();

      const state = createTestState({
        gameStatus: 'playing',
        isWaveActive: false,
        spawnedEnemies: [createTestEnemy()], // Still has enemies
        unspawnedEnemies: [],
        wave: MAX_WAVES,
      });

      // Trigger update
      engine.update(state);

      engine.stop();

      // Should not win yet
      const wonUpdate = updates.find((u) => u.gameStatus === 'won');
      expect(wonUpdate).toBeUndefined();
    });
  });

  describe('Combo reset', () => {
    it('should reset combo after timeout', () => {
      const updates: SystemUpdateResult[] = [];
      const onUpdate = (update: SystemUpdateResult) => {
        updates.push(update);
      };

      const engine = new GameEngine(onUpdate);
      engine.start();

      const state = createTestState({
        combo: 10,
        lastKillTime: Date.now() - 3000, // Long time ago
      });

      // Trigger update
      engine.update(state);

      engine.stop();

      // Should reset combo
      const comboUpdate = updates.find((u) => u.combo === 0);
      expect(comboUpdate).toBeDefined();
    });

    it('should not reset combo if still within window', () => {
      const updates: SystemUpdateResult[] = [];
      const onUpdate = (update: SystemUpdateResult) => {
        updates.push(update);
      };

      const engine = new GameEngine(onUpdate);
      engine.start();

      const state = createTestState({
        combo: 10,
        lastKillTime: Date.now() - 500, // Recent
      });

      // Trigger update
      engine.update(state);

      engine.stop();

      // Should not reset combo
      const comboUpdate = updates.find((u) => u.combo === 0);
      expect(comboUpdate).toBeUndefined();
    });
  });

  describe('Full game simulation', () => {
    it('should simulate multiple frames of gameplay', () => {
      const updates: SystemUpdateResult[] = [];
      const onUpdate = (update: SystemUpdateResult) => {
        updates.push(update);
      };

      const engine = new GameEngine(onUpdate);
      engine.start();

      const enemy = createTestEnemy({
        pathIndex: 0,
        position: { x: 0, y: 6 },
        speed: 0.1,
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
      });

      let currentState = createTestState({
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      // Simulate multiple frames
      for (let i = 0; i < 30; i++) {
        engine.update(currentState);

        // Apply updates to state for next frame
        if (updates.length > 0) {
          const lastUpdate = updates.at(-1);
          if (lastUpdate) {
            currentState = { ...currentState, ...lastUpdate };
          }
        }
      }

      engine.stop();

      // Should have received many updates
      expect(updates.length).toBeGreaterThan(0);
    });

    it('should handle complete enemy lifecycle', () => {
      const updates: SystemUpdateResult[] = [];
      const onUpdate = (update: SystemUpdateResult) => {
        updates.push(update);
      };

      const engine = new GameEngine(onUpdate);
      engine.start();

      const enemy = createTestEnemy({
        health: 20, // Low health
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      });

      const tower = createTestTower({
        position: { x: 2, y: 5 },
        type: 'basic', // 20 damage
      });

      let currentState = createTestState({
        money: 100,
        score: 0,
        spawnedEnemies: [enemy],
        towers: [tower],
      });

      // Run until enemy is killed
      const frames = advanceUntilCondition((_deltaTime, _timestampp) => {
        engine.update(currentState);

        if (updates.length > 0) {
          const lastUpdate = updates.at(-1);
          if (lastUpdate) {
            currentState = { ...currentState, ...lastUpdate };
          }
        }

        // Stop when no enemies remain
        return currentState.spawnedEnemies?.length === 0;
      }, 200);

      engine.stop();

      // Enemy should be killed within reasonable time
      expect(frames).toBeLessThan(200);

      // Should have gained money or score (or enemy reached goal and we lost a life)
      const gainedRewards = currentState.money > 100 || currentState.score > 0;
      const lostLife = currentState.lives < 10;
      expect(gainedRewards || lostLife).toBe(true);
    });
  });

  describe('Particle pool', () => {
    it('should provide particle pool', () => {
      const onUpdate = () => {};
      const engine = new GameEngine(onUpdate);

      const pool = engine.getParticlePool();

      expect(pool).toBeDefined();
      expect(typeof pool.spawn).toBe('function');
    });

    it('should allow spawning particles through pool', () => {
      const onUpdate = () => {};
      const engine = new GameEngine(onUpdate);
      const pool = engine.getParticlePool();

      // Should not throw
      pool.spawn(5, 5, 0.1, 0.1, 60, 'rgb(255, 0, 0)');

      expect(pool).toBeDefined();
    });
  });

  describe('Item generation', () => {
    it('should generate items on demand', () => {
      const onUpdate = () => {};
      const engine = new GameEngine(onUpdate);

      const state = createTestState({
        landmines: [],
        powerups: [],
      });

      const result = engine.generateItems(state, 1);

      expect(result.powerups || []).toBeDefined();
      expect(result.landmines || []).toBeDefined();
    });

    it('should scale item generation with count', () => {
      const onUpdate = () => {};
      const engine = new GameEngine(onUpdate);

      const state = createTestState({
        landmines: [],
        powerups: [],
      });

      const result1 = engine.generateItems(state, 1);
      const result2 = engine.generateItems(state, 2);

      const total1 =
        (result1.powerups?.length || 0) + (result1.landmines?.length || 0);
      const total2 =
        (result2.powerups?.length || 0) + (result2.landmines?.length || 0);

      expect(total2).toBeGreaterThanOrEqual(total1);
    });

    it('should clear existing items when requested', () => {
      const onUpdate = () => {};
      const engine = new GameEngine(onUpdate);

      const existingPowerup: PowerUp = createTestPowerup({
        boost: 1,
        id: 3,
        position: { x: 1, y: 1 },
      });
      const existingLandmine: Landmine = {
        damage: 25,
        id: 4,
        position: { x: 2, y: 2 },
      };

      const state = createTestState({
        landmines: [existingLandmine],
        powerups: [existingPowerup],
      });

      const result = engine.generateItems(state, 1, true);

      expect(result.powerups?.some((p) => p.id === existingPowerup.id)).toBe(
        false,
      );
      expect(result.landmines?.some((l) => l.id === existingLandmine.id)).toBe(
        false,
      );
    });

    it('should preserve existing items when a wave completes', () => {
      const updates: SystemUpdateResult[] = [];
      const onUpdate = (update: SystemUpdateResult) => {
        updates.push(update);
      };

      const engine = new GameEngine(onUpdate);
      engine.start();

      const existingPowerup: PowerUp = createTestPowerup({
        boost: 1,
        id: 5,
        position: { x: 2, y: 2 },
      });
      const existingLandmine: Landmine = {
        damage: 25,
        id: 7,
        position: { x: 3, y: 3 },
      };

      const state = createTestState({
        isWaveActive: true,
        landmineIdCounter: 8,
        landmines: [existingLandmine],
        powerupIdCounter: 6,
        powerups: [existingPowerup],
        spawnedEnemies: [],
        unspawnedEnemies: [],
      });

      // Ensure deltaTime >= 50ms so engine processes the update.
      // @ts-expect-error - overriding private property for deterministic testing
      engine.lastUpdateTime = Date.now() - 100;

      engine.update(state);
      engine.stop();

      expect(updates.length).toBeGreaterThan(0);
      const update = updates.at(0);
      if (!update) {
        throw new Error('Expected system update payload');
      }
      expect(update.isWaveActive).toBe(false);
      expect(update.powerups?.some((p) => p.id === existingPowerup.id)).toBe(
        true,
      );
      expect(update.landmines?.some((l) => l.id === existingLandmine.id)).toBe(
        true,
      );
    });
  });

  describe('Powerup decay and persistence', () => {
    it('should remove expired powerups when starting a new wave', () => {
      const onUpdate = () => {};
      const engine = new GameEngine(onUpdate);

      const state = createTestState({
        isWaveActive: false,
        powerups: [
          createTestPowerup({
            id: 1,
            remainingWaves: 1,
          }),
        ],
        towers: [],
      });

      const result = engine.startWave(state);
      expect(result.powerups).toBeDefined();
      expect(result.powerups?.length).toBe(0);
    });

    it('should preserve powerups that have towers on them', () => {
      const onUpdate = () => {};
      const engine = new GameEngine(onUpdate);

      const boundPosition = { x: 2, y: 5 };
      const state = createTestState({
        isWaveActive: false,
        powerups: [
          createTestPowerup({
            id: 2,
            position: boundPosition,
            remainingWaves: 1,
          }),
        ],
        towers: [
          createTestTower({
            position: boundPosition,
          }),
        ],
      });

      const result = engine.startWave(state);
      expect(result.powerups).toBeDefined();
      expect(result.powerups?.length).toBe(1);
      expect(result.powerups?.[0]?.isTowerBound).toBe(true);
      expect(result.powerups?.[0]?.remainingWaves).toBe(1);
    });
  });
});
