import type { Projectile } from '../../game-types';
import type {
  GameState,
  GameSystem,
  SystemUpdateResult,
} from '../../store/types';

// Projectile speed in units per frame (approximately 0.3 per frame = fast movement)
const PROJECTILE_SPEED = 0.3;
// Max distance a projectile can travel before being removed
const MAX_PROJECTILE_DISTANCE = 20;

export class ProjectileSystem implements GameSystem {
  update(
    state: GameState,
    _deltaTime: number,
    _timestamp: number,
  ): SystemUpdateResult {
    const { projectiles } = state;

    const updatedProjectiles: Projectile[] = [];
    const removedProjectileIds = new Set<number>();

    for (const projectile of projectiles) {
      // Calculate distance from source
      const distanceTraveled = Math.sqrt(
        (projectile.position.x - projectile.sourcePosition.x) ** 2 +
          (projectile.position.y - projectile.sourcePosition.y) ** 2,
      );

      // Remove projectiles that have traveled too far
      if (distanceTraveled > MAX_PROJECTILE_DISTANCE) {
        removedProjectileIds.add(projectile.id);
        continue;
      }

      // Move projectile in straight line using direction vector
      const newPosition = {
        x: projectile.position.x + projectile.direction.x * PROJECTILE_SPEED,
        y: projectile.position.y + projectile.direction.y * PROJECTILE_SPEED,
      };

      // Check if projectile is out of reasonable bounds (assuming grid is roughly 0-20 in both axes)
      // This is a safety check - collision system will handle actual removal
      if (
        newPosition.x < -5 ||
        newPosition.x > 25 ||
        newPosition.y < -5 ||
        newPosition.y > 25
      ) {
        removedProjectileIds.add(projectile.id);
        continue;
      }

      updatedProjectiles.push({
        ...projectile,
        position: newPosition,
      });
    }

    return {
      projectiles: updatedProjectiles,
    };
  }
}
