'use client';

import { Button } from '@seawatts/ui/button';
import { Activity, Coins, Heart, Trophy, Zap } from 'lucide-react';
import type { RunUpgrade } from '~/lib/tower-defense/game-types';

interface RunUpgradeSelectorProps {
  upgrades: RunUpgrade[];
  onSelect: (upgrade: RunUpgrade) => void;
}

export default function RunUpgradeSelector({
  upgrades,
  onSelect,
}: RunUpgradeSelectorProps) {
  const getIcon = (icon: string) => {
    switch (icon) {
      case 'money':
        return <Coins className="w-8 h-8 text-yellow-400" />;
      case 'health':
        return <Heart className="w-8 h-8 text-red-400" />;
      case 'damage':
        return <Zap className="w-8 h-8 text-cyan-400" />;
      case 'speed':
        return <Activity className="w-8 h-8 text-purple-400" />;
      case 'reward':
        return <Trophy className="w-8 h-8 text-green-400" />;
      default:
        return <Zap className="w-8 h-8 text-cyan-400" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
          TACTICAL ADVANTAGE
        </h2>
        <p className="text-gray-400 font-mono">
          SELECT ONE BONUS FOR THIS MISSION
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {upgrades.map((upgrade, index) => (
          <Button
            className="h-auto flex flex-col items-center p-6 sm:p-8 bg-gray-900/80 border border-gray-700 hover:border-cyan-400 hover:bg-gray-800/90 transition-all group relative overflow-hidden"
            key={upgrade.id}
            onClick={() => onSelect(upgrade)}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="mb-4 p-4 rounded-full bg-gray-800 group-hover:bg-gray-700 transition-colors border border-gray-700 group-hover:border-cyan-500/30 relative z-10">
              {getIcon(upgrade.icon)}
            </div>

            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors relative z-10">
              {upgrade.name}
            </h3>

            <p className="text-sm text-gray-400 text-center group-hover:text-gray-300 transition-colors relative z-10">
              {upgrade.description}
            </p>

            <div className="mt-6 px-4 py-2 rounded bg-gray-800/50 border border-gray-700 text-xs font-mono text-cyan-500 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 relative z-10">
              SELECT UPGRADE
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
