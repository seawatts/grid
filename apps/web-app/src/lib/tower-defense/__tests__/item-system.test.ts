import { describe, expect, it } from 'bun:test';
import { ItemSystem } from '../engine/systems/item-system';
import { createTestPowerup, createTestState } from './test-helpers';

describe('Item System Tests', () => {
  describe('Powerup generation', () => {
    it('should generate powerups on empty cells', () => {
      const state = createTestState({
        powerupIdCounter: 0,
        powerups: [],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      expect(result.powerups).toBeDefined();
      expect(result.powerups?.length).toBeGreaterThan(0);

      // All powerups should have valid positions
      if (result.powerups) {
        for (const powerup of result.powerups) {
          expect(powerup.position.x).toBeGreaterThanOrEqual(0);
          expect(powerup.position.x).toBeLessThan(12);
          expect(powerup.position.y).toBeGreaterThanOrEqual(0);
          expect(powerup.position.y).toBeLessThan(12);
        }
      }
    });

    it('should assign unique IDs to powerups', () => {
      const state = createTestState({
        powerupIdCounter: 10,
        powerups: [],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      const ids = result.powerups?.map((p) => p.id) ?? [];
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);

      // IDs should start from counter
      for (const id of ids) {
        expect(id).toBeGreaterThanOrEqual(10);
      }
    });

    it('should respect upgrade effects on powerup count', () => {
      const stateNoUpgrade = createTestState({
        powerups: [],
        progress: {
          techPoints: 0,
          upgrades: {
            landmineDamage: 0,
            landmineFrequency: 0,
            powerNodeFrequency: 0, // No upgrade
            powerNodePersistence: 0,
            powerNodePotency: 0,
          },
        },
      });

      const stateWithUpgrade = createTestState({
        powerups: [],
        progress: {
          techPoints: 0,
          upgrades: {
            landmineDamage: 0,
            landmineFrequency: 0,
            powerNodeFrequency: 3, // Max upgrade
            powerNodePersistence: 0,
            powerNodePotency: 0,
          },
        },
      });

      const itemSystem = new ItemSystem();
      const resultNoUpgrade = itemSystem.generateWaveItems(stateNoUpgrade, 1);
      const resultWithUpgrade = itemSystem.generateWaveItems(
        stateWithUpgrade,
        1,
      );

      // With upgrade should generate more powerups
      expect(resultWithUpgrade.powerups?.length).toBeGreaterThanOrEqual(
        resultNoUpgrade.powerups?.length,
      );
    });

    it('should respect upgrade effects on powerup boost value', () => {
      const stateNoUpgrade = createTestState({
        powerups: [],
        progress: {
          techPoints: 0,
          upgrades: {
            landmineDamage: 0,
            landmineFrequency: 0,
            powerNodeFrequency: 0,
            powerNodePotency: 0, // No upgrade
          },
        },
      });

      const stateWithUpgrade = createTestState({
        powerups: [],
        progress: {
          techPoints: 0,
          upgrades: {
            landmineDamage: 0,
            landmineFrequency: 0,
            powerNodeFrequency: 0,
            powerNodePersistence: 0,
            powerNodePotency: 3, // Max upgrade
          },
        },
      });

      const itemSystem = new ItemSystem();
      const resultNoUpgrade = itemSystem.generateWaveItems(stateNoUpgrade, 1);
      const resultWithUpgrade = itemSystem.generateWaveItems(
        stateWithUpgrade,
        1,
      );

      // With upgrade should have higher boost values
      if (
        resultNoUpgrade.powerups?.length > 0 &&
        resultWithUpgrade.powerups?.length > 0
      ) {
        expect(resultWithUpgrade.powerups?.[0]?.boost).toBeGreaterThanOrEqual(
          resultNoUpgrade.powerups?.[0]?.boost,
        );
      }
    });

    it('should scale powerup lifetime with persistence upgrade', () => {
      const itemSystem = new ItemSystem();
      const baseState = createTestState({
        powerups: [],
      });
      const upgradedState = createTestState({
        powerups: [],
      });
      upgradedState.progress.upgrades.powerNodePersistence = 4;

      const baseResult = itemSystem.generateWaveItems(baseState, 1);
      const upgradedResult = itemSystem.generateWaveItems(upgradedState, 1);

      expect(baseResult.powerups?.[0]?.remainingWaves).toBeDefined();
      expect(upgradedResult.powerups?.[0]?.remainingWaves ?? 0).toBeGreaterThan(
        baseResult.powerups?.[0]?.remainingWaves ?? 0,
      );
    });

    it('should avoid cells occupied by towers', () => {
      const state = createTestState({
        grid: Array(12)
          .fill(null)
          .map((_, y) =>
            Array(12)
              .fill(null)
              .map((_, x) => (x === 0 && y === 0 ? 'tower' : 'empty')),
          ),
        powerups: [],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // No powerups should be at tower position
      const onTower = result.powerups?.some(
        (p) => p.position.x === 0 && p.position.y === 0,
      );
      expect(onTower).toBe(false);
    });

    it('should avoid cells occupied by existing powerups', () => {
      const state = createTestState({
        powerups: [
          createTestPowerup({
            id: 1,
            position: { x: 5, y: 5 },
          }),
        ],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // Check that existing powerup is preserved
      const existingPreserved = result.powerups?.some(
        (p) => p.id === 1 && p.position.x === 5 && p.position.y === 5,
      );
      expect(existingPreserved).toBe(true);

      // New powerups (id !== 1) should not overlap with existing one at (5,5)
      const newPowerups = result.powerups?.filter((p) => p.id !== 1) ?? [];
      const overlapping = newPowerups.some(
        (p) => p.position.x === 5 && p.position.y === 5,
      );
      expect(overlapping).toBe(false);
    });

    it('should avoid cells occupied by landmines', () => {
      const state = createTestState({
        landmines: [
          {
            damage: 30,
            id: 1,
            position: { x: 5, y: 5 },
          },
        ],
        powerups: [],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // Powerups should not overlap with landmines
      const overlapping = result.powerups?.some(
        (p) => p.position.x === 5 && p.position.y === 5,
      );
      expect(overlapping).toBe(false);
    });
  });

  describe('Landmine generation', () => {
    it('should generate landmines on empty cells', () => {
      const state = createTestState({
        landmineIdCounter: 0,
        landmines: [],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      expect(result.landmines).toBeDefined();
      expect(result.landmines?.length).toBeGreaterThan(0);

      // All landmines should have valid positions
      if (result.landmines) {
        for (const landmine of result.landmines) {
          expect(landmine.position.x).toBeGreaterThanOrEqual(0);
          expect(landmine.position.x).toBeLessThan(12);
          expect(landmine.position.y).toBeGreaterThanOrEqual(0);
          expect(landmine.position.y).toBeLessThan(12);
        }
      }
    });

    it('should assign unique IDs to landmines', () => {
      const state = createTestState({
        landmineIdCounter: 20,
        landmines: [],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      const ids = result.landmines?.map((l) => l.id) ?? [];
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);

      // IDs should start from counter
      for (const id of ids) {
        expect(id).toBeGreaterThanOrEqual(20);
      }
    });

    it('should respect upgrade effects on landmine count', () => {
      const stateNoUpgrade = createTestState({
        landmines: [],
        progress: {
          techPoints: 0,
          upgrades: {
            landmineDamage: 0,
            landmineFrequency: 0, // No upgrade
            powerNodeFrequency: 0,
            powerNodePersistence: 0,
            powerNodePotency: 0,
          },
        },
      });

      const stateWithUpgrade = createTestState({
        landmines: [],
        progress: {
          techPoints: 0,
          upgrades: {
            landmineDamage: 0,
            landmineFrequency: 3, // Max upgrade
            powerNodeFrequency: 0,
            powerNodePersistence: 0,
            powerNodePotency: 0,
          },
        },
      });

      const itemSystem = new ItemSystem();
      const resultNoUpgrade = itemSystem.generateWaveItems(stateNoUpgrade, 1);
      const resultWithUpgrade = itemSystem.generateWaveItems(
        stateWithUpgrade,
        1,
      );

      // With upgrade should generate more landmines
      expect(resultWithUpgrade.landmines?.length).toBeGreaterThanOrEqual(
        resultNoUpgrade.landmines?.length,
      );
    });

    it('should respect upgrade effects on landmine damage', () => {
      const stateNoUpgrade = createTestState({
        landmines: [],
        progress: {
          techPoints: 0,
          upgrades: {
            landmineDamage: 0, // No upgrade
            landmineFrequency: 0,
            powerNodeFrequency: 0,
            powerNodePersistence: 0,
            powerNodePotency: 0,
          },
        },
      });

      const stateWithUpgrade = createTestState({
        landmines: [],
        progress: {
          techPoints: 0,
          upgrades: {
            landmineDamage: 3, // Max upgrade
            landmineFrequency: 0,
            powerNodeFrequency: 0,
            powerNodePersistence: 0,
            powerNodePotency: 0,
          },
        },
      });

      const itemSystem = new ItemSystem();
      const resultNoUpgrade = itemSystem.generateWaveItems(stateNoUpgrade, 1);
      const resultWithUpgrade = itemSystem.generateWaveItems(
        stateWithUpgrade,
        1,
      );

      // With upgrade should have higher damage values
      if (
        resultNoUpgrade.landmines?.length > 0 &&
        resultWithUpgrade.landmines?.length > 0
      ) {
        expect(resultWithUpgrade.landmines?.[0]?.damage).toBeGreaterThanOrEqual(
          resultNoUpgrade.landmines?.[0]?.damage,
        );
      }
    });

    it('should avoid cells occupied by existing items', () => {
      const state = createTestState({
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
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // Existing landmine should be preserved
      const existingLandminePreserved = result.landmines?.some(
        (l) => l.id === 1 && l.position.x === 5 && l.position.y === 5,
      );
      expect(existingLandminePreserved).toBe(true);

      // New landmines (id !== 1) should not overlap with existing items
      const newLandmines = result.landmines?.filter((l) => l.id !== 1) ?? [];
      const overlapping = newLandmines.some(
        (l) =>
          (l.position.x === 5 && l.position.y === 5) ||
          (l.position.x === 6 && l.position.y === 6),
      );
      expect(overlapping).toBe(false);
    });
  });

  describe('Combined generation', () => {
    it('should generate both powerups and landmines', () => {
      const state = createTestState({
        landmines: [],
        powerups: [],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      expect(result.powerups?.length).toBeGreaterThan(0);
      expect(result.landmines?.length).toBeGreaterThan(0);
    });

    it('should not place powerups and landmines in same cells', () => {
      const state = createTestState({
        landmines: [],
        powerups: [],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // Check for overlaps
      if (result.powerups) {
        for (const powerup of result.powerups) {
          const overlapping = result.landmines?.some(
            (l) =>
              l.position.x === powerup.position.x &&
              l.position.y === powerup.position.y,
          );
          expect(overlapping).toBe(false);
        }
      }
    });

    it('should preserve existing items when generating new ones', () => {
      const existingPowerup = createTestPowerup({
        id: 1,
        position: { x: 5, y: 5 },
      });

      const existingLandmine = {
        damage: 30,
        id: 1,
        position: { x: 6, y: 6 },
      };

      const state = createTestState({
        landmines: [existingLandmine],
        powerups: [existingPowerup],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // Existing items should be preserved
      expect(result.powerups).toContainEqual(existingPowerup);
      expect(result.landmines).toContainEqual(existingLandmine);
    });

    it('should scale generation with count parameter', () => {
      const state = createTestState({
        landmines: [],
        powerups: [],
      });

      const itemSystem = new ItemSystem();
      const result1 = itemSystem.generateWaveItems(state, 1);
      const result2 = itemSystem.generateWaveItems(state, 2);

      // Higher count should generate more items (if upgrades allow)
      const total1 =
        (result1.powerups?.length ?? 0) + (result1.landmines?.length ?? 0);
      const total2 =
        (result2.powerups?.length ?? 0) + (result2.landmines?.length ?? 0);
      expect(total2).toBeGreaterThanOrEqual(total1);
    });
  });

  describe('Empty cell detection', () => {
    it('should handle full grid gracefully', () => {
      // Create a grid with mostly occupied cells
      const grid = Array(12)
        .fill(null)
        .map(() => Array(12).fill('tower'));

      // Leave a few empty cells
      if (grid[0]) {
        grid[0][0] = 'empty';
        grid[0][1] = 'empty';
      }

      const state = createTestState({
        grid,
        landmines: [],
        powerups: [],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // Should only place items in available cells
      const totalItems =
        (result.powerups?.length ?? 0) + (result.landmines?.length ?? 0);
      expect(totalItems).toBeLessThanOrEqual(2);
    });

    it('should not generate items on start/goal positions', () => {
      const state = createTestState({
        goalPositions: [{ x: 11, y: 6 }],
        grid: Array(12)
          .fill(null)
          .map((_, y) =>
            Array(12)
              .fill(null)
              .map((_, x) => {
                if (x === 0 && y === 6) return 'start';
                if (x === 11 && y === 6) return 'goal';
                return 'empty';
              }),
          ),
        landmines: [],
        powerups: [],
        startPositions: [{ x: 0, y: 6 }],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // No items should be on start or goal
      const onStart =
        result.powerups?.some(
          (p) => p.position.x === 0 && p.position.y === 6,
        ) ||
        result.landmines?.some((l) => l.position.x === 0 && l.position.y === 6);
      const onGoal =
        result.powerups?.some(
          (p) => p.position.x === 11 && p.position.y === 6,
        ) ||
        result.landmines?.some(
          (l) => l.position.x === 11 && l.position.y === 6,
        );

      expect(onStart).toBe(false);
      expect(onGoal).toBe(false);
    });
  });
});
