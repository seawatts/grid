import type { Projectile } from '~/lib/tower-defense/game-types';
import { getProjectileColor } from '~/lib/tower-defense/utils/rendering';

interface ProjectileRendererProps {
  projectile: Projectile;
  cellSize: number;
  isMobile: boolean;
}

export default function ProjectileRenderer({
  projectile,
  cellSize,
  isMobile,
}: ProjectileRendererProps) {
  const color = getProjectileColor(projectile.type);
  const size = isMobile ? 4 : 6;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        height: size,
        left: projectile.position.x * cellSize + cellSize / 2 - size / 2,
        top: projectile.position.y * cellSize + cellSize / 2 - size / 2,
        width: size,
      }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 ${isMobile ? '6px' : '10px'} ${color.replace('rgb', 'rgba').replace(')', ', 0.8)')}`,
        }}
      />
    </div>
  );
}
