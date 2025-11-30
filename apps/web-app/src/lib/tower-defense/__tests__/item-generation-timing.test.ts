import { describe, expect, it } from 'bun:test';
import { ItemSystem } from '../engine/systems/item-system';
import { isPowerupItem, isTrapItem } from '../game-types';
import {
  createTestPlaceablePowerup,
  createTestPlaceableTrap,
  createTestState,
} from './test-helpers';

describe('Item Generation Timing Tests', () => {
  describe('Pre-wave item generation', () => {
    it('should allow generating items before wave starts', () => {
      const state = createTestState({
        isWaveActive: false,

        wave: 0,
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // Items should be generated even when wave is not active
      expect(result.placeables).toBeDefined();
      const powerups = result.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      const landmines = result.placeables?.filter((p) => isTrapItem(p)) ?? [];
      expect(powerups.length).toBeGreaterThan(0);
      expect(landmines.length).toBeGreaterThan(0);
    });

    it('should generate items for next wave number', () => {
      const state = createTestState({
        isWaveActive: false,

        wave: 1, // Currently on wave 1
      });

      const itemSystem = new ItemSystem();
      // Generate items for wave 2
      const result = itemSystem.generateWaveItems(state, 1);

      // Should generate items for the next wave
      const powerups = result.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      const landmines = result.placeables?.filter((p) => isTrapItem(p)) ?? [];
      expect(powerups.length).toBeGreaterThan(0);
      expect(landmines.length).toBeGreaterThan(0);
    });

    it('should allow generating items multiple times (e.g., when upgrading between waves)', () => {
      const state = createTestState({
        isWaveActive: false,

        wave: 1,
      });

      const itemSystem = new ItemSystem();

      // First generation
      const result1 = itemSystem.generateWaveItems(state, 1);
      const initialCount = result1.placeables?.length ?? 0;

      // Update state with first generation
      const updatedState = {
        ...state,
        placeables: result1.placeables || [],
      };

      // Second generation (e.g., after upgrading)
      const result2 = itemSystem.generateWaveItems(updatedState, 1);
      const finalCount = result2.placeables?.length ?? 0;

      // Should have at least as many items as before (existing ones preserved)
      expect(finalCount).toBeGreaterThanOrEqual(initialCount);
    });

    it('should clear existing items when generating for a new wave', () => {
      const existingPowerup = createTestPlaceablePowerup({
        id: 1,
        positions: [{ x: 6, y: 6 }],
      });
      const existingLandmine = createTestPlaceableTrap({
        damage: 30,
        id: 1,
        positions: [{ x: 5, y: 5 }],
      });
      const state = createTestState({
        isWaveActive: false,
        placeables: [existingLandmine, existingPowerup],
        wave: 1,
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1, true); // true = clear existing

      // Old items should be cleared, only new items present
      const hasOldPowerup = result.placeables?.some(
        (p) => isPowerupItem(p) && p.id === 1,
      );
      const hasOldLandmine = result.placeables?.some(
        (p) => isTrapItem(p) && p.id === 1,
      );

      expect(hasOldPowerup).toBe(false);
      expect(hasOldLandmine).toBe(false);
    });
  });

  describe('Item generation workflow', () => {
    it('should support workflow: generate items -> wait -> start wave', () => {
      // Step 1: Wave complete, generate items for next wave
      let state = createTestState({
        isWaveActive: false,

        wave: 1,
      });

      const itemSystem = new ItemSystem();
      const itemResult = itemSystem.generateWaveItems(state, 1);

      // Apply item generation
      state = {
        ...state,
        placeables: itemResult.placeables || [],
      };

      // Items should be present before wave starts
      const powerups = state.placeables.filter((p) => isPowerupItem(p));
      const landmines = state.placeables.filter((p) => isTrapItem(p));
      expect(powerups.length).toBeGreaterThan(0);
      expect(landmines.length).toBeGreaterThan(0);
      expect(state.isWaveActive).toBe(false);

      // Step 2: User can see items and decide when to start wave
      // (this is just state verification)
      expect(state.wave).toBe(1);
      expect(state.isWaveActive).toBe(false);

      // Step 3: User clicks to start wave (separate from item generation)
      // Wave would start here but items are already visible
    });
  });
});
