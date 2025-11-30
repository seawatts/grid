import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { GameEngine } from '../../engine/game-engine';
import type { PlaceableItem } from '../../game-types';
import type { SystemUpdateResult } from '../../store/types';
import { runGameUntil } from '../integration-test-setup';
import { createTestEnemy, createTestState } from '../test-helpers';

describe('Item System Integration', () => {
  it('should generate placeables for new waves', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    const state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeables: [],
      startPositions: [{ x: 0, y: 6 }],
      wave: 0,
    });

    const result = engine.startWave(state);

    // Should generate placeables
    expect(result.placeables).toBeDefined();
    expect(result.placeables?.length).toBeGreaterThan(0);
  });

  it('should handle placeable items on paths', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    // Create a landmine on the path
    const landmine: PlaceableItem = {
      category: 'trap',
      damage: 50,
      id: 1,
      positions: [{ x: 5, y: 6 }],
      type: 'landmine',
    };

    const enemy = createTestEnemy({
      health: 100,
      id: 1,
      pathIndex: 4,
      position: { x: 4, y: 6 },
    });

    let state = createTestState({
      placeables: [landmine],
      spawnedEnemies: [enemy],
    });

    // Run until enemy hits landmine
    state = runGameUntil(
      engine,
      state,
      (s) =>
        s.spawnedEnemies.length === 0 ||
        (s.spawnedEnemies[0]?.health ?? 100) < 100,
      200,
    );

    engine.stop();

    // Enemy should take damage from landmine
    if (state.spawnedEnemies.length > 0 && state.spawnedEnemies[0]) {
      expect(state.spawnedEnemies[0].health).toBeLessThan(100);
    }
  });
});
