'use client';

import { Button } from '@seawatts/ui/button';
import { DrawerClose, DrawerHeader, DrawerTitle } from '@seawatts/ui/drawer';
import { X } from 'lucide-react';
import { TOWER_STATS } from '~/lib/tower-defense/game-constants';
import type { Tower } from '~/lib/tower-defense/game-types';

export default function TowerManagement({
  tower,
  money,
  onUpgrade,
  onDelete,
  onClose,
}: {
  tower: Tower;
  money: number;
  onUpgrade: (tower: Tower) => void;
  onDelete: (tower: Tower) => void;
  onClose: () => void;
}) {
  const stats = TOWER_STATS[tower.type];
  const upgradeCost = stats.cost * tower.level;
  const canUpgrade = tower.level < 3 && money >= upgradeCost;
  const refundAmount = Math.floor(stats.cost * 0.5 * tower.level);

  const towerColors = {
    basic: {
      bg: 'rgba(6, 182, 212, 0.2)',
      border: 'rgb(6, 182, 212)',
      shadow: 'rgba(6, 182, 212, 0.5)',
    },
    bomb: {
      bg: 'rgba(236, 72, 153, 0.2)',
      border: 'rgb(236, 72, 153)',
      shadow: 'rgba(236, 72, 153, 0.5)',
    },
    slow: {
      bg: 'rgba(168, 85, 247, 0.2)',
      border: 'rgb(168, 85, 247)',
      shadow: 'rgba(168, 85, 247, 0.5)',
    },
    sniper: {
      bg: 'rgba(34, 197, 94, 0.2)',
      border: 'rgb(34, 197, 94)',
      shadow: 'rgba(34, 197, 94, 0.5)',
    },
  };

  const color = towerColors[tower.type];

  return (
    <>
      <DrawerHeader className="border-b border-cyan-500/30 px-4 py-4">
        <div className="flex justify-between items-center w-full">
          <div className="flex-1">
            <DrawerTitle
              className="text-lg font-bold uppercase m-0"
              style={{ color: color.border }}
            >
              {tower.type} Tower • Level {tower.level}
            </DrawerTitle>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
              Damage: {stats.damage * tower.level} • Range: {stats.range} • Fire
              Rate: {stats.fireRate}ms
            </p>
          </div>
          <DrawerClose asChild>
            <Button
              className="h-8 w-8 p-0 hover:bg-white/10 text-gray-400 hover:text-white"
              onClick={onClose}
              size="icon"
              variant="ghost"
            >
              <X className="w-4 h-4" />
            </Button>
          </DrawerClose>
        </div>
      </DrawerHeader>
      <div className="px-4 py-6">
        <div
          className="p-3 sm:p-4 rounded-lg border-2"
          style={{
            backgroundColor: color.bg,
            borderColor: color.border,
            boxShadow: `0 0 20px ${color.shadow}`,
          }}
        >
          <div className="flex gap-2">
            <Button
              className="flex-1 h-10 sm:h-12 text-xs sm:text-sm font-bold border-2 transition-all active:scale-95"
              disabled={!canUpgrade}
              onClick={() => onUpgrade(tower)}
              style={{
                backgroundColor: canUpgrade
                  ? `${color.bg}`
                  : 'rgba(100, 100, 100, 0.2)',
                borderColor: canUpgrade ? color.border : 'rgb(100, 100, 100)',
                boxShadow: canUpgrade ? `0 0 15px ${color.shadow}` : 'none',
                color: canUpgrade ? color.border : 'rgb(150, 150, 150)',
                opacity: canUpgrade ? 1 : 0.5,
              }}
            >
              {tower.level >= 3 ? 'MAX LEVEL' : `UPGRADE • $${upgradeCost}`}
            </Button>
            <Button
              className="h-10 sm:h-12 px-4 sm:px-6 text-xs sm:text-sm font-bold bg-red-500/20 hover:bg-red-500/40 text-red-400 border-2 border-red-400 transition-all active:scale-95"
              onClick={() => onDelete(tower)}
              style={{ boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)' }}
            >
              DELETE • +${refundAmount}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
