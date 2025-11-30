import { describe, expect, it } from 'bun:test';
import { ItemSystem } from '../engine/systems/item-system';
import { isPowerupItem, isTrapItem } from '../game-types';
import {
  createTestPlaceablePowerup,
  createTestPlaceableTrap,
  createTestState,
} from './test-helpers';

describe('Item System Tests', () => {
  describe('Powerup generation', () => {
    it('should generate powerups on empty cells', () => {
      const state = createTestState({
        placeableIdCounter: 0,
        placeables: [],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generatePlaceables(state, 1, true);

      expect(result.placeables).toBeDefined();
      const powerups = result.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      expect(powerups.length).toBeGreaterThan(0);

      // All powerups should have valid positions
      for (const powerup of powerups) {
        for (const pos of powerup.positions) {
          expect(pos.x).toBeGreaterThanOrEqual(0);
          expect(pos.x).toBeLessThan(12);
          expect(pos.y).toBeGreaterThanOrEqual(0);
          expect(pos.y).toBeLessThan(12);
        }
      }
    });

    it('should assign unique IDs to powerups', () => {
      const state = createTestState({
        placeableIdCounter: 10,
        placeables: [],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generatePlaceables(state, 1, true);

      const powerups = result.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      const ids = powerups.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);

      // IDs should start from counter
      for (const id of ids) {
        expect(id).toBeGreaterThanOrEqual(10);
      }
    });

    it('should respect upgrade effects on powerup count', () => {
      const stateNoUpgrade = createTestState({
        progress: {
          energy: 100,
          energyRecoveryRate: 1,
          lastEnergyUpdate: Date.now(),
          mapRatings: {},
          maxEnergy: 100,
          techPoints: 0,
          upgrades: {
            energyRecoveryRate: 0,
            gridBugDamage: 0,
            gridBugFrequency: 0,
            landmineDamage: 0,
            landmineFrequency: 0,
            maxEnergy: 0,
            powerNodeFrequency: 0, // No upgrade
            powerNodePersistence: 0,
            powerNodePotency: 0,
            streamFrequency: 0,
            streamLength: 0,
          },
        },
      });

      const stateWithUpgrade = createTestState({
        progress: {
          energy: 100,
          energyRecoveryRate: 1,
          lastEnergyUpdate: Date.now(),
          mapRatings: {},
          maxEnergy: 100,
          techPoints: 0,
          upgrades: {
            energyRecoveryRate: 0,
            gridBugDamage: 0,
            gridBugFrequency: 0,
            landmineDamage: 0,
            landmineFrequency: 0,
            maxEnergy: 0,
            powerNodeFrequency: 3, // Max upgrade
            powerNodePersistence: 0,
            powerNodePotency: 0,
            streamFrequency: 0,
            streamLength: 0,
          },
        },
      });

      const itemSystem = new ItemSystem();
      const resultNoUpgrade = itemSystem.generatePlaceables(
        stateNoUpgrade,
        1,
        true,
      );
      const resultWithUpgrade = itemSystem.generatePlaceables(
        stateWithUpgrade,
        1,
        true,
      );

      // With upgrade should generate more powerups
      const noUpgradePowerups =
        resultNoUpgrade.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      const withUpgradePowerups =
        resultWithUpgrade.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      const noUpgradeLength = noUpgradePowerups.length;
      const withUpgradeLength = withUpgradePowerups.length;
      expect(withUpgradeLength).toBeGreaterThanOrEqual(noUpgradeLength);
    });

    it('should respect upgrade effects on powerup boost value', () => {
      const stateNoUpgrade = createTestState({
        progress: {
          energy: 100,
          energyRecoveryRate: 1,
          lastEnergyUpdate: Date.now(),
          mapRatings: {},
          maxEnergy: 100,
          techPoints: 0,
          upgrades: {
            energyRecoveryRate: 0,
            gridBugDamage: 0,
            gridBugFrequency: 0,
            landmineDamage: 0,
            landmineFrequency: 0,
            maxEnergy: 0,
            powerNodeFrequency: 0,
            powerNodePersistence: 0,
            powerNodePotency: 0, // No upgrade
            streamFrequency: 0,
            streamLength: 0,
          },
        },
      });

      const stateWithUpgrade = createTestState({
        progress: {
          energy: 100,
          energyRecoveryRate: 1,
          lastEnergyUpdate: Date.now(),
          mapRatings: {},
          maxEnergy: 100,
          techPoints: 0,
          upgrades: {
            energyRecoveryRate: 0,
            gridBugDamage: 0,
            gridBugFrequency: 0,
            landmineDamage: 0,
            landmineFrequency: 0,
            maxEnergy: 0,
            powerNodeFrequency: 0,
            powerNodePersistence: 0,
            powerNodePotency: 3, // Max upgrade
            streamFrequency: 0,
            streamLength: 0,
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
      const noUpgradePowerups =
        resultNoUpgrade.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      const withUpgradePowerups =
        resultWithUpgrade.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      const noUpgradeBoost = noUpgradePowerups[0]?.boost;
      const withUpgradeBoost = withUpgradePowerups[0]?.boost;
      if (noUpgradeBoost !== undefined && withUpgradeBoost !== undefined) {
        expect(withUpgradeBoost).toBeGreaterThanOrEqual(noUpgradeBoost);
      }
    });

    it('should scale powerup lifetime with persistence upgrade', () => {
      const itemSystem = new ItemSystem();
      const baseState = createTestState({});
      const upgradedState = createTestState({});
      upgradedState.progress.upgrades.powerNodePersistence = 4;

      const baseResult = itemSystem.generateWaveItems(baseState, 1);
      const upgradedResult = itemSystem.generateWaveItems(upgradedState, 1);

      const basePowerups =
        baseResult.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      const upgradedPowerups =
        upgradedResult.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      expect(basePowerups[0]?.remainingWaves).toBeDefined();
      expect(upgradedPowerups[0]?.remainingWaves ?? 0).toBeGreaterThan(
        basePowerups[0]?.remainingWaves ?? 0,
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
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // No powerups should be at tower position
      const powerups = result.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      const onTower = powerups.some((p) =>
        p.positions.some((pos) => pos.x === 0 && pos.y === 0),
      );
      expect(onTower).toBe(false);
    });

    it('should avoid cells occupied by existing powerups', () => {
      const existingPowerup = createTestPlaceablePowerup({
        id: 1,
        positions: [{ x: 5, y: 5 }],
      });
      const state = createTestState({
        placeables: [existingPowerup],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // Check that existing powerup is preserved
      const powerups = result.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      const existingPreserved = powerups.some(
        (p) =>
          p.id === 1 && p.positions.some((pos) => pos.x === 5 && pos.y === 5),
      );
      expect(existingPreserved).toBe(true);

      // New powerups (id !== 1) should not overlap with existing one at (5,5)
      const newPowerups = powerups.filter((p) => p.id !== 1);
      const overlapping = newPowerups.some((p) =>
        p.positions.some((pos) => pos.x === 5 && pos.y === 5),
      );
      expect(overlapping).toBe(false);
    });

    it('should avoid cells occupied by landmines', () => {
      const existingLandmine = createTestPlaceableTrap({
        damage: 30,
        id: 1,
        positions: [{ x: 5, y: 5 }],
      });
      const state = createTestState({
        placeables: [existingLandmine],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // Powerups should not overlap with landmines
      const powerups = result.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      const overlapping = powerups.some((p) =>
        p.positions.some((pos) => pos.x === 5 && pos.y === 5),
      );
      expect(overlapping).toBe(false);
    });
  });

  describe('Landmine generation', () => {
    it('should generate landmines on empty cells', () => {
      const state = createTestState({});

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      const landmines = result.placeables?.filter((p) => isTrapItem(p)) ?? [];
      expect(landmines.length).toBeGreaterThan(0);

      // All landmines should have valid positions
      for (const landmine of landmines) {
        for (const pos of landmine.positions) {
          expect(pos.x).toBeGreaterThanOrEqual(0);
          expect(pos.x).toBeLessThan(12);
          expect(pos.y).toBeGreaterThanOrEqual(0);
          expect(pos.y).toBeLessThan(12);
        }
      }
    });

    it('should assign unique IDs to landmines', () => {
      const state = createTestState({});

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      const landmines = result.placeables?.filter((p) => isTrapItem(p)) ?? [];
      const ids = landmines.map((l) => l.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);

      // IDs should start from counter
      for (const id of ids) {
        expect(id).toBeGreaterThanOrEqual(20);
      }
    });

    it('should respect upgrade effects on landmine count', () => {
      const stateNoUpgrade = createTestState({
        progress: {
          energy: 100,
          energyRecoveryRate: 1,
          lastEnergyUpdate: Date.now(),
          mapRatings: {},
          maxEnergy: 100,
          techPoints: 0,
          upgrades: {
            energyRecoveryRate: 0,
            gridBugDamage: 0,
            gridBugFrequency: 0,
            landmineDamage: 0,
            landmineFrequency: 0, // No upgrade
            maxEnergy: 0,
            powerNodeFrequency: 0,
            powerNodePersistence: 0,
            powerNodePotency: 0,
            streamFrequency: 0,
            streamLength: 0,
          },
        },
      });

      const stateWithUpgrade = createTestState({
        progress: {
          energy: 100,
          energyRecoveryRate: 1,
          lastEnergyUpdate: Date.now(),
          mapRatings: {},
          maxEnergy: 100,
          techPoints: 0,
          upgrades: {
            energyRecoveryRate: 0,
            gridBugDamage: 0,
            gridBugFrequency: 0,
            landmineDamage: 0,
            landmineFrequency: 3, // Max upgrade
            maxEnergy: 0,
            powerNodeFrequency: 0,
            powerNodePersistence: 0,
            powerNodePotency: 0,
            streamFrequency: 0,
            streamLength: 0,
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
      const noUpgradeLength = resultNoUpgrade.landmines?.length ?? 0;
      const withUpgradeLength = resultWithUpgrade.landmines?.length ?? 0;
      expect(withUpgradeLength).toBeGreaterThanOrEqual(noUpgradeLength);
    });

    it('should respect upgrade effects on landmine damage', () => {
      const stateNoUpgrade = createTestState({
        progress: {
          energy: 100,
          energyRecoveryRate: 1,
          lastEnergyUpdate: Date.now(),
          mapRatings: {},
          maxEnergy: 100,
          techPoints: 0,
          upgrades: {
            energyRecoveryRate: 0,
            gridBugDamage: 0,
            gridBugFrequency: 0,
            landmineDamage: 0, // No upgrade
            landmineFrequency: 0,
            maxEnergy: 0,
            powerNodeFrequency: 0,
            powerNodePersistence: 0,
            powerNodePotency: 0,
            streamFrequency: 0,
            streamLength: 0,
          },
        },
      });

      const stateWithUpgrade = createTestState({
        progress: {
          energy: 100,
          energyRecoveryRate: 1,
          lastEnergyUpdate: Date.now(),
          mapRatings: {},
          maxEnergy: 100,
          techPoints: 0,
          upgrades: {
            energyRecoveryRate: 0,
            gridBugDamage: 0,
            gridBugFrequency: 0,
            landmineDamage: 3, // Max upgrade
            landmineFrequency: 0,
            maxEnergy: 0,
            powerNodeFrequency: 0,
            powerNodePersistence: 0,
            powerNodePotency: 0,
            streamFrequency: 0,
            streamLength: 0,
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
      const noUpgradeDamage = resultNoUpgrade.landmines?.[0]?.damage;
      const withUpgradeDamage = resultWithUpgrade.landmines?.[0]?.damage;
      if (noUpgradeDamage !== undefined && withUpgradeDamage !== undefined) {
        expect(withUpgradeDamage).toBeGreaterThanOrEqual(noUpgradeDamage);
      }
    });

    it('should avoid cells occupied by existing items', () => {
      const existingLandmine = createTestPlaceableTrap({
        damage: 30,
        id: 1,
        positions: [{ x: 5, y: 5 }],
        type: 'landmine',
      });
      const existingPowerup = createTestPlaceablePowerup({
        id: 1,
        positions: [{ x: 6, y: 6 }],
      });
      const state = createTestState({
        placeables: [existingLandmine, existingPowerup],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // Existing landmine should be preserved
      const landmines = result.placeables?.filter((p) => isTrapItem(p)) ?? [];
      const existingLandminePreserved = landmines.some(
        (l) =>
          l.id === 1 && l.positions.some((pos) => pos.x === 5 && pos.y === 5),
      );
      expect(existingLandminePreserved).toBe(true);

      // New landmines (id !== 1) should not overlap with existing items
      const newLandmines = landmines.filter((l) => l.id !== 1);
      const overlapping = newLandmines.some((l) =>
        l.positions.some(
          (pos) => (pos.x === 5 && pos.y === 5) || (pos.x === 6 && pos.y === 6),
        ),
      );
      expect(overlapping).toBe(false);
    });
  });

  describe('Combined generation', () => {
    it('should generate both powerups and landmines', () => {
      const state = createTestState({});

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      const powerups = result.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      const landmines = result.placeables?.filter((p) => isTrapItem(p)) ?? [];
      expect(powerups.length).toBeGreaterThan(0);
      expect(landmines.length).toBeGreaterThan(0);
    });

    it('should not place powerups and landmines in same cells', () => {
      const state = createTestState({});

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // Check for overlaps
      const powerups = result.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      const landmines = result.placeables?.filter((p) => isTrapItem(p)) ?? [];
      for (const powerup of powerups) {
        for (const powerupPos of powerup.positions) {
          const overlapping = landmines.some((l) =>
            l.positions.some(
              (lPos) => lPos.x === powerupPos.x && lPos.y === powerupPos.y,
            ),
          );
          expect(overlapping).toBe(false);
        }
      }
    });

    it('should preserve existing items when generating new ones', () => {
      const existingPowerup = createTestPlaceablePowerup({
        id: 1,
        positions: [{ x: 5, y: 5 }],
      });

      const existingLandmine = createTestPlaceableTrap({
        damage: 30,
        id: 1,
        positions: [{ x: 6, y: 6 }],
        type: 'landmine',
      });

      const state = createTestState({
        placeables: [existingLandmine, existingPowerup],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // Existing items should be preserved (converted to legacy format)
      const powerupPosition = existingPowerup.positions[0];
      const landminePosition = existingLandmine.positions[0];

      if (!powerupPosition || !landminePosition) {
        throw new Error('Expected positions to exist');
      }

      const legacyPowerup = {
        boost: existingPowerup.boost,
        id: existingPowerup.id,
        isTowerBound: existingPowerup.isTowerBound,
        position: powerupPosition,
        remainingWaves: existingPowerup.remainingWaves,
      };
      const legacyLandmine = {
        damage: existingLandmine.damage,
        id: existingLandmine.id,
        position: landminePosition,
      };
      const resultPowerups =
        result.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      const resultLandmines =
        result.placeables?.filter(
          (p) => isTrapItem(p) && p.type === 'landmine',
        ) ?? [];
      // Check if the converted placeables match the legacy format
      const matchingPowerup = resultPowerups.find(
        (p) => p.id === legacyPowerup.id,
      );
      const matchingLandmine = resultLandmines.find(
        (l) => l.id === legacyLandmine.id,
      );
      expect(matchingPowerup).toBeDefined();
      expect(matchingLandmine).toBeDefined();
    });

    it('should scale generation with count parameter', () => {
      const state = createTestState({});

      const itemSystem = new ItemSystem();
      const result1 = itemSystem.generateWaveItems(state, 1);
      const result2 = itemSystem.generateWaveItems(state, 2);

      // Higher count should generate more items (if upgrades allow)
      const total1 = result1.placeables?.length ?? 0;
      const total2 = result2.placeables?.length ?? 0;
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
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // Should only place items in available cells
      const totalItems = result.placeables?.length ?? 0;
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

        startPositions: [{ x: 0, y: 6 }],
      });

      const itemSystem = new ItemSystem();
      const result = itemSystem.generateWaveItems(state, 1);

      // No items should be on start or goal
      const powerups = result.placeables?.filter((p) => isPowerupItem(p)) ?? [];
      const landmines = result.placeables?.filter((p) => isTrapItem(p)) ?? [];
      const onStart =
        powerups.some((p) =>
          p.positions.some((pos) => pos.x === 0 && pos.y === 6),
        ) ||
        landmines.some((l) =>
          l.positions.some((pos) => pos.x === 0 && pos.y === 6),
        );
      const onGoal =
        powerups.some((p) =>
          p.positions.some((pos) => pos.x === 11 && pos.y === 6),
        ) ||
        landmines.some((l) =>
          l.positions.some((pos) => pos.x === 11 && pos.y === 6),
        );

      expect(onStart).toBe(false);
      expect(onGoal).toBe(false);
    });
  });
});
