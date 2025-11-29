'use client';

import { TOWER_STATS } from '~/lib/tower-defense/game-constants';
import type { TowerType } from '~/lib/tower-defense/game-types';

interface TowerSelectionPopupProps {
  money: number;
  onSelect: (type: TowerType) => void;
  onClose: () => void;
}

export default function TowerSelectionPopup({
  money,
  onSelect,
  onClose,
}: TowerSelectionPopupProps) {
  return (
    <div className="absolute z-50 transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
      <div className="bg-black/90 border-2 border-cyan-500/50 rounded-lg p-2 shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-sm grid grid-cols-2 gap-2 w-48">
        {(Object.keys(TOWER_STATS) as TowerType[]).map((type) => {
          const stats = TOWER_STATS[type];
          const canAfford = money >= stats.cost;

          return (
            <button
              className={`
                relative p-2 rounded border transition-all flex flex-col items-center gap-1
                ${
                  canAfford
                    ? 'hover:bg-cyan-500/20 active:scale-95 cursor-pointer border-gray-700 hover:border-cyan-400'
                    : 'opacity-50 cursor-not-allowed border-gray-800 bg-gray-900/50'
                }
              `}
              disabled={!canAfford}
              key={type}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(type);
              }}
              style={{
                borderColor: canAfford
                  ? type === 'basic'
                    ? 'var(--tower-basic-border)'
                    : type === 'slow'
                      ? 'var(--tower-slow-border)'
                      : type === 'bomb'
                        ? 'var(--tower-bomb-border)'
                        : 'var(--tower-sniper-border)'
                  : undefined,
              }}
              type="button"
            >
              <div
                className="font-bold text-xs uppercase"
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
              <div className="text-[10px] text-gray-300">${stats.cost}</div>
            </button>
          );
        })}
      </div>

      {/* Close overlay */}
      <button
        className="fixed inset-0 z-[-1]"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        type="button"
      />
    </div>
  );
}
