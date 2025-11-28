'use client';

import {
  Coins,
  Heart,
  type LucideIcon,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { WavePowerUp } from '~/lib/tower-defense/game-types';

interface PowerUpSelectorProps {
  powerUps: WavePowerUp[];
  onSelect: (powerUp: WavePowerUp) => void;
}

const iconMap: Record<WavePowerUp['icon'], LucideIcon> = {
  damage: Zap,
  health: Heart,
  money: Coins,
  range: Target,
  reward: TrendingUp,
  speed: Target,
};

function formatDuration(duration: WavePowerUp['duration']): string {
  if (duration === 'permanent') {
    return 'Permanent';
  }
  if (duration === 0) {
    return 'Immediate';
  }
  if (duration === 1) {
    return 'Next wave';
  }
  return `${duration} waves`;
}

function formatEffectValue(effect: WavePowerUp['effect']): string {
  const { type, value } = effect;
  switch (type) {
    case 'damageMult':
      return `+${Math.round(value * 100)}% damage`;
    case 'fireRateMult':
      return `+${Math.round(value * 100)}% fire rate`;
    case 'rewardMult':
      return `+${Math.round(value * 100)}% rewards`;
    case 'addMoney':
      return `+${value} credits`;
    case 'addLives':
      return `+${value} lives`;
    case 'towerRangeMult':
      return `+${Math.round(value * 100)}% range`;
    case 'towerRangeAdd':
      return `+${value} range`;
    default:
      return '';
  }
}

export default function PowerUpSelector({
  powerUps,
  onSelect,
}: PowerUpSelectorProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
    >
      <div
        className="relative bg-black border-2 border-cyan-400 rounded-lg p-6 max-w-2xl w-full animate-in zoom-in duration-300"
        style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.5)' }}
      >
        <h2
          className="text-2xl font-bold mb-6 text-center"
          style={{
            background:
              'linear-gradient(135deg, rgb(6, 182, 212), rgb(168, 85, 247))',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          CHOOSE A POWER-UP
        </h2>

        <p className="text-center text-gray-400 text-sm mb-6">
          {powerUps[0]?.duration === 0
            ? 'Select one power-up to start your mission.'
            : 'Wave complete! Select one power-up for the next phase.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {powerUps.map((powerUp) => {
            const Icon = iconMap[powerUp.icon];
            const effectText = formatEffectValue(powerUp.effect);
            const durationText = formatDuration(powerUp.duration);

            return (
              <button
                className="relative bg-gray-900/50 border-2 border-cyan-500/30 rounded-lg p-4 hover:border-cyan-400 hover:bg-gray-800/50 transition-all active:scale-95 flex flex-col items-center gap-3 text-left group"
                key={powerUp.id}
                onClick={() => onSelect(powerUp)}
                style={{
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)',
                }}
                type="button"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/20 border-2 border-cyan-400/50 group-hover:border-cyan-400 group-hover:bg-cyan-500/30 transition-all">
                  <Icon className="w-6 h-6 text-cyan-400" />
                </div>

                <div className="text-center w-full">
                  <h3 className="font-bold text-white text-sm mb-1">
                    {powerUp.name}
                  </h3>
                  <p className="text-xs text-gray-400 mb-2">
                    {powerUp.description}
                  </p>
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-cyan-400 text-xs font-mono font-bold">
                      {effectText}
                    </span>
                    <span className="text-purple-400 text-xs font-mono">
                      {durationText}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
