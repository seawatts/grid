import { Button } from '@seawatts/ui/button';
import { DrawerClose, DrawerHeader, DrawerTitle } from '@seawatts/ui/drawer';
import { X } from 'lucide-react';
import { useMemo } from 'react';
import PowerUpImpactList from '~/components/tower-defense/power-up-impact-list';
import {
  POWERUP_CONFIGS,
  TRAP_CONFIGS,
} from '~/lib/tower-defense/constants/placeables';
import {
  getRarityBorderColor,
  getRarityColor,
  getRarityGlowColor,
  getRarityName,
} from '~/lib/tower-defense/constants/rarity';
import type {
  PlaceableItem,
  PowerupRarity,
} from '~/lib/tower-defense/game-types';
import { isPowerupItem, isTrapItem } from '~/lib/tower-defense/game-types';
import { useGameStore } from '~/lib/tower-defense/store/game-store';
import { aggregateWavePowerUpEffects } from '~/lib/tower-defense/utils/calculations';

interface ItemDetailsProps {
  item: PlaceableItem;
  onClose: () => void;
}

export default function ItemDetails({ item, onClose }: ItemDetailsProps) {
  const { activeWavePowerUps } = useGameStore();

  // Check if it's a placeable item (unified system)
  const isPlaceablePowerup = isPowerupItem(item);
  const isPlaceableTrap = isTrapItem(item);
  const isPowerUp = isPlaceablePowerup;

  // Get item data
  let boost: number | undefined;
  let damage: number | undefined;
  let remainingWaves: number | undefined;
  let isTowerBound: boolean | undefined;
  let rarity: string | undefined;
  let itemName = 'Unknown';
  let itemDescription = '';

  if (isPlaceablePowerup) {
    const config = POWERUP_CONFIGS[item.type as keyof typeof POWERUP_CONFIGS];
    boost = item.boost;
    remainingWaves = item.remainingWaves;
    isTowerBound = item.isTowerBound;
    rarity = item.rarity;
    itemName = config?.name ?? 'Node';
    itemDescription =
      'Energy concentration detected. Towers placed on this node receive a significant damage output boost.';
  } else if (isPlaceableTrap) {
    const config = TRAP_CONFIGS[item.type as keyof typeof TRAP_CONFIGS];
    damage = item.damage;
    itemName = config?.name ?? 'Trap';
    itemDescription = config?.behavior.persistent
      ? 'Persistent trap that damages enemies as they pass over it.'
      : 'Volatile explosive device. Detonates when enemies enter proximity. Single use only.';
  } else {
    itemName = 'Unknown';
    itemDescription = '';
  }

  const waveCount = remainingWaves
    ? Math.max(0, Math.round(remainingWaves))
    : 0;
  const waveLabel =
    waveCount === 1 ? '1 wave' : `${waveCount.toLocaleString()} waves`;

  const impactEntity = isPowerUp ? 'powerNode' : 'trap';

  const damageBoostInfo = useMemo(() => {
    if (!damage || impactEntity !== 'trap') return null;
    const percentBonus = aggregateWavePowerUpEffects(
      activeWavePowerUps,
      'damageMult',
    );
    if (percentBonus <= 0) {
      return {
        base: damage,
        bonusAmount: 0,
        hasBonus: false,
        percentBonus: 0,
        total: damage,
      };
    }
    const bonusAmount = damage * percentBonus;
    return {
      base: damage,
      bonusAmount,
      hasBonus: true,
      percentBonus,
      total: damage + bonusAmount,
    };
  }, [damage, impactEntity, activeWavePowerUps]);

  return (
    <>
      <DrawerHeader className="border-b border-cyan-500/30 px-4 py-4">
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col gap-1">
            <DrawerTitle
              className="text-lg font-bold uppercase m-0"
              style={{
                color: isPowerUp
                  ? rarity
                    ? getRarityColor(rarity as PowerupRarity)
                    : 'rgb(250, 204, 21)'
                  : 'rgb(239, 68, 68)',
                textShadow: isPowerUp
                  ? rarity
                    ? `0 0 10px ${getRarityGlowColor(rarity as PowerupRarity)}`
                    : '0 0 10px rgba(250, 204, 21, 0.5)'
                  : '0 0 10px rgba(239, 68, 68, 0.5)',
              }}
            >
              {itemName}
            </DrawerTitle>
            {isPowerUp && rarity && (
              <div
                className="text-xs font-bold uppercase px-2 py-0.5 rounded inline-block w-fit"
                style={{
                  backgroundColor: `${getRarityColor(rarity as PowerupRarity)}20`,
                  border: `1px solid ${getRarityBorderColor(rarity as PowerupRarity)}`,
                  color: getRarityColor(rarity as PowerupRarity),
                  textShadow: `0 0 6px ${getRarityGlowColor(rarity as PowerupRarity)}`,
                }}
              >
                {getRarityName(rarity as PowerupRarity)}
              </div>
            )}
          </div>
          <DrawerClose asChild>
            <Button
              className="text-gray-400 hover:text-white hover:bg-white/10 h-8 w-8"
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
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">TYPE</div>
            <div className="text-sm font-bold text-white">
              {isPowerUp ? 'BUFF' : 'TRAP'}
            </div>
          </div>
          <div
            className={`p-3 rounded border ${
              damageBoostInfo?.hasBonus
                ? 'border-cyan-400/50 bg-cyan-500/5'
                : 'border-gray-800 bg-gray-900/50'
            }`}
          >
            <div
              className={`text-xs mb-1 ${
                damageBoostInfo?.hasBonus ? 'text-cyan-300' : 'text-gray-500'
              }`}
            >
              EFFECT
            </div>
            {isPowerUp && boost ? (
              <div className="text-sm font-bold text-white">
                +{((boost - 1) * 100).toFixed(0)}% DMG
              </div>
            ) : damage !== undefined ? (
              <div className="text-sm font-bold text-white flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span>
                    {Math.round(
                      damageBoostInfo?.total ?? damage,
                    ).toLocaleString()}{' '}
                    DMG
                  </span>
                  {damageBoostInfo?.hasBonus && (
                    <span className="text-[11px] font-semibold text-cyan-300">
                      +
                      {Math.round(damageBoostInfo.bonusAmount).toLocaleString()}{' '}
                      ({Math.round(damageBoostInfo.percentBonus * 100)}%)
                    </span>
                  )}
                </div>
                {damageBoostInfo?.hasBonus && (
                  <div className="text-[11px] text-gray-300">
                    Base {damage.toLocaleString()} DMG
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm font-bold text-white">N/A</div>
            )}
          </div>
          {isPowerUp && remainingWaves !== undefined && (
            <div className="bg-gray-900/50 p-3 rounded border border-gray-800 col-span-2">
              <div className="text-xs text-gray-500 mb-1">PERSISTENCE</div>
              <div className="text-sm font-bold text-white flex flex-col gap-1">
                <span>
                  {isTowerBound
                    ? 'Bound to tower · does not decay'
                    : `${waveLabel} remaining`}
                </span>
                <span className="text-[11px] font-normal text-gray-400">
                  {isTowerBound
                    ? 'Decay is paused while a tower occupies this node.'
                    : 'Expires at the start of a wave once this counter reaches zero.'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400 leading-relaxed border-l-2 border-gray-700 pl-3">
          {itemDescription}
          <br />
          <span className="text-cyan-400 mt-1 block">
            {isPowerUp
              ? 'STRATEGY: Place your strongest towers here.'
              : isPlaceableTrap && item.type === 'gridBug'
                ? 'STRATEGY: Place on high-traffic paths for continuous damage.'
                : isPlaceableTrap && item.type === 'stream'
                  ? 'STRATEGY: Blocks enemy paths, forcing them to reroute.'
                  : 'STRATEGY: Lure high-health enemies into path.'}
          </span>
        </div>

        <PowerUpImpactList className="mt-4" entity={impactEntity} />
      </div>
    </>
  );
}
