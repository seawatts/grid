'use client';

import { Button } from '@seawatts/ui/button';
import { Check, X } from 'lucide-react';
import { TOWER_STATS } from '~/lib/tower-defense/game-constants';
import type { TowerType } from '~/lib/tower-defense/game-types';

interface TowerPlacementStatsProps {
  type: TowerType;
  onPlace: () => void;
  onCancel: () => void;
}

export default function TowerPlacementStats({
  type,
  onPlace,
  onCancel,
}: TowerPlacementStatsProps) {
  const stats = TOWER_STATS[type];

  const color =
    type === 'basic'
      ? 'var(--tower-basic-color)'
      : type === 'slow'
        ? 'var(--tower-slow-color)'
        : type === 'bomb'
          ? 'var(--tower-bomb-color)'
          : 'var(--tower-sniper-color)';

  return (
    <div className="w-full bg-black/80 border-t border-cyan-500/30 p-4 flex items-center justify-between gap-4 backdrop-blur-md">
      <div className="flex items-center gap-4 flex-1">
        <div
          className="w-12 h-12 rounded border-2 flex items-center justify-center font-bold text-xl uppercase"
          style={{
            backgroundColor: color
              .replace('rgb', 'rgba')
              .replace(')', ', 0.1)'),
            borderColor: color,
            boxShadow: `0 0 15px ${color.replace('rgb', 'rgba').replace(')', ', 0.3)')}`,
            color: color,
          }}
        >
          {type[0]}
        </div>

        <div className="flex flex-col gap-1">
          <div
            className="font-bold text-lg uppercase tracking-wider"
            style={{ color }}
          >
            {type} TOWER
          </div>
          <div className="flex gap-4 text-xs sm:text-sm text-gray-300 font-mono">
            <span className="flex items-center gap-1">
              <span className="text-gray-500">DMG:</span> {stats.damage}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-gray-500">RNG:</span> {stats.range}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-gray-500">SPD:</span>{' '}
              {(1000 / stats.fireRate).toFixed(1)}/s
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          className="border-red-500/50 text-red-400 hover:bg-red-950/30 hover:text-red-300 h-12 w-12 p-0 rounded-full bg-transparent"
          onClick={onCancel}
          variant="outline"
        >
          <X className="w-6 h-6" />
        </Button>

        <Button
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 px-6 rounded-full flex items-center gap-2 transition-all active:scale-95"
          onClick={onPlace}
          style={{ boxShadow: '0 0 20px var(--ui-primary-cyan-shadow-30)' }}
        >
          <Check className="w-5 h-5" />
          PLACE
        </Button>
      </div>
    </div>
  );
}
