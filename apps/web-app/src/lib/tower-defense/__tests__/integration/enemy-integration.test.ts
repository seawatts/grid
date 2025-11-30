import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { GameEngine } from '../../engine/game-engine';
import type { Enemy } from '../../game-types';
import type { SystemUpdateResult } from '../../store/types';
import { runGameUntil } from '../integration-test-setup';
import {
  createTestEnemy,
  createTestState,
  createTestTower,
} from '../test-helpers';

describe('Enemy System Integration', () => {
  it('should handle all enemy types correctly', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const enemies: Enemy[] = [
      createTestEnemy({
        health: 100,
        id: 1,
        pathIndex: 0,
        position: { x: 0, y: 6 },
        speed: 0.1,
        type: 'basic',
      }),
      createTestEnemy({
        health: 50,
        id: 2,
        pathIndex: 0,
        position: { x: 0, y: 6 },
        speed: 0.18,
        type: 'fast',
      }),
      createTestEnemy({
        health: 300,
        id: 3,
        pathIndex: 0,
        position: { x: 0, y: 6 },
        speed: 0.06,
        type: 'tank',
      }),
      createTestEnemy({
        health: 800,
        id: 4,
        pathIndex: 0,
        position: { x: 0, y: 6 },
        speed: 0.04,
        type: 'boss',
      }),
    ];

    const tower = createTestTower({
      id: 1,
      position: { x: 5, y: 5 },
      type: 'sniper',
    });

    const state = createTestState({
      spawnedEnemies: enemies,
      towers: [tower],
    });

    // Run multiple frames
    for (let i = 0; i < 100; i++) {
      engine.update(state);
    }

    engine.stop();

    // All enemy types should be processed
    expect(updates.length).toBeGreaterThan(0);
  });

  it('should lose lives when enemies reach goal', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

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
      lives: 10,
      spawnedEnemies: [enemy],
    });

    // Run until enemy reaches goal
    state = runGameUntil(
      engine,
      state,
      (s) => s.spawnedEnemies.length === 0,
      100,
    );

    engine.stop();

    // Should lose a life
    expect(state.lives).toBe(9);
  });

  it('should handle slow effect from slow towers', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const fastEnemy = createTestEnemy({
      health: 50,
      id: 1,
      pathIndex: 0,
      position: { x: 0, y: 6 },
      speed: 0.18,
      type: 'fast',
    });

    const slowTower = createTestTower({
      id: 1,
      position: { x: 2, y: 5 },
      type: 'slow',
    });

    let state = createTestState({
      spawnedEnemies: [fastEnemy],
      towers: [slowTower],
    });

    // Run until enemy is hit by slow tower
    let enemySlowed = false;
    for (let i = 0; i < 100 && !enemySlowed; i++) {
      engine.update(state);
      if (updates.length > 0) {
        const lastUpdate = updates.at(-1);
        state = { ...state, ...lastUpdate };
        updates.length = 0;

        if (
          state.spawnedEnemies.length > 0 &&
          state.spawnedEnemies[0]?.slowed
        ) {
          enemySlowed = true;
        }
      }
    }

    engine.stop();
    expect(enemySlowed).toBe(true);
  });
});
