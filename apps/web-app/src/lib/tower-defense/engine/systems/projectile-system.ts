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
    const { projectiles } = state;

    const updatedProjectiles = projectiles.map(
      (p): Projectile => ({
        ...p,
        position: {
          x: p.position.x + (p.target.x - p.position.x) * 0.3,
          y: p.position.y + (p.target.y - p.position.y) * 0.3,
        },
      }),
    );

    return {
      projectiles: updatedProjectiles,
    };
  }
}
