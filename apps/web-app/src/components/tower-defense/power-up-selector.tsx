'use client';

import { Drawer, DrawerContent } from '@seawatts/ui/drawer';
import {
  Clock,
  Coins,
  Heart,
  Info,
  type LucideIcon,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  getRarityBorderColor,
  getRarityColor,
  getRarityGlowColor,
  getRarityName,
} from '~/lib/tower-defense/constants/rarity';
import type { WavePowerUp } from '~/lib/tower-defense/game-types';
import WavePowerUpDetails from './wave-powerup-details';

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

function formatEffectValue(effect: WavePowerUp['effect']): {
  value: string;
  icon: LucideIcon | null;
} {
  const { type, value } = effect;
  switch (type) {
    case 'damageMult':
      return { icon: Zap, value: `+${Math.round(value * 100)}%` };
    case 'fireRateMult':
      return { icon: Zap, value: `+${Math.round(value * 100)}%` };
    case 'rewardMult':
      return { icon: TrendingUp, value: `+${Math.round(value * 100)}%` };
    case 'addMoney':
      return { icon: Coins, value: `+${value}` };
    case 'addLives':
      return { icon: Heart, value: `+${value}` };
    case 'towerRangeMult':
      return { icon: Target, value: `+${Math.round(value * 100)}%` };
    case 'towerRangeAdd':
      return { icon: Target, value: `+${value}` };
    default:
      return { icon: null, value: '' };
  }
}

function formatDurationShort(duration: WavePowerUp['duration']): string {
  if (duration === 'permanent') {
    return '∞';
  }
  if (duration === 0) {
    return 'Now';
  }
  if (duration === 1) {
    return '1w';
  }
  return `${duration}w`;
}

export default function PowerUpSelector({
  powerUps,
  onSelect,
}: PowerUpSelectorProps) {
  const [selectedPowerUpForDetails, setSelectedPowerUpForDetails] =
    useState<WavePowerUp | null>(null);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => {
          // Clicking the backdrop selects the first power-up and proceeds
          const firstPowerUp = powerUps[0];
          if (firstPowerUp) {
            onSelect(firstPowerUp);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            const firstPowerUp = powerUps[0];
            if (firstPowerUp) {
              onSelect(firstPowerUp);
            }
          }
        }}
        role="dialog"
      >
        <div
          className="relative bg-black border-2 border-cyan-400 rounded-lg p-2 sm:p-6 max-w-5xl w-full animate-in zoom-in duration-300"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
            }
          }}
          style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.5)' }}
        >
          <h2
            className="text-lg sm:text-2xl font-bold mb-2 sm:mb-6 text-center"
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

          <p className="text-center text-gray-400 text-xs sm:text-sm mb-3 sm:mb-6 hidden sm:block">
            {powerUps[0]?.duration === 0 ||
            powerUps[0]?.duration === 'permanent'
              ? 'Select one power-up to start your mission.'
              : 'Wave complete! Select one power-up for the next phase.'}
          </p>

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {powerUps.map((powerUp) => {
              const Icon = iconMap[powerUp.icon];
              const effect = formatEffectValue(powerUp.effect);
              const durationText = formatDuration(powerUp.duration);
              const durationShort = formatDurationShort(powerUp.duration);
              const rarity = powerUp.rarity ?? 'common';
              const rarityColor = getRarityColor(rarity);
              const rarityBorderColor = getRarityBorderColor(rarity);
              const rarityGlowColor = getRarityGlowColor(rarity);
              const rarityName = getRarityName(rarity);
              const EffectIcon = effect.icon;

              return (
                <button
                  className="relative bg-gray-900/50 border-2 rounded-lg p-3 sm:p-4 hover:bg-gray-800/50 transition-all active:scale-95 flex flex-col items-center gap-2 sm:gap-3 text-center group"
                  key={powerUp.id}
                  onClick={() => onSelect(powerUp)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = rarityBorderColor;
                    e.currentTarget.style.boxShadow = `0 0 25px ${rarityGlowColor}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${rarityBorderColor}80`;
                    e.currentTarget.style.boxShadow = `0 0 15px ${rarityGlowColor}`;
                  }}
                  style={{
                    borderColor: `${rarityBorderColor}80`,
                    boxShadow: `0 0 15px ${rarityGlowColor}`,
                  }}
                  type="button"
                >
                  {/* Info button */}
                  <button
                    aria-label="View power-up details"
                    className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 p-1 rounded hover:bg-gray-800/50 transition-colors z-10 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPowerUpForDetails(powerUp);
                    }}
                    type="button"
                  >
                    <Info className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 hover:text-cyan-400" />
                  </button>

                  {/* Rarity badge */}
                  <div
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1 sm:px-2 py-0.5 rounded text-[9px] sm:text-xs font-bold uppercase leading-tight"
                    style={{
                      backgroundColor: `${rarityColor}20`,
                      border: `1px solid ${rarityBorderColor}`,
                      color: rarityColor,
                      textShadow: `0 0 8px ${rarityGlowColor}`,
                    }}
                  >
                    <span className="hidden sm:inline">{rarityName}</span>
                    <span className="sm:hidden">{rarityName[0]}</span>
                  </div>

                  <div
                    className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 group-hover:scale-110 transition-all flex-shrink-0"
                    style={{
                      backgroundColor: `${rarityColor}20`,
                      borderColor: `${rarityBorderColor}80`,
                    }}
                  >
                    <Icon
                      className="w-5 h-5 sm:w-6 sm:h-6 transition-all"
                      style={{ color: rarityColor }}
                    />
                  </div>

                  <div className="text-center w-full min-w-0">
                    <h3 className="font-bold text-white text-[11px] sm:text-sm mb-1 sm:mb-1 line-clamp-2 leading-tight">
                      {powerUp.name}
                    </h3>
                    <p className="text-[9px] sm:text-xs text-gray-400 mb-1.5 sm:mb-2 line-clamp-2 hidden sm:block">
                      {powerUp.description}
                    </p>
                    <div className="flex flex-col items-center gap-1 sm:gap-1 mt-1 sm:mt-2">
                      <div className="flex items-center gap-1 sm:gap-1">
                        {EffectIcon && (
                          <EffectIcon
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                            style={{ color: rarityColor }}
                          />
                        )}
                        <span
                          className="text-[11px] sm:text-xs font-mono font-bold leading-tight"
                          style={{ color: rarityColor }}
                        >
                          {effect.value}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400 flex-shrink-0" />
                        <span className="text-purple-400 text-[10px] sm:text-xs font-mono leading-tight">
                          <span className="hidden sm:inline">
                            {durationText}
                          </span>
                          <span className="sm:hidden">{durationShort}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Drawer
        direction="bottom"
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPowerUpForDetails(null);
          }
        }}
        open={selectedPowerUpForDetails !== null}
      >
        <DrawerContent className="border-t border-cyan-500/30 bg-black/95 text-white shadow-[0_0_45px_rgba(34,211,238,0.35)] backdrop-blur-lg [&>div:first-child]:hidden">
          <div className="mx-auto w-full max-w-md">
            {selectedPowerUpForDetails && (
              <WavePowerUpDetails
                onClose={() => setSelectedPowerUpForDetails(null)}
                powerUp={selectedPowerUpForDetails}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
