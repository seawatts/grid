import { GRID_SIZE } from './game-constants';
import type { Position } from './game-types';
import { findPath } from './pathfinding';

export type GameMap = {
  id: string;
  name: string;
  obstacles: Position[];
  description: string;
  starts: Position[];
  goals: Position[];
};

export const GAME_MAPS: GameMap[] = [
  {
    description: 'Classic open battlefield',
    goals: [{ x: GRID_SIZE - 1, y: GRID_SIZE - 1 }],
    id: 'open',
    name: 'OPEN GRID',
    obstacles: [],
    starts: [{ x: 0, y: 0 }],
  },
  {
    description: 'Central cross obstacle',
    goals: [{ x: 6, y: 6 }],
    id: 'center-cross',
    name: 'CROSSROADS',
    obstacles: [
      // Vertical center obstacles
      { x: 5, y: 3 },
      { x: 5, y: 4 },
      { x: 5, y: 5 },
      { x: 6, y: 3 },
      { x: 6, y: 4 },
      { x: 6, y: 5 },
      { x: 5, y: 7 },
      { x: 5, y: 8 },
      { x: 5, y: 9 },
      { x: 6, y: 7 },
      { x: 6, y: 8 },
      { x: 6, y: 9 },
      // Horizontal center obstacles
      { x: 3, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 6 },
      { x: 4, y: 6 },
      { x: 7, y: 5 },
      { x: 8, y: 5 },
      { x: 9, y: 5 },
      { x: 7, y: 6 },
      { x: 8, y: 6 },
      { x: 9, y: 6 },
    ],
    starts: [
      { x: 0, y: 0 },
      { x: GRID_SIZE - 1, y: 0 },
      { x: 0, y: GRID_SIZE - 1 },
      { x: GRID_SIZE - 1, y: GRID_SIZE - 1 },
    ],
  },
  {
    description: 'Navigate the maze',
    goals: [
      { x: GRID_SIZE - 1, y: GRID_SIZE - 1 },
      { x: GRID_SIZE - 1, y: 0 },
    ],
    id: 'maze',
    name: 'LABYRINTH',
    obstacles: [
      // Create a maze-like pattern
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 7, y: 2 },
      { x: 8, y: 2 },
      { x: 9, y: 2 },
      { x: 7, y: 4 },
      { x: 8, y: 4 },
      { x: 9, y: 4 },
      { x: 2, y: 7 },
      { x: 3, y: 7 },
      { x: 4, y: 7 },
      { x: 2, y: 9 },
      { x: 3, y: 9 },
      { x: 4, y: 9 },
      { x: 7, y: 7 },
      { x: 8, y: 7 },
      { x: 9, y: 7 },
      { x: 7, y: 9 },
      { x: 8, y: 9 },
      { x: 9, y: 9 },
    ],
    starts: [
      { x: 0, y: 0 },
      { x: 0, y: GRID_SIZE - 1 },
    ],
  },
  {
    description: 'Island obstacles',
    goals: [
      { x: 5, y: 0 },
      { x: 5, y: GRID_SIZE - 1 },
    ],
    id: 'islands',
    name: 'ISLANDS',
    obstacles: [
      // Small island clusters
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 8, y: 3 },
      { x: 9, y: 3 },
      { x: 8, y: 4 },
      { x: 9, y: 4 },
      { x: 3, y: 8 },
      { x: 4, y: 8 },
      { x: 3, y: 9 },
      { x: 4, y: 9 },
      { x: 8, y: 8 },
      { x: 9, y: 8 },
      { x: 8, y: 9 },
      { x: 9, y: 9 },
    ],
    starts: [
      { x: 0, y: 5 },
      { x: GRID_SIZE - 1, y: 5 },
    ],
  },
  {
    description: 'Narrow passage',
    goals: [{ x: GRID_SIZE - 1, y: 5 }],
    id: 'corridor',
    name: 'THE GAUNTLET',
    obstacles: [
      // Create a narrow corridor
      { x: 4, y: 2 },
      { x: 4, y: 3 },
      { x: 4, y: 4 },
      { x: 4, y: 5 },
      { x: 4, y: 7 },
      { x: 4, y: 8 },
      { x: 4, y: 9 },
      { x: 7, y: 2 },
      { x: 7, y: 3 },
      { x: 7, y: 4 },
      { x: 7, y: 6 },
      { x: 7, y: 7 },
      { x: 7, y: 8 },
      { x: 7, y: 9 },
    ],
    starts: [{ x: 0, y: 5 }],
  },
];

export function validateMap(map: GameMap): boolean {
  // For each start, there must be a path to at least one goal
  return map.starts.every((start) => {
    const path = findPath(start, map.goals, map.obstacles, GRID_SIZE);
    return path !== null && path.length > 0;
  });
}

export function getMapById(id: string): GameMap {
  const map = GAME_MAPS.find((m) => m.id === id);
  return map || GAME_MAPS[0];
}
