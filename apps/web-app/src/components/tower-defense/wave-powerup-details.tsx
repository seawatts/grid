'use client';

import { DrawerClose, DrawerHeader, DrawerTitle } from '@seawatts/ui/drawer';
import {
  Clock,
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

interface WavePowerUpDetailsProps {
  powerUp: WavePowerUp;
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

function formatStacking(stacking: WavePowerUp['stacking']): string {
  switch (stacking) {
    case 'additive':
      return 'Additive';
    case 'multiplicative':
      return 'Multiplicative';
    case 'replace':
      return 'Replace';
    default:
      return 'Unknown';
  }
}

export default function WavePowerUpDetails({
  powerUp,
  onClose: _onClose,
}: WavePowerUpDetailsProps) {
  const Icon = iconMap[powerUp.icon];
  const rarity = powerUp.rarity ?? 'common';
  const rarityColor = getRarityColor(rarity);
  const rarityBorderColor = getRarityBorderColor(rarity);
  const rarityGlowColor = getRarityGlowColor(rarity);
  const rarityName = getRarityName(rarity);
  const effectText = formatEffectValue(powerUp.effect);
  const durationText = formatDuration(powerUp.duration);
  const stackingText = formatStacking(powerUp.stacking);

  return (
    <>
      <DrawerHeader className="border-b border-cyan-500/30 px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-full border-2 flex-shrink-0"
            style={{
              backgroundColor: `${rarityColor}20`,
              borderColor: rarityBorderColor,
            }}
          >
            <Icon className="w-6 h-6" style={{ color: rarityColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <DrawerTitle
              className="text-xl font-bold text-white mb-1"
              style={{
                textShadow: `0 0 10px ${rarityGlowColor}`,
              }}
            >
              {powerUp.name}
            </DrawerTitle>
            <div
              className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase"
              style={{
                backgroundColor: `${rarityColor}20`,
                border: `1px solid ${rarityBorderColor}`,
                color: rarityColor,
                textShadow: `0 0 8px ${rarityGlowColor}`,
              }}
            >
              {rarityName}
            </div>
          </div>
          <DrawerClose asChild>
            <button
              className="text-gray-400 hover:text-white transition-colors p-1"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </DrawerClose>
        </div>
      </DrawerHeader>

      <div className="px-4 py-4 space-y-4">
        <div className="text-sm text-gray-300 leading-relaxed">
          {powerUp.description}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div
            className="bg-gray-900/50 p-3 rounded border"
            style={{ borderColor: `${rarityBorderColor}40` }}
          >
            <div className="text-xs text-gray-500 mb-1">EFFECT</div>
            <div
              className="text-sm font-bold font-mono"
              style={{ color: rarityColor }}
            >
              {effectText}
            </div>
          </div>

          <div
            className="bg-gray-900/50 p-3 rounded border"
            style={{ borderColor: `${rarityBorderColor}40` }}
          >
            <div className="text-xs text-gray-500 mb-1">DURATION</div>
            <div className="text-sm font-bold text-purple-400 font-mono flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {durationText}
            </div>
          </div>

          <div
            className="bg-gray-900/50 p-3 rounded border col-span-2"
            style={{ borderColor: `${rarityBorderColor}40` }}
          >
            <div className="text-xs text-gray-500 mb-1">STACKING</div>
            <div className="text-sm font-bold text-white">{stackingText}</div>
            <div className="text-xs text-gray-400 mt-1">
              {powerUp.stacking === 'additive'
                ? 'Effects add together with other power-ups.'
                : powerUp.stacking === 'multiplicative'
                  ? 'Effects multiply with other power-ups.'
                  : 'Replaces any existing effects of this type.'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
