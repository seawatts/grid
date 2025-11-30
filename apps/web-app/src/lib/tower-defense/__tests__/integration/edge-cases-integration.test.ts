import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { GameEngine } from '../../engine/game-engine';
import type { SystemUpdateResult } from '../../store/types';
import { createTestEnemy, createTestState } from '../test-helpers';

describe('Edge Cases Integration', () => {
  it('should handle empty state gracefully', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);
    engine.start();

    const state = createTestState({
      spawnedEnemies: [],
      towers: [],
    });

    // Should not crash
    engine.update(state);
    engine.stop();

    expect(state).toBeDefined();
  });

  it('should handle enemies with no path', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const enemy = createTestEnemy({
      health: 100,
      id: 1,
      path: [],
      pathIndex: 0,
      position: { x: 5, y: 5 },
    });

    const state = createTestState({
      spawnedEnemies: [enemy],
    });

    // Should not crash
    engine.update(state);
    engine.stop();

    expect(state).toBeDefined();
  });

  it('should handle paused game state', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const enemy = createTestEnemy();
    const state = createTestState({
      isPaused: true,
      spawnedEnemies: [enemy],
    });

    // Should not update when paused
    engine.update(state);
    engine.stop();

    // Should not receive updates
    expect(updates.length).toBe(0);
  });
});
