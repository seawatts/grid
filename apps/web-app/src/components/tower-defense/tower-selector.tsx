'use client';

import { TOWER_STATS } from '~/lib/tower-defense/game-constants';
import type { TowerType } from '~/lib/tower-defense/game-types';

export default function TowerSelector({
  selectedTowerType,
  money,
  gameStatus,
  onSelectTower,
}: {
  selectedTowerType: TowerType | null;
  money: number;
  gameStatus: 'playing' | 'won' | 'lost';
  onSelectTower: (type: TowerType | null) => void;
  isMobile: boolean;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {(Object.keys(TOWER_STATS) as TowerType[]).map((type) => (
        <button
          className={`px-2 py-2 sm:px-3 sm:py-3 border-2 transition-all disabled:opacity-30 active:scale-95 font-bold rounded ${
            selectedTowerType === type
              ? ''
              : 'bg-black/50 border-gray-600 hover:border-cyan-400'
          }`}
          disabled={money < TOWER_STATS[type].cost || gameStatus !== 'playing'}
          key={type}
          onClick={() =>
            onSelectTower(selectedTowerType === type ? null : type)
          }
          style={{
            backgroundColor:
              selectedTowerType === type
                ? type === 'basic'
                  ? 'rgba(6, 182, 212, 0.2)'
                  : type === 'slow'
                    ? 'rgba(168, 85, 247, 0.2)'
                    : type === 'bomb'
                      ? 'rgba(236, 72, 153, 0.2)'
                      : 'rgba(34, 197, 94, 0.2)'
                : undefined,
            borderColor:
              selectedTowerType === type
                ? type === 'basic'
                  ? 'rgb(6, 182, 212)'
                  : type === 'slow'
                    ? 'rgb(168, 85, 247)'
                    : type === 'bomb'
                      ? 'rgb(236, 72, 153)'
                      : 'rgb(34, 197, 94)'
                : type === 'basic'
                  ? 'rgba(6, 182, 212, 0.5)'
                  : type === 'slow'
                    ? 'rgba(168, 85, 247, 0.5)'
                    : type === 'bomb'
                      ? 'rgba(236, 72, 153, 0.5)'
                      : 'rgba(34, 197, 94, 0.5)',
            boxShadow:
              selectedTowerType === type
                ? type === 'basic'
                  ? '0 0 20px rgba(6, 182, 212, 0.5)'
                  : type === 'slow'
                    ? '0 0 20px rgba(168, 85, 247, 0.5)'
                    : type === 'bomb'
                      ? '0 0 20px rgba(236, 72, 153, 0.5)'
                      : '0 0 20px rgba(34, 197, 94, 0.5)'
                : 'none',
            minHeight: '50px',
          }}
          type="button"
        >
          <div
            className="font-bold text-xs sm:text-sm uppercase leading-tight"
            style={{
              color:
                type === 'basic'
                  ? 'rgb(6, 182, 212)'
                  : type === 'slow'
                    ? 'rgb(168, 85, 247)'
                    : type === 'bomb'
                      ? 'rgb(236, 72, 153)'
                      : 'rgb(34, 197, 94)',
            }}
          >
            {type}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
            ${TOWER_STATS[type].cost}
          </div>

          <div className="text-[9px] sm:text-[10px] text-gray-300 mt-1 flex flex-col sm:flex-row justify-center gap-x-2 leading-tight opacity-80">
            <span>Dmg: {TOWER_STATS[type].damage}</span>
            <span>Rng: {TOWER_STATS[type].range}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
