import { TOWER_STATS } from '../game-constants';
import type { Position, Tower, TowerType } from '../game-types';
import { findPathsForMultipleStartsAndGoals } from '../pathfinding';

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
  gridSize: number;
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
    gridSize,
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

  // Check if placement would block all paths
  const newTowerPositions = [...towers.map((t) => t.position), { x, y }];
  const allBlockedPositions = [...newTowerPositions, ...obstacles];

  const testPaths = findPathsForMultipleStartsAndGoals(
    startPositions,
    goalPositions,
    allBlockedPositions,
    gridSize,
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
  gridSize: number,
): boolean {
  const paths = findPathsForMultipleStartsAndGoals(
    startPositions,
    goalPositions,
    blockedPositions,
    gridSize,
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
