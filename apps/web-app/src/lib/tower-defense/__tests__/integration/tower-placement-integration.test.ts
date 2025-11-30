import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { canPlaceTower } from '../../utils/validators';
import {
  createTestPlaceableTrap,
  createTestState,
  createTestTower,
} from '../test-helpers';

describe('Tower Placement Integration', () => {
  it('should detect bug: canPlaceTower does not check for powerups', () => {
    const state = createTestState({
      powerups: [
        {
          boost: 1.5,
          id: 1,
          isTowerBound: false,
          position: { x: 5, y: 5 },
          remainingWaves: 3,
        },
      ],
    });

    // Try to place tower on powerup position
    const validation = canPlaceTower({
      goalPositions: state.goalPositions,
      grid: state.grid,
      gridHeight: state.grid.length,
      gridWidth: state.grid[0]?.length ?? 12,
      landmines: state.landmines,
      money: 1000,
      obstacles: state.obstacles,
      placeables: state.placeables,
      powerups: state.powerups,
      startPositions: state.startPositions,
      towers: state.towers,
      towerType: 'basic',
      x: 5,
      y: 5,
    });

    // Should now correctly detect powerups
    expect(validation.canPlace).toBe(false);
  });

  it('should allow placing tower on power node', () => {
    const state = createTestState({
      placeables: [
        {
          boost: 1.5,
          category: 'powerup',
          id: 1,
          isTowerBound: false,
          positions: [{ x: 5, y: 5 }],
          rarity: 'common',
          remainingWaves: 3,
          type: 'powerNode',
        },
      ],
    });

    const validation = canPlaceTower({
      goalPositions: state.goalPositions,
      grid: state.grid,
      gridHeight: state.grid.length,
      gridWidth: state.grid[0]?.length ?? 12,
      landmines: state.landmines,
      money: 1000,
      obstacles: state.obstacles,
      placeables: state.placeables,
      powerups: state.powerups,
      startPositions: state.startPositions,
      towers: state.towers,
      towerType: 'basic',
      x: 5,
      y: 5,
    });

    // Power nodes should allow tower placement
    expect(validation.canPlace).toBe(true);
  });

  it('should detect bug: canPlaceTower does not check for landmines', () => {
    const state = createTestState({
      landmines: [
        {
          damage: 50,
          id: 1,
          position: { x: 5, y: 5 },
        },
      ],
    });

    const validation = canPlaceTower({
      goalPositions: state.goalPositions,
      grid: state.grid,
      gridHeight: state.grid.length,
      gridWidth: state.grid[0]?.length ?? 12,
      landmines: state.landmines,
      money: 1000,
      obstacles: state.obstacles,
      placeables: state.placeables,
      powerups: state.powerups,
      startPositions: state.startPositions,
      towers: state.towers,
      towerType: 'basic',
      x: 5,
      y: 5,
    });

    // Should now correctly detect landmines
    expect(validation.canPlace).toBe(false);
  });

  it('should prevent placing tower on trap', () => {
    const state = createTestState({
      placeables: [
        createTestPlaceableTrap({
          id: 1,
          positions: [{ x: 5, y: 5 }],
        }),
      ],
    });

    const validation = canPlaceTower({
      goalPositions: state.goalPositions,
      grid: state.grid,
      gridHeight: state.grid.length,
      gridWidth: state.grid[0]?.length ?? 12,
      landmines: state.landmines,
      money: 1000,
      obstacles: state.obstacles,
      placeables: state.placeables,
      powerups: state.powerups,
      startPositions: state.startPositions,
      towers: state.towers,
      towerType: 'basic',
      x: 5,
      y: 5,
    });

    // Traps should block tower placement
    expect(validation.canPlace).toBe(false);
    expect(validation.reason).toBe('Cell occupied by trap');
  });

  it('should allow placing tower on empty cell', () => {
    const state = createTestState();

    const validation = canPlaceTower({
      goalPositions: state.goalPositions,
      grid: state.grid,
      gridHeight: state.grid.length,
      gridWidth: state.grid[0]?.length ?? 12,
      landmines: state.landmines,
      money: 1000,
      obstacles: state.obstacles,
      placeables: state.placeables,
      powerups: state.powerups,
      startPositions: state.startPositions,
      towers: state.towers,
      towerType: 'basic',
      x: 3,
      y: 3,
    });

    expect(validation.canPlace).toBe(true);
  });

  it('should prevent placing tower on obstacle', () => {
    const state = createTestState({
      grid: Array(12)
        .fill(null)
        .map((_, y) =>
          Array(12)
            .fill(null)
            .map((_, x) => (x === 5 && y === 5 ? 'obstacle' : 'empty')),
        ),
      obstacles: [{ x: 5, y: 5 }],
    });

    const validation = canPlaceTower({
      goalPositions: state.goalPositions,
      grid: state.grid,
      gridHeight: state.grid.length,
      gridWidth: state.grid[0]?.length ?? 12,
      landmines: state.landmines,
      money: 1000,
      obstacles: state.obstacles,
      placeables: state.placeables,
      powerups: state.powerups,
      startPositions: state.startPositions,
      towers: state.towers,
      towerType: 'basic',
      x: 5,
      y: 5,
    });

    expect(validation.canPlace).toBe(false);
    expect(validation.reason).toBe('Invalid cell');
  });

  it('should prevent placing tower on existing tower', () => {
    const state = createTestState({
      towers: [createTestTower({ id: 1, position: { x: 5, y: 5 } })],
    });

    // Place grid obstacle at tower position (towers block grid cells)
    const grid = state.grid.map((row, y) =>
      row.map((cell, x) => (x === 5 && y === 5 ? 'obstacle' : cell)),
    );

    const validation = canPlaceTower({
      goalPositions: state.goalPositions,
      grid,
      gridHeight: grid.length,
      gridWidth: grid[0]?.length ?? 12,
      landmines: state.landmines,
      money: 1000,
      obstacles: state.obstacles,
      placeables: state.placeables,
      powerups: state.powerups,
      startPositions: state.startPositions,
      towers: state.towers,
      towerType: 'basic',
      x: 5,
      y: 5,
    });

    expect(validation.canPlace).toBe(false);
  });

  it('should prevent placing tower when not enough money', () => {
    const state = createTestState({
      money: 10, // Less than basic tower cost
    });

    const validation = canPlaceTower({
      goalPositions: state.goalPositions,
      grid: state.grid,
      gridHeight: state.grid.length,
      gridWidth: state.grid[0]?.length ?? 12,
      landmines: state.landmines,
      money: state.money,
      obstacles: state.obstacles,
      placeables: state.placeables,
      powerups: state.powerups,
      startPositions: state.startPositions,
      towers: state.towers,
      towerType: 'basic',
      x: 3,
      y: 3,
    });

    expect(validation.canPlace).toBe(false);
    expect(validation.reason).toBe('Not enough money');
  });
});
