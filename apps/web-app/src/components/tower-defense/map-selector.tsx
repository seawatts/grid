'use client';

import { Button } from '@seawatts/ui/button';
import { GAME_MAPS } from '~/lib/tower-defense/game-maps';

interface MapSelectorProps {
  selectedMapId: string;
  onSelectMap: (mapId: string) => void;
}

export default function MapSelector({
  selectedMapId,
  onSelectMap,
}: MapSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-cyan-400 text-lg sm:text-xl font-mono text-center mb-4">
        SELECT BATTLEFIELD
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GAME_MAPS.map((map) => {
          const isSelected = selectedMapId === map.id;
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
              <div className="space-y-1">
                <div className="font-bold text-sm sm:text-base">{map.name}</div>
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
