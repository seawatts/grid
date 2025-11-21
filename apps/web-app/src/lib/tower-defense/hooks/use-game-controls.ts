import { useCallback } from 'react';
import type { Tower } from '../game-types';
import { findPath } from '../pathfinding';
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
        gridSize: store.grid.length,
        money: store.money,
        obstacles: store.obstacles,
        startPositions: store.startPositions,
        towers: store.towers,
        towerType: store.selectedTowerType,
        x,
        y,
      });

      if (!validation.canPlace) {
        return;
      }

      // Calculate new blocked positions
      const newTowerPositions = [
        ...store.towers.map((t) => t.position),
        { x, y },
      ];
      const allBlockedPositions = [...newTowerPositions, ...store.obstacles];

      // Update enemy paths for spawned enemies
      const updatedSpawnedEnemies = store.spawnedEnemies.map((enemy) => {
        const currentPos = enemy.position;
        const newPath = findPath(
          currentPos,
          store.goalPositions,
          allBlockedPositions,
          store.grid.length,
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
          store.grid.length,
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

      // Check if clicked on an item
      const clickedPowerup = store.powerups.find(
        (p) => p.position.x === x && p.position.y === y,
      );
      const clickedLandmine = store.landmines.find(
        (l) => l.position.x === x && l.position.y === y,
      );

      if (clickedPowerup) {
        store.setSelectedItem(clickedPowerup);
        store.setSelectedTower(null);
        store.setSelectedTowerType(null);
        return;
      }

      if (clickedLandmine) {
        store.setSelectedItem(clickedLandmine);
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
