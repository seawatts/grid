import AnimatedLine from '~/components/animated-line';
import type {
  Landmine,
  Position,
  PowerUp,
} from '~/lib/tower-defense/game-types';
import {
  getLandmineTier,
  getPowerupTier,
} from '~/lib/tower-defense/utils/rendering';

interface GridCellProps {
  x: number;
  y: number;
  cell: string;
  cellSize: number;
  debugPaths: Position[][];
  animatedPathLengths: number[];
  touchFeedback: Position | null;
  powerup?: PowerUp;
  landmine?: Landmine;
  hasTower: boolean;
  onClick: (x: number, y: number) => void;
}

export default function GridCell({
  x,
  y,
  cell,
  cellSize,
  debugPaths,
  animatedPathLengths,
  touchFeedback,
  powerup,
  landmine,
  hasTower,
  onClick,
}: GridCellProps) {
  const powerupTier = powerup ? getPowerupTier(powerup.boost) : null;
  const landmineTier = landmine ? getLandmineTier(landmine.damage) : null;

  return (
    <button
      className="absolute cursor-pointer transition-colors active:bg-cyan-500/20 hover:bg-cyan-500/10"
      onClick={() => onClick(x, y)}
      style={{
        height: cellSize,
        left: x * cellSize,
        top: y * cellSize,
        width: cellSize,
      }}
      type="button"
    >
      {touchFeedback?.x === x && touchFeedback?.y === y && (
        <div className="absolute inset-0 bg-cyan-400/30 animate-ping" />
      )}

      {/* Debug path overlay */}
      {debugPaths.map((path, pathIdx) => {
        const animatedLength = animatedPathLengths[pathIdx] || 0;
        const visiblePath = path.slice(0, animatedLength);
        const pathIndex = visiblePath.findIndex((p) => p.x === x && p.y === y);

        if (pathIndex === -1) return null;

        const current = visiblePath[pathIndex];
        if (!current) return null;

        const prev = pathIndex > 0 ? visiblePath[pathIndex - 1] : null;
        const next =
          pathIndex < visiblePath.length - 1
            ? visiblePath[pathIndex + 1]
            : null;

        let showTop = false;
        let showBottom = false;
        let showLeft = false;
        let showRight = false;

        if (prev) {
          const dx = current.x - prev.x;
          const dy = current.y - prev.y;
          if (dx !== 0) {
            showTop = true;
            showBottom = true;
          } else if (dy !== 0) {
            showLeft = true;
            showRight = true;
          }
        }

        if (next) {
          const dx = next.x - current.x;
          const dy = next.y - current.y;
          if (dx !== 0) {
            showTop = true;
            showBottom = true;
          } else if (dy !== 0) {
            showLeft = true;
            showRight = true;
          }
        }

        const colors: ('cyan' | 'pink' | 'purple')[] = [
          'cyan',
          'pink',
          'purple',
        ];
        const pathColor = colors[pathIdx % 3] ?? 'cyan';

        // Delay based on position in path so animation happens after cell appears
        const animationDelay = pathIndex * 50; // 50ms per cell in path

        return (
          <div
            className="absolute inset-0 pointer-events-none"
            key={`path-${pathIdx}-${x}-${y}`}
          >
            {showTop && (
              <AnimatedLine
                animate={true}
                className="!h-[3px]"
                color={pathColor}
                delay={animationDelay}
                direction="horizontal"
                key={`path-${pathIdx}-${x}-${y}-top`}
                position="0"
              />
            )}
            {showBottom && (
              <AnimatedLine
                animate={true}
                className="!h-[3px] !top-auto !bottom-0"
                color={pathColor}
                delay={animationDelay}
                direction="horizontal"
                key={`path-${pathIdx}-${x}-${y}-bottom`}
                position="100%"
              />
            )}
            {showLeft && (
              <AnimatedLine
                animate={true}
                className="!w-[3px]"
                color={pathColor}
                delay={animationDelay}
                direction="vertical"
                key={`path-${pathIdx}-${x}-${y}-left`}
                position="0"
              />
            )}
            {showRight && (
              <AnimatedLine
                animate={true}
                className="!w-[3px] !left-auto !right-0"
                color={pathColor}
                delay={animationDelay}
                direction="vertical"
                key={`path-${pathIdx}-${x}-${y}-right`}
                position="100%"
              />
            )}
          </div>
        );
      })}

      {/* Cell type overlays */}
      {cell === 'obstacle' && (
        <div
          className="absolute inset-1 bg-gray-600/40 border border-gray-500 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 10px rgba(107, 114, 128, 0.5)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/20 to-transparent" />
        </div>
      )}

      {cell === 'start' && (
        <div className="absolute inset-3 bg-green-500/30 border-2 border-green-400" />
      )}
      {cell === 'goal' && (
        <div className="absolute inset-3 bg-red-500/30 border-2 border-red-400" />
      )}

      {/* Powerup display */}
      {powerupTier && !hasTower && cell !== 'tower' && (
        <div className="absolute inset-2 pointer-events-none">
          <div
            className="w-full h-full rounded-full animate-pulse"
            style={{
              backgroundColor:
                powerupTier.tier >= 3
                  ? 'rgba(236, 72, 153, 0.3)'
                  : 'rgba(250, 204, 21, 0.3)',
              border: `2px solid ${powerupTier.color}`,
              boxShadow: `0 0 ${powerupTier.tier * 15}px ${powerupTier.glowColor}`,
            }}
          >
            <div
              className={`absolute inset-0 flex items-center justify-center font-bold text-xs ${powerupTier.tier >= 3 ? 'text-pink-400' : 'text-yellow-400'}`}
            >
              {powerupTier.icon}
            </div>
          </div>
        </div>
      )}

      {/* Landmine display */}
      {landmineTier && (
        <div className="absolute inset-2 pointer-events-none">
          <div
            className="w-full h-full rounded-sm animate-pulse"
            style={{
              animationDuration: landmineTier.tier >= 3 ? '0.5s' : '1s',
              backgroundColor:
                landmineTier.tier >= 3
                  ? 'rgba(168, 85, 247, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)',
              border: `2px solid ${landmineTier.color}`,
              boxShadow: `0 0 ${landmineTier.tier * 15}px ${landmineTier.glowColor}`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`w-1/2 h-1/2 rounded-full ${landmineTier.tier >= 3 ? 'bg-purple-500' : 'bg-red-500'}`}
              />
            </div>
          </div>
        </div>
      )}
    </button>
  );
}
