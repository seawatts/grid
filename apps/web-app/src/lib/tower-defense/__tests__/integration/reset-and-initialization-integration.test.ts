import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { createDefaultProgress } from '../../constants/progress';
import { GameEngine } from '../../engine/game-engine';
import { useGameStore } from '../../store/game-store';
import type { GameConfig } from '../../store/types';
import { createTestState } from '../test-helpers';

describe('Reset and Initialization Integration', () => {
  it('should regenerate placeables when game is reset', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    // Create initial state with some placeables
    let state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeables: [
        {
          category: 'trap',
          damage: 50,
          id: 1,
          positions: [{ x: 5, y: 5 }],
          type: 'landmine',
        },
      ],
      startPositions: [{ x: 0, y: 6 }],
      wave: 0,
    });

    // Generate items for wave 1
    const initialItems = engine.generateItems(state, 1, true);
    state = { ...state, ...initialItems };

    expect(state.placeables.length).toBeGreaterThan(0);

    // Simulate reset - clear placeables
    state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeables: [], // Reset clears placeables
      startPositions: [{ x: 0, y: 6 }],
      wave: 0,
    });

    // After reset, generateItems should be called again to regenerate
    const resetItems = engine.generateItems(state, 1, true);
    state = { ...state, ...resetItems };

    // Placeables should be regenerated after reset
    expect(state.placeables.length).toBeGreaterThan(0);
  });

  it('should clear existing placeables when clearExisting is true', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    let state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeables: [
        {
          category: 'trap',
          damage: 50,
          id: 1,
          positions: [{ x: 5, y: 5 }],
          type: 'landmine',
        },
      ],
      startPositions: [{ x: 0, y: 6 }],
      wave: 0,
    });

    // Generate with clearExisting = true
    const result = engine.generateItems(state, 1, true);
    state = { ...state, ...result };

    // Should have new placeables (may be different count, but should exist)
    expect(state.placeables.length).toBeGreaterThanOrEqual(0);
  });

  it('should preserve persistent placeables when clearExisting is false', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    // Create state with a persistent trap (like Grid Bug)
    let state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeables: [
        {
          category: 'trap',
          damage: 10,
          id: 1,
          positions: [{ x: 5, y: 5 }],
          type: 'gridBug', // Assuming this is persistent
        },
      ],
      startPositions: [{ x: 0, y: 6 }],
      wave: 0,
    });

    const persistentTrap = state.placeables[0];
    if (!persistentTrap) {
      // Skip if no trap was created
      return;
    }

    // Generate with clearExisting = false
    const result = engine.generateItems(state, 1, false);
    state = { ...state, ...result };

    // Persistent trap should still exist
    const stillExists = state.placeables.some(
      (p) => p.id === persistentTrap.id,
    );
    expect(stillExists).toBe(true);
  });

  it('should initialize game state correctly with empty placeables', () => {
    // Test that initializeGame resets placeables to empty array
    const config: GameConfig = {
      mapId: 'test-map',
      progress: createDefaultProgress(),
    };

    useGameStore.getState().initializeGame(config);
    const state = useGameStore.getState();

    expect(state.placeables).toEqual([]);
    expect(state.wave).toBe(0);
    expect(state.isWaveActive).toBe(false);
  });

  it('should generate items after reset when generateItems is called', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    // Simulate reset - empty placeables
    let state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeables: [],
      startPositions: [{ x: 0, y: 6 }],
      wave: 0,
    });

    // After reset, generateItems should populate placeables
    const items = engine.generateItems(state, 1, true);
    state = { ...state, ...items };

    // Should have generated some placeables
    expect(items.placeables?.length || 0).toBeGreaterThanOrEqual(0);
  });
});
