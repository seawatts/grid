import type { Enemy } from '../../game-types';
import type {
  GameState,
  GameSystem,
  SystemUpdateResult,
} from '../../store/types';
import { getEnemySpeed } from '../../utils/calculations';

export class EnemySystem implements GameSystem {
  update(
    state: GameState,
    _deltaTime: number,
    timestamp: number,
  ): SystemUpdateResult {
    const { spawnedEnemies, unspawnedEnemies, gameSpeed } = state;

    // Check for enemies ready to spawn
    const readyToSpawn: Enemy[] = [];
    const stillUnspawned: Enemy[] = [];

    for (const enemy of unspawnedEnemies) {
      if (timestamp >= enemy.spawnTime) {
        readyToSpawn.push(enemy);
      } else {
        stillUnspawned.push(enemy);
      }
    }

    let livesLost = 0;
    const occupiedCells = new Map<string, boolean>();

    // Process spawned enemies (including newly spawned ones)
    const allSpawnedEnemies = [...spawnedEnemies, ...readyToSpawn];

    const updatedEnemies = allSpawnedEnemies
      .map((enemy) => {
        // Invalid enemy data
        if (!enemy || !enemy.path || enemy.path.length === 0) {
          return null;
        }

        const effectiveSpeed = getEnemySpeed(enemy, gameSpeed);
        const nextIndex = enemy.pathIndex + effectiveSpeed;

        // Enemy reached the goal
        if (nextIndex >= enemy.path.length - 1) {
          livesLost++;
          return null;
        }

        const currentPathIndex = Math.floor(nextIndex);
        const targetCell = enemy.path[currentPathIndex];

        if (!targetCell) {
          return null;
        }

        // Check for cell collision (prevent multiple enemies in same cell)
        const cellKey = `${Math.floor(targetCell.x)},${Math.floor(targetCell.y)}`;
        if (occupiedCells.has(cellKey)) return enemy;
        occupiedCells.set(cellKey, true);

        // Interpolate position between path points
        const progress = nextIndex - currentPathIndex;
        const current = enemy.path[currentPathIndex];
        const next =
          enemy.path[Math.min(currentPathIndex + 1, enemy.path.length - 1)];

        if (!current || !next) {
          return enemy;
        }

        const newPosition = {
          x: current.x + (next.x - current.x) * progress,
          y: current.y + (next.y - current.y) * progress,
        };

        return {
          ...enemy,
          pathIndex: nextIndex,
          position: newPosition,
          slowed: false, // Reset slow effect each frame
        };
      })
      .filter((e): e is Enemy => e !== null);

    const result: SystemUpdateResult = {
      spawnedEnemies: updatedEnemies,
      unspawnedEnemies: stillUnspawned,
    };

    if (livesLost > 0) {
      result.lives = Math.max(0, state.lives - livesLost);
    }

    return result;
  }
}
