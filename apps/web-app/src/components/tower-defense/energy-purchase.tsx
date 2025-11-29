'use client';

import { Button } from '@seawatts/ui/button';
import {
  ENERGY_PURCHASE_AMOUNT,
  ENERGY_PURCHASE_COST,
} from '~/lib/tower-defense/constants/balance';
import type { PlayerProgress } from '~/lib/tower-defense/game-types';
import {
  getTimeUntilNextEnergy,
  updateEnergy,
} from '~/lib/tower-defense/utils/energy';

interface EnergyPurchaseProps {
  progress: PlayerProgress;
  onPurchaseEnergy?: () => void;
  canPurchase?: boolean;
}

export default function EnergyPurchase({
  progress,
  onPurchaseEnergy,
  canPurchase = false,
}: EnergyPurchaseProps) {
  const updatedProgress = updateEnergy(progress);
  const timeUntilNext = getTimeUntilNextEnergy(updatedProgress);
  const isFull = updatedProgress.energy >= updatedProgress.maxEnergy;

  const formatTime = (ms: number) => {
    if (ms === 0 || ms === Number.POSITIVE_INFINITY) return 'Full';
    const minutes = Math.ceil(ms / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-gray-900/50 border border-cyan-400/30 rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-cyan-400 font-mono text-xs sm:text-sm font-bold">
          ENERGY
        </span>
        <span className="text-cyan-400 font-mono text-xs sm:text-sm">
          {Math.floor(updatedProgress.energy)}/{updatedProgress.maxEnergy}
        </span>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2.5 sm:h-3 mb-2 sm:mb-3">
        <div
          className="bg-cyan-400 h-2.5 sm:h-3 rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(
              (updatedProgress.energy / updatedProgress.maxEnergy) * 100,
              100,
            )}%`,
          }}
        />
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        {!isFull && (
          <p className="text-gray-400 text-[10px] sm:text-xs font-mono text-center">
            Next energy in: {formatTime(timeUntilNext)}
          </p>
        )}

        <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono">
          <span className="text-gray-400">Recovery rate:</span>
          <span className="text-cyan-400">
            {updatedProgress.energyRecoveryRate}/hr
          </span>
        </div>

        {onPurchaseEnergy && (
          <Button
            className="w-full bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 border border-yellow-400/50 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canPurchase || isFull}
            onClick={onPurchaseEnergy}
          >
            <span className="whitespace-nowrap">
              Purchase {ENERGY_PURCHASE_AMOUNT} Energy ({ENERGY_PURCHASE_COST}{' '}
              Gold)
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
