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

describe('Combo System Integration', () => {
  it('should build combo from consecutive kills', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const enemies: Enemy[] = [
      createTestEnemy({
        health: 10,
        id: 1,
        pathIndex: 2,
        position: { x: 2, y: 6 },
      }),
      createTestEnemy({
        health: 10,
        id: 2,
        pathIndex: 3,
        position: { x: 3, y: 6 },
      }),
      createTestEnemy({
        health: 10,
        id: 3,
        pathIndex: 4,
        position: { x: 4, y: 6 },
      }),
    ];

    const tower = createTestTower({
      id: 1,
      position: { x: 3, y: 5 },
      type: 'sniper',
    });

    let state = createTestState({
      combo: 0,
      lastKillTime: 0,
      spawnedEnemies: enemies,
      towers: [tower],
    });

    // Run until all enemies are killed quickly
    state = runGameUntil(
      engine,
      state,
      (s) => s.spawnedEnemies.length === 0,
      500,
    );

    engine.stop();

    // Combo should be built
    expect(state.combo).toBeGreaterThan(0);
  });

  it('should reset combo after timeout', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const state = createTestState({
      combo: 10,
      lastKillTime: Date.now() - 3000, // 3 seconds ago
    });

    // Update should reset combo
    engine.update(state);
    engine.stop();

    // Combo should be reset
    const comboUpdate = updates.find((u) => u.combo === 0);
    expect(comboUpdate).toBeDefined();
  });
});
