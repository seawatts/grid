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
  const lineLength = isMobile ? 8 : 10;
  const lineWidth = isMobile ? 2 : 2.5;

  // Calculate rotation angle from direction vector
  const angle =
    Math.atan2(projectile.direction.y, projectile.direction.x) *
    (180 / Math.PI);

  // Calculate center position
  const centerX = projectile.position.x * cellSize + cellSize / 2;
  const centerY = projectile.position.y * cellSize + cellSize / 2;

  // Convert color to rgba for glow effect
  const colorWithAlpha = color.replace('rgb', 'rgba').replace(')', ', 0.8)');

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        height: lineWidth,
        left: centerX - lineLength / 2,
        top: centerY - lineWidth / 2,
        transform: `rotate(${angle}deg)`,
        transformOrigin: 'center center',
        width: lineLength,
      }}
    >
      <div
        className="w-full h-full"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 ${isMobile ? '4px' : '6px'} ${colorWithAlpha}`,
        }}
      />
    </div>
  );
}
