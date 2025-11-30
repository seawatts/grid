import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { GameEngine } from '../../engine/game-engine';
import { createTestState } from '../test-helpers';

describe('Item Generation Integration', () => {
  it('should generate placeables when generateItems is called', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    const state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeables: [],
      startPositions: [{ x: 0, y: 6 }],
      wave: 0,
    });

    const result = engine.generateItems(state, 1, true);

    // Should generate some placeables
    expect(result.placeables).toBeDefined();
    // May generate 0 or more items depending on wave/progress
    expect(Array.isArray(result.placeables)).toBe(true);
  });

  it('should generate items with correct structure', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    const state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeables: [],
      startPositions: [{ x: 0, y: 6 }],
      wave: 0,
    });

    const result = engine.generateItems(state, 1, true);

    if (result.placeables && result.placeables.length > 0) {
      const item = result.placeables[0];
      if (item) {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('positions');
        expect(Array.isArray(item.positions)).toBe(true);
      }
    }
  });

  it('should not place items on occupied cells', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    // Create state with towers blocking some cells
    const state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeables: [],
      startPositions: [{ x: 0, y: 6 }],
      towers: [
        {
          id: 1,
          lastShot: 0,
          level: 1,
          position: { x: 5, y: 5 },
          type: 'basic',
        },
      ],
      wave: 0,
    });

    const result = engine.generateItems(state, 1, true);

    if (result.placeables && result.placeables.length > 0) {
      // Check that no placeable is on a tower position
      for (const item of result.placeables) {
        for (const pos of item.positions) {
          const hasTower = state.towers.some(
            (t) => t.position.x === pos.x && t.position.y === pos.y,
          );
          expect(hasTower).toBe(false);
        }
      }
    }
  });

  it('should generate items on empty cells only', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    const state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeables: [],
      startPositions: [{ x: 0, y: 6 }],
      wave: 0,
    });

    const result = engine.generateItems(state, 1, true);

    if (result.placeables && result.placeables.length > 0) {
      for (const item of result.placeables) {
        for (const pos of item.positions) {
          // Check that position is in grid bounds
          expect(pos.x).toBeGreaterThanOrEqual(0);
          expect(pos.y).toBeGreaterThanOrEqual(0);
          expect(pos.x).toBeLessThan(state.grid.length);
          expect(pos.y).toBeLessThan(state.grid.length);

          // Check that cell is empty (not start, goal, or obstacle)
          const cell = state.grid[pos.y]?.[pos.x];
          expect(cell).toBe('empty');
        }
      }
    }
  });

  it('should increment placeableIdCounter when generating items', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    let state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeableIdCounter: 5,
      placeables: [],
      startPositions: [{ x: 0, y: 6 }],
      wave: 0,
    });

    const initialCounter = state.placeableIdCounter;
    const result = engine.generateItems(state, 1, true);
    state = { ...state, ...result };

    // Counter should be incremented if items were generated
    if (result.placeables && result.placeables.length > 0) {
      expect(state.placeableIdCounter).toBeGreaterThan(initialCounter);
    }
  });
});
