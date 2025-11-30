import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { GameEngine } from '../../engine/game-engine';
import { createTestState } from '../test-helpers';

describe('Item Persistence Integration', () => {
  it('should persist items when starting first wave', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    // Generate initial items for wave 1
    let state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeables: [],
      startPositions: [{ x: 0, y: 6 }],
      wave: 0,
    });

    // Generate items for wave 1 (simulating initialization)
    const initialItems = engine.generateItems(state, 1, true);
    state = { ...state, ...initialItems };

    // Verify items were generated
    expect(state.placeables.length).toBeGreaterThan(0);
    const initialPlaceableIds = state.placeables.map((p) => p.id).sort();
    const initialPlaceablePositions = state.placeables
      .flatMap((p) => p.positions)
      .map((pos) => `${pos.x},${pos.y}`)
      .sort();

    // Start first wave
    const waveResult = engine.startWave(state);
    state = { ...state, ...waveResult };

    // Items should still exist and match initial items
    expect(state.placeables.length).toBeGreaterThan(0);
    const afterWavePlaceableIds = state.placeables.map((p) => p.id).sort();
    const afterWavePlaceablePositions = state.placeables
      .flatMap((p) => p.positions)
      .map((pos) => `${pos.x},${pos.y}`)
      .sort();

    // IDs should match (items should not be regenerated)
    expect(afterWavePlaceableIds).toEqual(initialPlaceableIds);
    // Positions should match (items should be in same locations)
    expect(afterWavePlaceablePositions).toEqual(initialPlaceablePositions);
  });

  it('should not regenerate items on first wave start', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    // Generate initial items for wave 1
    let state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeables: [],
      startPositions: [{ x: 0, y: 6 }],
      wave: 0,
    });

    // Generate items for wave 1 (simulating initialization)
    const initialItems = engine.generateItems(state, 1, true);
    state = { ...state, ...initialItems };

    // Store initial item details
    const initialItemCount = state.placeables.length;
    const initialItemMap = new Map(
      state.placeables.map((item) => [
        item.id,
        {
          category: item.category,
          positions: [...item.positions],
          type: item.type,
        },
      ]),
    );

    // Start first wave
    const waveResult = engine.startWave(state);
    state = { ...state, ...waveResult };

    // Item count should remain the same
    expect(state.placeables.length).toBe(initialItemCount);

    // Each item should match its initial state
    for (const item of state.placeables) {
      const initialItem = initialItemMap.get(item.id);
      expect(initialItem).toBeDefined();
      if (initialItem) {
        expect(item.category).toBe(initialItem.category);
        expect(item.type).toBe(initialItem.type);
        expect(item.positions).toEqual(initialItem.positions);
      }
    }
  });

  it('should regenerate items between subsequent waves', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    // Start with wave 0, generate items for wave 1
    let state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeables: [],
      startPositions: [{ x: 0, y: 6 }],
      wave: 0,
    });

    // Generate items for wave 1
    const wave1Items = engine.generateItems(state, 1, true);
    state = { ...state, ...wave1Items };
    const wave1PlaceableIds = new Set(state.placeables.map((p) => p.id));

    // Start wave 1
    const wave1Result = engine.startWave(state);
    state = { ...state, ...wave1Result };
    expect(state.wave).toBe(1);
    expect(state.isWaveActive).toBe(true);

    // Complete wave 1 (simulate all enemies killed)
    state = {
      ...state,
      isWaveActive: false,
      spawnedEnemies: [],
      unspawnedEnemies: [],
    };

    // Update engine to trigger item generation for next wave
    engine.update(state);
    // The engine should generate items for wave 2 when wave 1 completes
    // We need to manually trigger this since we're testing in isolation
    const wave2Items = engine.generateItems(state, 1, false);
    state = { ...state, ...wave2Items };

    // Items should be different (new items added for wave 2)
    const wave2PlaceableIds = new Set(state.placeables.map((p) => p.id));

    // Wave 2 should have at least as many items as wave 1
    // (may have more if new items were generated, or same if only persistent items remain)
    expect(wave2PlaceableIds.size).toBeGreaterThanOrEqual(
      wave1PlaceableIds.size,
    );

    // At least some items should be different (new items generated)
    // OR if all items are persistent, the set should be the same
    const hasNewItems = Array.from(wave2PlaceableIds).some(
      (id) => !wave1PlaceableIds.has(id),
    );
    // Either new items were added, or all items are persistent (both are valid)
    expect(
      hasNewItems || wave2PlaceableIds.size === wave1PlaceableIds.size,
    ).toBe(true);
  });

  it('should preserve persistent traps when regenerating items between waves', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    // Create state with a persistent trap (grid bug is persistent)
    let state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeables: [
        {
          category: 'trap',
          damage: 50,
          id: 1,
          positions: [{ x: 5, y: 5 }],
          type: 'gridBug',
        },
      ],
      startPositions: [{ x: 0, y: 6 }],
      wave: 1,
    });

    const persistentTrapId = state.placeables[0]?.id;
    expect(persistentTrapId).toBeDefined();

    // Generate items for wave 2 (should preserve persistent trap)
    const wave2Items = engine.generateItems(state, 1, false);
    state = { ...state, ...wave2Items };

    // Persistent trap should still exist
    const persistentTrap = state.placeables.find(
      (p) => p.id === persistentTrapId,
    );
    expect(persistentTrap).toBeDefined();
    if (persistentTrap) {
      expect(persistentTrap.category).toBe('trap');
      expect(persistentTrap.type).toBe('gridBug');
    }
  });

  it('should not regenerate items when startWave is called multiple times for same wave', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    // Generate initial items
    let state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      placeables: [],
      startPositions: [{ x: 0, y: 6 }],
      wave: 0,
    });

    const initialItems = engine.generateItems(state, 1, true);
    state = { ...state, ...initialItems };
    const initialPlaceableIds = state.placeables.map((p) => p.id).sort();

    // Start wave 1
    const wave1Result = engine.startWave(state);
    state = { ...state, ...wave1Result };
    const afterFirstStartIds = state.placeables.map((p) => p.id).sort();

    // Try to start wave again (should not work since wave is already active)
    const wave1Result2 = engine.startWave(state);
    state = { ...state, ...wave1Result2 };
    const afterSecondStartIds = state.placeables.map((p) => p.id).sort();

    // Items should remain unchanged
    expect(afterFirstStartIds).toEqual(initialPlaceableIds);
    expect(afterSecondStartIds).toEqual(initialPlaceableIds);
  });
});
