import { useEffect } from 'react';
import type { Position } from '../game-types';
import { findPathsForMultipleStartsAndGoals } from '../pathfinding';
import { useGameStore } from '../store/game-store';

export function useDebugPaths() {
  const grid = useGameStore((state) => state.grid);
  const gridWidth = useGameStore((state) => state.gridWidth);
  const gridHeight = useGameStore((state) => state.gridHeight);
  const towers = useGameStore((state) => state.towers);
  const obstacles = useGameStore((state) => state.obstacles);
  const placeables = useGameStore((state) => state.placeables);
  const startPositions = useGameStore((state) => state.startPositions);
  const goalPositions = useGameStore((state) => state.goalPositions);
  const setDebugPaths = useGameStore((state) => state.setDebugPaths);
  const setAnimatedPathLengths = useGameStore(
    (state) => state.setAnimatedPathLengths,
  );

  useEffect(() => {
    if (grid.length === 0 || gridWidth === 0 || gridHeight === 0) return;

    const baseBlockedPositions = [
      ...towers.map((t) => t.position),
      ...obstacles,
    ];

    const newPaths = findPathsForMultipleStartsAndGoals(
      startPositions,
      goalPositions,
      baseBlockedPositions,
      gridWidth,
      gridHeight,
      placeables,
    ).filter((path): path is Position[] => path !== null);

    setDebugPaths(newPaths);
    setAnimatedPathLengths(newPaths.map(() => newPaths[0]?.length || 0));
  }, [
    grid,
    gridWidth,
    gridHeight,
    towers,
    obstacles,
    placeables,
    startPositions,
    goalPositions,
    setDebugPaths,
    setAnimatedPathLengths,
  ]);
}
