import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { GameEngine } from '../../engine/game-engine';
import type { Enemy, Tower } from '../../game-types';
import type { SystemUpdateResult } from '../../store/types';
import {
  createTestEnemy,
  createTestState,
  createTestTower,
} from '../test-helpers';

describe('Performance and Stress Tests', () => {
  it('should handle many enemies simultaneously', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    // Create many enemies
    const enemies: Enemy[] = [];
    for (let i = 0; i < 50; i++) {
      enemies.push(
        createTestEnemy({
          health: 100,
          id: i + 1,
          pathIndex: 0,
          position: { x: 0, y: 6 },
        }),
      );
    }

    const towers: Tower[] = [];
    for (let i = 0; i < 10; i++) {
      towers.push(
        createTestTower({
          id: i + 1,
          position: { x: 2 + (i % 5), y: 4 + Math.floor(i / 5) },
          type: 'basic',
        }),
      );
    }

    const state = createTestState({
      spawnedEnemies: enemies,
      towers,
    });

    // Run multiple frames
    for (let i = 0; i < 100; i++) {
      engine.update(state);
    }

    engine.stop();

    // Should process all enemies
    expect(updates.length).toBeGreaterThan(0);
  });

  it('should handle many projectiles simultaneously', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const enemies: Enemy[] = [];
    for (let i = 0; i < 20; i++) {
      enemies.push(
        createTestEnemy({
          health: 100,
          id: i + 1,
          pathIndex: 2 + i,
          position: { x: 2 + i, y: 6 },
        }),
      );
    }

    const towers: Tower[] = [];
    for (let i = 0; i < 15; i++) {
      towers.push(
        createTestTower({
          id: i + 1,
          position: { x: 2 + (i % 5), y: 4 + Math.floor(i / 5) },
          type: 'basic',
        }),
      );
    }

    const state = createTestState({
      spawnedEnemies: enemies,
      towers,
    });

    // Run multiple frames to generate projectiles
    let totalProjectiles = 0;
    for (let i = 0; i < 50; i++) {
      engine.update(state);
      if (updates.length > 0) {
        const lastUpdate = updates.at(-1);
        if (lastUpdate) {
          totalProjectiles += lastUpdate.projectiles?.length || 0;
        }
        updates.length = 0;
      }
    }

    engine.stop();

    // Should create many projectiles
    expect(totalProjectiles).toBeGreaterThan(0);
  });
});
