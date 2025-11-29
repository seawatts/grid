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
                  ? 'var(--tower-basic-bg-20)'
                  : type === 'slow'
                    ? 'var(--tower-slow-bg-20)'
                    : type === 'bomb'
                      ? 'var(--tower-bomb-bg-20)'
                      : 'var(--tower-sniper-bg-20)'
                : undefined,
            borderColor:
              selectedTowerType === type
                ? type === 'basic'
                  ? 'var(--tower-basic-border)'
                  : type === 'slow'
                    ? 'var(--tower-slow-border)'
                    : type === 'bomb'
                      ? 'var(--tower-bomb-border)'
                      : 'var(--tower-sniper-border)'
                : type === 'basic'
                  ? 'var(--tower-basic-border-50)'
                  : type === 'slow'
                    ? 'var(--tower-slow-border-50)'
                    : type === 'bomb'
                      ? 'var(--tower-bomb-border-50)'
                      : 'var(--tower-sniper-border-50)',
            boxShadow:
              selectedTowerType === type
                ? type === 'basic'
                  ? '0 0 20px var(--tower-basic-shadow)'
                  : type === 'slow'
                    ? '0 0 20px var(--tower-slow-shadow)'
                    : type === 'bomb'
                      ? '0 0 20px var(--tower-bomb-shadow)'
                      : '0 0 20px var(--tower-sniper-shadow)'
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
                  ? 'var(--tower-basic-color)'
                  : type === 'slow'
                    ? 'var(--tower-slow-color)'
                    : type === 'bomb'
                      ? 'var(--tower-bomb-color)'
                      : 'var(--tower-sniper-color)',
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
