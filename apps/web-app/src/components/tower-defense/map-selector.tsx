'use client';

import { Button } from '@seawatts/ui/button';
import { ENERGY_COST_PER_MAP } from '~/lib/tower-defense/constants/balance';
import { GAME_MAPS } from '~/lib/tower-defense/game-maps';
import type { MapRating, PlayerProgress } from '~/lib/tower-defense/game-types';
import { updateEnergy } from '~/lib/tower-defense/utils/energy';

interface MapSelectorProps {
  selectedMapId: string;
  onSelectMap: (mapId: string) => void;
  mapRatings?: Record<string, MapRating>;
  progress: PlayerProgress;
}

export default function MapSelector({
  selectedMapId,
  onSelectMap,
  mapRatings = {},
  progress,
}: MapSelectorProps) {
  const updatedProgress = updateEnergy(progress);
  const hasEnoughEnergy = updatedProgress.energy >= ENERGY_COST_PER_MAP;
  const renderStarRating = (rating: MapRating | undefined) => {
    const currentRating = rating ?? 0;

    return (
      <div
        className="flex items-center gap-0.5 sm:gap-1"
        title={`Rating: ${currentRating}/3 stars`}
      >
        {[1, 2, 3].map((star) => {
          const isActive = star <= currentRating;
          return (
            <svg
              className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-all ${
                isActive
                  ? 'drop-shadow-[0_0_8px_rgba(6,182,212,1),0_0_12px_rgba(6,182,212,0.8)]'
                  : 'opacity-60'
              }`}
              fill={isActive ? 'rgb(6, 182, 212)' : 'none'}
              key={star}
              stroke={isActive ? 'rgb(6, 182, 212)' : 'rgb(156, 163, 175)'}
              strokeWidth={isActive ? '2' : '1.5'}
              viewBox="0 0 24 24"
            >
              <title>{`Star ${star} - ${isActive ? 'Active' : 'Inactive'}`}</title>
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-cyan-400 text-base sm:text-lg lg:text-xl font-mono text-center mb-3 sm:mb-4">
        SELECT BATTLEFIELD
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        {GAME_MAPS.map((map) => {
          const isSelected = selectedMapId === map.id;
          const rating = mapRatings[map.id];
          return (
            <Button
              className={`
                relative group px-3 sm:px-4 py-2.5 sm:py-3 text-left font-mono transition-all w-full
                h-auto items-start
                ${
                  isSelected
                    ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-400'
                    : hasEnoughEnergy
                      ? 'bg-gray-800/20 border border-gray-600 text-gray-400 hover:bg-gray-800/40 hover:border-cyan-400 hover:text-cyan-300'
                      : 'bg-gray-800/10 border border-gray-700 text-gray-600 opacity-50 cursor-not-allowed'
                }
              `}
              disabled={!hasEnoughEnergy}
              key={map.id}
              onClick={() => onSelectMap(map.id)}
              onMouseEnter={(e) => {
                if (hasEnoughEnergy && !isSelected) {
                  e.currentTarget.style.boxShadow =
                    '0 0 15px rgba(6, 182, 212, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (hasEnoughEnergy && !isSelected) {
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
              style={{
                boxShadow: isSelected
                  ? '0 0 20px rgba(6, 182, 212, 0.5)'
                  : hasEnoughEnergy
                    ? undefined
                    : 'none',
              }}
            >
              <div className="flex flex-col w-full gap-1.5 sm:gap-2 relative z-10">
                {/* Title row: Map name and stars */}
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="font-bold text-sm sm:text-base flex-1 min-w-0">
                    <span className="block truncate">{map.name}</span>
                  </div>
                  <div className="shrink-0">{renderStarRating(rating)}</div>
                </div>

                {/* Energy cost row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] sm:text-xs text-yellow-400 font-mono whitespace-nowrap">
                    ⚡ {ENERGY_COST_PER_MAP} Energy
                  </span>
                  {!hasEnoughEnergy && (
                    <span className="text-[10px] sm:text-xs text-red-400 font-mono whitespace-nowrap">
                      (Insufficient)
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="text-[10px] sm:text-xs opacity-60 leading-tight">
                  {map.description}
                </div>
              </div>
              {isSelected && (
                <div className="absolute inset-0 bg-cyan-400/10 pointer-events-none z-0" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
