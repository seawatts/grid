import { TOWER_STATS } from '../../constants/balance';
import type { Enemy, Projectile, Tower } from '../../game-types';
import type {
  GameState,
  GameSystem,
  SystemUpdateResult,
} from '../../store/types';
import { calculateFireRate } from '../../utils/calculations';

export class TowerSystem implements GameSystem {
  update(
    state: GameState,
    _deltaTime: number,
    timestamp: number,
  ): SystemUpdateResult {
    const { towers, spawnedEnemies, projectiles, runUpgrade, gameSpeed } =
      state;

    const newProjectiles: Projectile[] = [...projectiles];
    const updatedTowers: Tower[] = [];
    let towersModified = false;
    let projectileIdCounter = state.projectileIdCounter;

    for (const tower of towers) {
      const stats = TOWER_STATS[tower.type];
      const adjustedFireRate = calculateFireRate({
        gameSpeed,
        runUpgrade,
        tower,
      });

      // Check if tower can fire
      if (timestamp - tower.lastShot < adjustedFireRate) {
        updatedTowers.push(tower);
        continue;
      }

      // Find target
      const target = this.findTarget(
        tower,
        spawnedEnemies,
        stats.range,
        timestamp,
      );

      if (!target) {
        updatedTowers.push(tower);
        continue;
      }

      // Tower fires!
      towersModified = true;
      updatedTowers.push({ ...tower, lastShot: timestamp });

      // Create projectile with unique ID
      newProjectiles.push({
        id: projectileIdCounter++,
        position: { ...tower.position },
        sourcePosition: { ...tower.position },
        target: { ...target.position },
        type: tower.type,
      });
    }

    const result: SystemUpdateResult = {};

    if (towersModified) {
      result.towers = updatedTowers;
    }

    if (newProjectiles.length > projectiles.length) {
      result.projectiles = newProjectiles;
      result.projectileIdCounter = projectileIdCounter;
    }

    return result;
  }

  private findTarget(
    tower: Tower,
    enemies: Enemy[],
    range: number,
    _timestamp: number,
  ): Enemy | null {
    let targetEnemy: Enemy | null = null;
    let maxProgress = -1;

    for (const enemy of enemies) {
      if (!enemy || !enemy.position) continue;

      const dist = Math.sqrt(
        (enemy.position.x - tower.position.x) ** 2 +
          (enemy.position.y - tower.position.y) ** 2,
      );

      if (dist <= range && enemy.pathIndex > maxProgress) {
        maxProgress = enemy.pathIndex;
        targetEnemy = enemy;
      }
    }

    return targetEnemy;
  }
}
