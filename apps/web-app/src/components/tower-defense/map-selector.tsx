'use client';

import { Button } from '@seawatts/ui/button';
import { GAME_MAPS } from '~/lib/tower-defense/game-maps';
import type { MapRating } from '~/lib/tower-defense/game-types';

interface MapSelectorProps {
  selectedMapId: string;
  onSelectMap: (mapId: string) => void;
  mapRatings?: Record<string, MapRating>;
}

export default function MapSelector({
  selectedMapId,
  onSelectMap,
  mapRatings = {},
}: MapSelectorProps) {
  const renderStarRating = (rating: MapRating | undefined) => {
    const currentRating = rating ?? 0;

    return (
      <div
        className="flex items-center gap-1.5"
        title={`Rating: ${currentRating}/3 stars`}
      >
        {[1, 2, 3].map((star) => {
          const isActive = star <= currentRating;
          return (
            <svg
              className={`w-6 h-6 shrink-0 transition-all ${
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
    <div className="space-y-4">
      <h3 className="text-cyan-400 text-lg sm:text-xl font-mono text-center mb-4">
        SELECT BATTLEFIELD
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GAME_MAPS.map((map) => {
          const isSelected = selectedMapId === map.id;
          const rating = mapRatings[map.id];
          return (
            <Button
              className={`
                relative group px-4 py-6 text-left font-mono transition-all
                ${
                  isSelected
                    ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-400'
                    : 'bg-gray-800/20 border border-gray-600 text-gray-400 hover:border-cyan-400/50 hover:text-cyan-400'
                }
              `}
              key={map.id}
              onClick={() => onSelectMap(map.id)}
              style={{
                boxShadow: isSelected
                  ? '0 0 20px rgba(6, 182, 212, 0.5)'
                  : 'none',
              }}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-sm sm:text-base flex-1">
                    {map.name}
                  </div>
                  <div className="shrink-0">{renderStarRating(rating)}</div>
                </div>
                <div className="text-xs opacity-70">{map.description}</div>
              </div>
              {isSelected && (
                <div className="absolute inset-0 bg-cyan-400/10 pointer-events-none" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
