import type { Projectile } from '../../game-types';
import type {
  GameState,
  GameSystem,
  SystemUpdateResult,
} from '../../store/types';

export class ProjectileSystem implements GameSystem {
  update(
    state: GameState,
    _deltaTime: number,
    _timestamp: number,
  ): SystemUpdateResult {
    const { projectiles, spawnedEnemies } = state;

    const enemiesById = new Map(
      spawnedEnemies.map((enemy) => [enemy.id, enemy]),
    );

    const updatedProjectiles = projectiles.map((projectile): Projectile => {
      const trackedEnemy =
        projectile.targetEnemyId !== undefined
          ? enemiesById.get(projectile.targetEnemyId)
          : undefined;
      const targetPosition = trackedEnemy?.position ?? projectile.target;

      return {
        ...projectile,
        position: {
          x:
            projectile.position.x +
            (targetPosition.x - projectile.position.x) * 0.3,
          y:
            projectile.position.y +
            (targetPosition.y - projectile.position.y) * 0.3,
        },
        target: trackedEnemy ? { ...trackedEnemy.position } : projectile.target,
      };
    });

    return {
      projectiles: updatedProjectiles,
    };
  }
}
