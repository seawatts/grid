import { useCallback } from 'react';
import { toast } from 'sonner';
import { TOWER_STATS } from '../constants/balance';
import type { Tower } from '../game-types';
import { combineBlockedPositions, findPath } from '../pathfinding';
import { useGameStore } from '../store/game-store';
import { canPlaceTower } from '../utils/validators';

export function useGameControls() {
  const placeTower = useCallback(
    (x: number, y: number) => {
      const store = useGameStore.getState();

      if (!store.selectedTowerType || store.gameStatus !== 'playing') return;

      const validation = canPlaceTower({
        goalPositions: store.goalPositions,
        grid: store.grid,
        gridHeight: store.gridHeight,
        gridWidth: store.gridWidth,
        money: store.money,
        obstacles: store.obstacles,
        placeables: store.placeables,
        startPositions: store.startPositions,
        towers: store.towers,
        towerType: store.selectedTowerType,
        x,
        y,
      });

      if (!validation.canPlace) {
        // Provide user feedback for why placement failed
        const reason = validation.reason || 'Cannot place tower';
        if (reason === 'Would block all paths') {
          toast.error('Cannot Place Tower', {
            description:
              'This placement would block all paths from spawn points to goal positions.',
            duration: 3000,
          });
        } else if (reason === 'Not enough money') {
          toast.error('Not Enough Money', {
            description: `You need ${TOWER_STATS[store.selectedTowerType].cost} coins to place this tower.`,
            duration: 3000,
          });
        } else {
          toast.error('Cannot Place Tower', {
            description: reason,
            duration: 3000,
          });
        }
        return;
      }

      // Calculate new blocked positions (include blocking placeables)
      const newTowerPositions = [
        ...store.towers.map((t) => t.position),
        { x, y },
      ];
      const baseBlockedPositions = [...newTowerPositions, ...store.obstacles];
      const allBlockedPositions = combineBlockedPositions(
        baseBlockedPositions,
        store.placeables,
      );

      // Update enemy paths for spawned enemies
      const updatedSpawnedEnemies = store.spawnedEnemies.map((enemy) => {
        const currentPos = enemy.position;
        const newPath = findPath(
          currentPos,
          store.goalPositions,
          allBlockedPositions,
          store.gridWidth,
          store.gridHeight,
        );

        if (newPath) {
          return { ...enemy, path: newPath, pathIndex: 0 };
        }
        return enemy;
      });

      // Also update paths for unspawned enemies
      const updatedUnspawnedEnemies = store.unspawnedEnemies.map((enemy) => {
        const currentPos = enemy.position;
        const newPath = findPath(
          currentPos,
          store.goalPositions,
          allBlockedPositions,
          store.gridWidth,
          store.gridHeight,
        );

        if (newPath) {
          return { ...enemy, path: newPath, pathIndex: 0 };
        }
        return enemy;
      });

      store.updateSpawnedEnemies(updatedSpawnedEnemies);
      store.updateUnspawnedEnemies(updatedUnspawnedEnemies);

      // Add the tower
      const newTower: Tower = {
        id: store.getNextTowerId(),
        lastShot: 0,
        level: 1,
        position: { x, y },
        type: store.selectedTowerType,
      };

      store.addTower(newTower);
    },
    [], // Empty dependencies - we use getState() inside
  );

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      const store = useGameStore.getState();

      // Check if clicked on a tower
      const clickedTower = store.towers.find(
        (t) => t.position.x === x && t.position.y === y,
      );

      if (clickedTower) {
        store.setSelectedTower(clickedTower);
        store.setSelectedItem(null);
        store.setSelectedTowerType(null);
        return;
      }

      // If we have a selected tower type, try to place it
      if (store.selectedTowerType) {
        placeTower(x, y);
        return;
      }

      // Check if clicked on a placeable (unified system)
      const clickedPlaceable = store.placeables.find((item) =>
        item.positions.some((pos) => pos.x === x && pos.y === y),
      );

      if (clickedPlaceable) {
        store.setSelectedItem(clickedPlaceable);
        store.setSelectedTower(null);
        store.setSelectedTowerType(null);
        return;
      }

      // Clear selection
      store.setSelectedTower(null);
      store.setSelectedItem(null);
    },
    [placeTower], // placeTower is stable since it uses getState()
  );

  const upgradeTower = useCallback(() => {
    const store = useGameStore.getState();
    if (!store.selectedTower) return;
    store.upgradeTower(store.selectedTower.id);
  }, []);

  const deleteTower = useCallback(() => {
    const store = useGameStore.getState();
    if (!store.selectedTower) return;
    store.removeTower(store.selectedTower.id);
    store.setSelectedTower(null);
  }, []);

  return {
    deleteTower,
    handleCellClick,
    placeTower,
    upgradeTower,
  };
}
