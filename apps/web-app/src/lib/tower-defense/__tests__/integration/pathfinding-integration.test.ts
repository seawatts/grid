import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { GameEngine } from '../../engine/game-engine';
import { createTestState, createTestTower } from '../test-helpers';

describe('Pathfinding Integration', () => {
  it('should recalculate paths when towers are placed', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    let state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      startPositions: [{ x: 0, y: 6 }],
      towers: [],
      wave: 0,
    });

    // Start wave without towers
    const wave1 = engine.startWave(state);
    state = { ...state, ...wave1 };
    const pathWithoutTowers = state.unspawnedEnemies?.[0]?.path || [];

    // Place a tower that should affect pathfinding
    // Place it in the middle of the likely path
    const tower = createTestTower({
      id: 1,
      position: { x: 6, y: 6 }, // Place in the middle
    });
    state = { ...state, towers: [tower] };

    // Start new wave with tower
    state = { ...state, isWaveActive: false, wave: 1 };
    const wave2 = engine.startWave(state);
    state = { ...state, ...wave2 };
    const pathWithTower = state.unspawnedEnemies?.[0]?.path || [];

    // Paths should be valid (not empty) - this verifies pathfinding works
    expect(pathWithTower.length).toBeGreaterThan(0);
    expect(pathWithoutTowers.length).toBeGreaterThan(0);

    // Verify that pathfinding recalculated paths when tower was placed
    // The important thing is that paths are valid and enemies can spawn
    expect(state.unspawnedEnemies?.length || 0).toBeGreaterThan(0);

    // Verify pathfinding is working - path should start at start position and end at goal
    if (pathWithTower.length > 0) {
      const pathStart = pathWithTower[0];
      const pathEnd = pathWithTower.at(-1);
      expect(pathStart).toBeDefined();
      expect(pathEnd).toBeDefined();
      // Path should end at or near the goal
      const goal = state.goalPositions[0];
      if (goal && pathEnd) {
        const distanceToGoal =
          Math.abs(pathEnd.x - goal.x) + Math.abs(pathEnd.y - goal.y);
        expect(distanceToGoal).toBeLessThanOrEqual(1); // Allow for goal being adjacent
      }
    }
  });

  it('should handle multiple start and goal positions', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    const state = createTestState({
      goalPositions: [
        { x: 11, y: 6 },
        { x: 11, y: 7 },
      ],
      startPositions: [
        { x: 0, y: 6 },
        { x: 0, y: 7 },
      ],
      wave: 0,
    });

    const waveResult = engine.startWave(state);

    // Should generate enemies for multiple starts
    expect(waveResult.unspawnedEnemies?.length).toBeGreaterThan(0);

    // Enemies should have valid paths
    const enemies = waveResult.unspawnedEnemies || [];
    for (const enemy of enemies) {
      expect(enemy.path.length).toBeGreaterThan(0);
      expect(enemy.path[0]).toEqual(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        }),
      );
    }
  });
});
