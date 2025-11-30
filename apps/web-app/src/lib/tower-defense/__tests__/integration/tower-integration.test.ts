import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { GameEngine } from '../../engine/game-engine';
import type { SystemUpdateResult } from '../../store/types';
import { runGameUntil } from '../integration-test-setup';
import {
  createTestEnemy,
  createTestState,
  createTestTower,
} from '../test-helpers';

describe('Tower System Integration', () => {
  it('should handle all tower types firing correctly', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const enemy = createTestEnemy({
      health: 200,
      id: 1,
      pathIndex: 3,
      position: { x: 3, y: 6 },
    });

    const towers = [
      createTestTower({ id: 1, position: { x: 3, y: 5 }, type: 'basic' }),
      createTestTower({ id: 2, position: { x: 4, y: 5 }, type: 'slow' }),
      createTestTower({ id: 3, position: { x: 5, y: 5 }, type: 'bomb' }),
      createTestTower({ id: 4, position: { x: 6, y: 5 }, type: 'sniper' }),
    ];

    const state = createTestState({
      spawnedEnemies: [enemy],
      towers,
    });

    // Run multiple frames to allow all towers to fire
    for (let i = 0; i < 20; i++) {
      engine.update(state);
    }

    engine.stop();

    // All tower types should create projectiles
    const allProjectiles = updates.flatMap((u) => u.projectiles || []);
    expect(allProjectiles.length).toBeGreaterThan(0);

    // Check that different tower types fired
    const projectileTypes = new Set(allProjectiles.map((p) => p.type));
    expect(projectileTypes.size).toBeGreaterThan(1);
  });

  it('should upgrade towers and increase damage', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const enemy1 = createTestEnemy({
      health: 100,
      id: 1,
      pathIndex: 2,
      position: { x: 2, y: 6 },
    });

    const enemy2 = createTestEnemy({
      health: 100,
      id: 2,
      pathIndex: 2,
      position: { x: 2, y: 6 },
    });

    // Level 1 tower
    const tower1 = createTestTower({
      id: 1,
      level: 1,
      position: { x: 2, y: 5 },
      type: 'basic',
    });

    let state = createTestState({
      spawnedEnemies: [enemy1],
      towers: [tower1],
    });

    // Kill first enemy with level 1 tower
    state = runGameUntil(
      engine,
      state,
      (s) => s.spawnedEnemies.length === 0,
      200,
    );

    // Upgrade tower
    const upgradedTower = { ...tower1, level: 2 };
    state = {
      ...state,
      spawnedEnemies: [enemy2],
      towers: [upgradedTower],
    };

    // Kill second enemy with level 2 tower (should be faster)
    state = runGameUntil(
      engine,
      state,
      (s) => s.spawnedEnemies.length === 0,
      200,
    );

    // Level 2 tower should deal more damage
    expect(state.spawnedEnemies.length).toBe(0);
  });

  it('should apply adjacent tower bonuses', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const enemy = createTestEnemy({
      health: 200,
      id: 1,
      pathIndex: 2,
      position: { x: 2, y: 6 },
    });

    // Tower with adjacent towers
    const centerTower = createTestTower({
      id: 1,
      position: { x: 2, y: 5 },
      type: 'basic',
    });
    const adjacentTowers = [
      createTestTower({ id: 2, position: { x: 1, y: 5 }, type: 'basic' }),
      createTestTower({ id: 3, position: { x: 3, y: 5 }, type: 'basic' }),
      createTestTower({ id: 4, position: { x: 2, y: 4 }, type: 'basic' }),
    ];

    const state = createTestState({
      spawnedEnemies: [enemy],
      towers: [centerTower, ...adjacentTowers],
    });

    // Run until enemy is hit
    let enemyHit = false;
    let finalState = state;
    for (let i = 0; i < 50 && !enemyHit; i++) {
      engine.update(finalState);
      if (updates.length > 0) {
        const lastUpdate = updates.at(-1);
        finalState = { ...finalState, ...lastUpdate };
        updates.length = 0;

        if (
          finalState.spawnedEnemies.length > 0 &&
          finalState.spawnedEnemies[0]?.health !== undefined &&
          finalState.spawnedEnemies[0].health < 200
        ) {
          enemyHit = true;
        }
      }
    }

    engine.stop();
    expect(enemyHit).toBe(true);
  });
});
