import { TOWER_STATS } from '../../constants/balance';
import type { Enemy, Projectile, Tower } from '../../game-types';
import type {
  GameState,
  GameSystem,
  SystemUpdateResult,
} from '../../store/types';
import {
  calculateFireRate,
  calculatePenetration,
  calculateTowerRange,
} from '../../utils/calculations';

export class TowerSystem implements GameSystem {
  update(
    state: GameState,
    _deltaTime: number,
    timestamp: number,
  ): SystemUpdateResult {
    const {
      towers,
      spawnedEnemies,
      projectiles,
      runUpgrade,
      gameSpeed,
      activeWavePowerUps,
    } = state;

    const newProjectiles: Projectile[] = [...projectiles];
    const updatedTowers: Tower[] = [];
    let towersModified = false;
    let projectileIdCounter = state.projectileIdCounter;

    for (const tower of towers) {
      const stats = TOWER_STATS[tower.type];
      const adjustedFireRate = calculateFireRate({
        activeWavePowerUps,
        gameSpeed,
        runUpgrade,
        tower,
      });

      // Check if tower can fire
      if (timestamp - tower.lastShot < adjustedFireRate) {
        updatedTowers.push(tower);
        continue;
      }

      // Calculate effective range with wave power-ups
      const effectiveRange = calculateTowerRange({
        activeWavePowerUps,
        baseRange: stats.range,
        towerLevel: tower.level,
      });

      // Find target
      const target = this.findTarget(
        tower,
        spawnedEnemies,
        effectiveRange,
        timestamp,
      );

      if (!target) {
        updatedTowers.push(tower);
        continue;
      }

      // Tower fires!
      towersModified = true;
      updatedTowers.push({ ...tower, lastShot: timestamp });

      // Calculate penetration
      const penetration = calculatePenetration({
        activeWavePowerUps,
        runUpgrade,
        tower,
      });

      // Calculate direction vector from tower to target
      const dx = target.position.x - tower.position.x;
      const dy = target.position.y - tower.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Normalize direction vector
      const direction =
        distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 0, y: 0 };

      // Create projectile with unique ID
      newProjectiles.push({
        direction,
        hitEnemyIds: new Set<number>(),
        id: projectileIdCounter++,
        penetrationRemaining: penetration,
        position: { ...tower.position },
        sourcePosition: { ...tower.position },
        target: { ...target.position },
        targetEnemyId: target.id,
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
