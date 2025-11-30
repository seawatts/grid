import { describe, expect, it } from 'bun:test';
import { ItemSystem } from '../engine/systems/item-system';
import { createTestPowerup, createTestState } from './test-helpers';

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
      expect(result.powerups).toBeDefined();
      expect(result.powerups?.length).toBeGreaterThan(0);
      expect(result.landmines).toBeDefined();
      expect(result.landmines?.length).toBeGreaterThan(0);
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
      expect(result.powerups?.length).toBeGreaterThan(0);
      expect(result.landmines?.length).toBeGreaterThan(0);
    });

    it('should allow generating items multiple times (e.g., when upgrading between waves)', () => {
      const state = createTestState({
        isWaveActive: false,

        wave: 1,
      });

      const itemSystem = new ItemSystem();

      // First generation
      const result1 = itemSystem.generateWaveItems(state, 1);
      const initialCount =
        (result1.powerups?.length ?? 0) + (result1.landmines?.length ?? 0);

      // Update state with first generation
      const updatedState = {
        ...state,
        landmines: result1.landmines || [],
        powerups: result1.powerups || [],
      };

      // Second generation (e.g., after upgrading)
      const result2 = itemSystem.generateWaveItems(updatedState, 1);
      const finalCount =
        (result2.powerups?.length ?? 0) + (result2.landmines?.length ?? 0);

      // Should have at least as many items as before (existing ones preserved)
      expect(finalCount).toBeGreaterThanOrEqual(initialCount);
    });

    it('should clear existing items when generating for a new wave', () => {
      const state = createTestState({
        isWaveActive: false,
        landmines: [
          {
            damage: 30,
            id: 1,
            position: { x: 5, y: 5 },
          },
        ],
        powerups: [
          createTestPowerup({
            id: 1,
            position: { x: 6, y: 6 },
          }),
        ],
        wave: 1,
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1, true); // true = clear existing

      // Old items should be cleared, only new items present
      const hasOldPowerup = result.powerups?.some((p) => p.id === 1);
      const hasOldLandmine = result.landmines?.some((l) => l.id === 1);

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
        landmines: itemResult.landmines || [],
        powerups: itemResult.powerups || [],
      };

      // Items should be present before wave starts
      expect(state.powerups.length).toBeGreaterThan(0);
      expect(state.landmines.length).toBeGreaterThan(0);
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
