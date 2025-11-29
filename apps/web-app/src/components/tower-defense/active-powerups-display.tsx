'use client';

import {
  Coins,
  Heart,
  type LucideIcon,
  Target,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import {
  getRarityBorderColor,
  getRarityColor,
  getRarityGlowColor,
  getRarityName,
} from '~/lib/tower-defense/constants/rarity';
import type { WavePowerUp } from '~/lib/tower-defense/game-types';

interface ActivePowerUpsDisplayProps {
  activePowerUps: WavePowerUp[];
  onClose: () => void;
}

const iconMap: Record<WavePowerUp['icon'], LucideIcon> = {
  damage: Zap,
  health: Heart,
  money: Coins,
  range: Target,
  reward: TrendingUp,
  speed: Target,
};

function formatDuration(
  duration: WavePowerUp['duration'],
  wavesRemaining?: number,
): string {
  if (duration === 'permanent') {
    return 'Permanent';
  }
  if (duration === 0) {
    return 'Applied';
  }
  if (wavesRemaining !== undefined) {
    if (wavesRemaining <= 0) {
      return 'Expiring';
    }
    return `${wavesRemaining} wave${wavesRemaining !== 1 ? 's' : ''} left`;
  }
  return `${duration} wave${duration !== 1 ? 's' : ''}`;
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

export default function ActivePowerUpsDisplay({
  activePowerUps,
  onClose,
}: ActivePowerUpsDisplayProps) {
  if (activePowerUps.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
        role="dialog"
      >
        <div
          className="relative bg-black border-2 border-cyan-400 rounded-lg p-6 max-w-sm w-full animate-in zoom-in duration-300"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.5)' }}
        >
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>

          <h2
            className="text-2xl font-bold mb-4 text-center"
            style={{
              background:
                'linear-gradient(135deg, rgb(6, 182, 212), rgb(168, 85, 247))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ACTIVE POWER-UPS
          </h2>

          <p className="text-center text-gray-400 text-sm">
            No active power-ups
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      role="dialog"
    >
      <div
        className="relative bg-black border-2 border-cyan-400 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.5)' }}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          onClick={onClose}
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

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
          ACTIVE POWER-UPS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activePowerUps.map((powerUp, index) => {
            const Icon = iconMap[powerUp.icon];
            const effectText = formatEffectValue(powerUp.effect);
            const durationText = formatDuration(
              powerUp.duration,
              powerUp.wavesRemaining,
            );
            const uniqueKey = `${powerUp.id}-${
              powerUp.wavesRemaining ?? 'permanent'
            }-${index}`;
            const rarity = powerUp.rarity ?? 'common';
            const rarityColor = getRarityColor(rarity);
            const rarityBorderColor = getRarityBorderColor(rarity);
            const rarityGlowColor = getRarityGlowColor(rarity);
            const rarityName = getRarityName(rarity);

            return (
              <div
                className="bg-gray-900/50 border-2 rounded-lg p-4 flex flex-col gap-3 relative"
                key={uniqueKey}
                style={{
                  borderColor: `${rarityBorderColor}80`,
                  boxShadow: `0 0 15px ${rarityGlowColor}`,
                }}
              >
                {/* Rarity badge */}
                <div
                  className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-bold uppercase"
                  style={{
                    backgroundColor: `${rarityColor}20`,
                    border: `1px solid ${rarityBorderColor}`,
                    color: rarityColor,
                    textShadow: `0 0 8px ${rarityGlowColor}`,
                  }}
                >
                  {rarityName}
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full border-2"
                    style={{
                      backgroundColor: `${rarityColor}20`,
                      borderColor: `${rarityBorderColor}80`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: rarityColor }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-sm">
                      {powerUp.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {powerUp.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <span
                    className="text-xs font-mono font-bold"
                    style={{ color: rarityColor }}
                  >
                    {effectText}
                  </span>
                  <span className="text-purple-400 text-xs font-mono">
                    {durationText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
