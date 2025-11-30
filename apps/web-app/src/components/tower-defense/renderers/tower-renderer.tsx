import type { PlaceableItem, Tower } from '~/lib/tower-defense/game-types';
import { isPowerupItem } from '~/lib/tower-defense/game-types';
import {
  getPlaceableTier,
  getTowerColors,
  getTowerInsetSize,
} from '~/lib/tower-defense/utils/rendering';

interface TowerRendererProps {
  tower: Tower;
  cellSize: number;
  isSelected: boolean;
  isMobile: boolean;
  powerup?: PlaceableItem & { category: 'powerup' };
}

export default function TowerRenderer({
  tower,
  cellSize,
  isSelected,
  isMobile,
  powerup,
}: TowerRendererProps) {
  const colors = getTowerColors(tower.type);
  const insetSize = getTowerInsetSize(tower.level);
  const powerupTier =
    powerup && isPowerupItem(powerup) ? getPlaceableTier(powerup) : null;

  const left = tower.position.x * cellSize + cellSize / 4;
  const top = tower.position.y * cellSize + cellSize / 4;
  const size = cellSize / 2;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        height: size,
        left,
        top,
        width: size,
      }}
    >
      {isSelected && (
        <div
          className="absolute -inset-1 rounded-sm animate-pulse"
          style={{
            border: '2px solid white',
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.8)',
            zIndex: 10,
          }}
        />
      )}

      <div
        className="w-full h-full rounded-sm border-2 relative overflow-hidden animate-pulse"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.border,
          boxShadow: `0 0 ${isMobile ? '10px' : '20px'} ${colors.boxShadow}`,
          zIndex: 20,
        }}
      >
        {insetSize > 0 && (
          <div
            className="absolute transition-all duration-300"
            style={{
              backgroundColor: colors.background.replace('0.3', '0.6'),
              bottom: `${insetSize}%`,
              left: `${insetSize}%`,
              right: `${insetSize}%`,
              top: `${insetSize}%`,
            }}
          />
        )}
      </div>

      {powerupTier && (
        <>
          <div
            className="absolute -inset-2 rounded-sm animate-pulse"
            style={{
              border: `2px solid ${powerupTier.color}`,
              boxShadow: `0 0 ${powerupTier.tier * 15}px ${powerupTier.glowColor}`,
              zIndex: -1,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div
              className={`${powerupTier.tier >= 3 ? 'text-pink-400' : 'text-yellow-400'} font-bold text-xs drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]`}
            >
              {powerupTier.icon}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
