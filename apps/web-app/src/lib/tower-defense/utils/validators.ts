import { TOWER_STATS } from '../game-constants';
import type {
  Landmine,
  PlaceableItem,
  Position,
  PowerUp,
  Tower,
  TowerType,
} from '../game-types';
import {
  combineBlockedPositions,
  findPathsForMultipleStartsAndGoals,
} from '../pathfinding';

export interface PlacementValidationParams {
  x: number;
  y: number;
  towerType: TowerType;
  money: number;
  grid: string[][];
  towers: Tower[];
  obstacles: Position[];
  startPositions: Position[];
  goalPositions: Position[];
  gridWidth: number;
  gridHeight: number;
  placeables?: PlaceableItem[];
  powerups?: PowerUp[];
  landmines?: Landmine[];
}

export interface PlacementValidationResult {
  canPlace: boolean;
  reason?: string;
}

export function canPlaceTower(
  params: PlacementValidationParams,
): PlacementValidationResult {
  const {
    x,
    y,
    towerType,
    money,
    grid,
    towers,
    obstacles,
    startPositions,
    goalPositions,
    gridWidth,
    gridHeight,
    placeables = [],
    powerups = [],
    landmines = [],
  } = params;

  const cost = TOWER_STATS[towerType].cost;

  // Check if player has enough money
  if (money < cost) {
    return { canPlace: false, reason: 'Not enough money' };
  }

  // Check if cell is valid
  if (!grid[y] || grid[y][x] !== 'empty') {
    return { canPlace: false, reason: 'Invalid cell' };
  }

  // Check if position is occupied by a trap (powerups allow tower placement)
  const hasTrap = placeables.some(
    (item) =>
      item.category === 'trap' &&
      item.positions.some((pos) => pos.x === x && pos.y === y),
  );
  if (hasTrap) {
    return { canPlace: false, reason: 'Cell occupied by trap' };
  }

  // Check if position is occupied by a powerup
  const hasPowerup = powerups.some(
    (powerup) => powerup.position.x === x && powerup.position.y === y,
  );
  if (hasPowerup) {
    return { canPlace: false, reason: 'Cell occupied by powerup' };
  }

  // Check if position is occupied by a landmine
  const hasLandmine = landmines.some(
    (landmine) => landmine.position.x === x && landmine.position.y === y,
  );
  if (hasLandmine) {
    return { canPlace: false, reason: 'Cell occupied by landmine' };
  }

  // Check if placement would block all paths
  // Include the new tower position, existing obstacles, and any placeables that block paths
  const newTowerPositions = [...towers.map((t) => t.position), { x, y }];
  const baseBlockedPositions = [...newTowerPositions, ...obstacles];
  const allBlockedPositions = combineBlockedPositions(
    baseBlockedPositions,
    placeables,
  );

  const testPaths = findPathsForMultipleStartsAndGoals(
    startPositions,
    goalPositions,
    allBlockedPositions,
    gridWidth,
    gridHeight,
  );

  const allPathsValid = testPaths.every(
    (path) => path !== null && path.length > 0,
  );

  if (!allPathsValid) {
    return { canPlace: false, reason: 'Would block all paths' };
  }

  return { canPlace: true };
}

export function isPathBlocked(
  blockedPositions: Position[],
  startPositions: Position[],
  goalPositions: Position[],
  gridWidth: number,
  gridHeight: number,
): boolean {
  const paths = findPathsForMultipleStartsAndGoals(
    startPositions,
    goalPositions,
    blockedPositions,
    gridWidth,
    gridHeight,
  );

  return paths.some((path) => path === null || path.length === 0);
}

export function isValidPlacement(
  x: number,
  y: number,
  grid: string[][],
): boolean {
  return !!grid[y] && grid[y][x] === 'empty';
}
