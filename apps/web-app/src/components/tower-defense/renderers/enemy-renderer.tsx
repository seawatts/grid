import { ENEMY_STATS } from '~/lib/tower-defense/constants/balance';
import type { Enemy } from '~/lib/tower-defense/game-types';
import {
  getEnemyColor,
  getEnemySize,
} from '~/lib/tower-defense/utils/rendering';

interface EnemyRendererProps {
  enemy: Enemy;
  cellSize: number;
  isMobile: boolean;
}

export default function EnemyRenderer({
  enemy,
  cellSize,
  isMobile,
}: EnemyRendererProps) {
  if (!enemy.type) {
    return null;
  }

  const enemyStats = ENEMY_STATS[enemy.type];
  if (!enemyStats) {
    return null;
  }

  const color = getEnemyColor(enemy.type);
  const size = getEnemySize(enemy.type);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        height: cellSize * size,
        left: enemy.position.x * cellSize + cellSize * (0.5 - size / 2),
        top: enemy.position.y * cellSize + cellSize * (0.5 - size / 2),
        width: cellSize * size,
      }}
    >
      <div
        className="w-full h-full relative"
        style={{
          filter: `drop-shadow(0 0 ${isMobile ? '8px' : '15px'} ${color})`,
        }}
      >
        <svg
          aria-label={`${enemy.type} enemy`}
          className="w-full h-full animate-pulse"
          role="img"
          viewBox="0 0 100 100"
        >
          {enemy.type === 'boss' ? (
            <polygon
              fill={color.replace('rgb', 'rgba').replace(')', ', 0.6)')}
              points="50,5 85,25 85,75 50,95 15,75 15,25"
              stroke={color}
              strokeWidth="5"
            />
          ) : enemy.type === 'tank' ? (
            <rect
              fill={color.replace('rgb', 'rgba').replace(')', ', 0.6)')}
              height="80"
              stroke={color}
              strokeWidth="4"
              width="80"
              x="10"
              y="10"
            />
          ) : enemy.type === 'fast' ? (
            <polygon
              fill={color.replace('rgb', 'rgba').replace(')', ', 0.6)')}
              points="50,10 95,50 50,95 5,50"
              stroke={color}
              strokeWidth="3"
            />
          ) : (
            <polygon
              fill={color.replace('rgb', 'rgba').replace(')', ', 0.6)')}
              points="50,10 90,90 10,90"
              stroke={color}
              strokeWidth="4"
            />
          )}
        </svg>
      </div>

      <div className="absolute -bottom-0.5 sm:-bottom-1 left-0 w-full h-0.5 sm:h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-400 transition-all"
          style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
        />
      </div>
    </div>
  );
}
