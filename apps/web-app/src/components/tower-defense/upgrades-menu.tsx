'use client';

import { Button } from '@seawatts/ui/button';
import { ArrowUp, Bomb, Zap } from 'lucide-react';
import { UPGRADES } from '~/lib/tower-defense/game-constants';
import type {
  PlayerProgress,
  UpgradeType,
} from '~/lib/tower-defense/game-types';

interface UpgradesMenuProps {
  progress: PlayerProgress;
  onPurchase: (upgradeId: UpgradeType) => void;
  onClose: () => void;
}

export default function UpgradesMenu({
  progress,
  onPurchase,
  onClose,
}: UpgradesMenuProps) {
  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <div
        className="w-full max-w-4xl bg-gray-900/90 border-2 border-cyan-500/50 rounded-lg p-6 sm:p-8 relative overflow-hidden flex flex-col max-h-[90vh]"
        style={{ boxShadow: '0 0 50px rgba(6, 182, 212, 0.2)' }}
      >
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg
            aria-label="Background grid pattern"
            className="w-full h-full"
            role="img"
          >
            <pattern
              height="20"
              id="upgrade-grid"
              patternUnits="userSpaceOnUse"
              width="20"
            >
              <path
                className="text-cyan-500"
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
            <rect fill="url(#upgrade-grid)" height="100%" width="100%" />
          </svg>
        </div>

        {/* Header */}
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              SYSTEM UPGRADES
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Enhance grid capabilities and defensive protocols
            </p>
          </div>
          <div className="flex items-center gap-2 bg-cyan-950/50 px-4 py-2 rounded border border-cyan-500/30">
            <div className="text-yellow-400 font-bold text-xl">★</div>
            <div className="text-cyan-100 font-mono text-xl">
              {progress.techPoints} TP
            </div>
          </div>
        </div>

        {/* Upgrades Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {Object.values(UPGRADES).map((upgrade) => {
            const currentLevel =
              progress.upgrades[upgrade.id as UpgradeType] || 0;
            const isMaxed = currentLevel >= upgrade.maxLevel;
            const nextCost = isMaxed ? 0 : upgrade.costs[currentLevel];
            const canAfford = progress.techPoints >= nextCost;
            const currentEffect = upgrade.effects[currentLevel];
            const nextEffect = isMaxed
              ? null
              : upgrade.effects[currentLevel + 1];

            return (
              <div
                className={`relative p-4 rounded border transition-all ${
                  isMaxed
                    ? 'bg-cyan-900/20 border-cyan-500/50'
                    : canAfford
                      ? 'bg-gray-800/50 border-gray-700 hover:border-cyan-500/50'
                      : 'bg-gray-900/50 border-gray-800 opacity-75'
                }`}
                key={upgrade.id}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded ${upgrade.id.includes('power') ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}
                    >
                      {upgrade.id.includes('power') ? (
                        <Zap size={20} />
                      ) : (
                        <Bomb size={20} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-100">
                        {upgrade.name}
                      </h3>
                      <div className="flex gap-1 mt-1">
                        {[...Array(upgrade.maxLevel)].map((_, i) => (
                          <div
                            className={`w-8 h-1.5 rounded-full ${i < currentLevel ? 'bg-cyan-400' : 'bg-gray-700'}`}
                            key={`${upgrade.type}-level-${i}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {!isMaxed && (
                    <div className="text-right">
                      <div
                        className={`font-mono font-bold ${canAfford ? 'text-yellow-400' : 'text-gray-500'}`}
                      >
                        {nextCost} TP
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-400 mb-4 min-h-[40px]">
                  {upgrade.description}
                </p>

                <div className="flex justify-between items-center bg-black/30 p-2 rounded mb-4 text-sm font-mono">
                  <div className="text-gray-300">
                    Current:{' '}
                    <span className="text-cyan-400">
                      {currentEffect}
                      {upgrade.id.includes('Frequency')
                        ? '/wave'
                        : upgrade.id.includes('Potency')
                          ? 'x'
                          : ''}
                    </span>
                  </div>
                  {!isMaxed && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <ArrowUp size={14} />
                      <span className="text-green-400">
                        {nextEffect}
                        {upgrade.id.includes('Frequency')
                          ? '/wave'
                          : upgrade.id.includes('Potency')
                            ? 'x'
                            : ''}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  className={`w-full h-10 font-bold ${
                    isMaxed
                      ? 'bg-transparent text-cyan-400 border border-cyan-500/30 cursor-default'
                      : canAfford
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={isMaxed || !canAfford}
                  onClick={() => onPurchase(upgrade.id as UpgradeType)}
                >
                  {isMaxed
                    ? 'MAX LEVEL'
                    : canAfford
                      ? 'UPGRADE'
                      : 'INSUFFICIENT TP'}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end pt-4 border-t border-gray-800">
          <Button
            className="bg-gray-800 hover:bg-gray-700 text-white px-8"
            onClick={onClose}
          >
            CLOSE
          </Button>
        </div>
      </div>
    </div>
  );
}
