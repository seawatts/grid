import { Button } from '@seawatts/ui/button';
import { DrawerClose, DrawerHeader, DrawerTitle } from '@seawatts/ui/drawer';
import { X } from 'lucide-react';
import type { Landmine, PowerUp } from '~/lib/tower-defense/game-types';

interface ItemDetailsProps {
  item: PowerUp | Landmine;
  onClose: () => void;
}

export default function ItemDetails({ item, onClose }: ItemDetailsProps) {
  const isPowerUp = 'boost' in item;
  const waveCount =
    isPowerUp && 'remainingWaves' in item
      ? Math.max(0, Math.round(item.remainingWaves))
      : 0;
  const waveLabel =
    waveCount === 1 ? '1 wave' : `${waveCount.toLocaleString()} waves`;

  return (
    <>
      <DrawerHeader className="border-b border-cyan-500/30 px-4 py-4">
        <div className="flex justify-between items-center w-full">
          <DrawerTitle
            className="text-lg font-bold uppercase m-0"
            style={{
              color: isPowerUp ? 'rgb(250, 204, 21)' : 'rgb(239, 68, 68)',
              textShadow: `0 0 10px ${isPowerUp ? 'rgba(250, 204, 21, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
            }}
          >
            {isPowerUp ? 'POWER NODE' : 'PROXIMITY MINE'}
          </DrawerTitle>
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
          <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">EFFECT</div>
            <div className="text-sm font-bold text-white">
              {isPowerUp
                ? `+${(item.boost - 1) * 100}% DMG`
                : `${item.damage} DMG`}
            </div>
          </div>
          {isPowerUp && (
            <div className="bg-gray-900/50 p-3 rounded border border-gray-800 col-span-2">
              <div className="text-xs text-gray-500 mb-1">PERSISTENCE</div>
              <div className="text-sm font-bold text-white flex flex-col gap-1">
                <span>
                  {item.isTowerBound
                    ? 'Bound to tower · does not decay'
                    : `${waveLabel} remaining`}
                </span>
                <span className="text-[11px] font-normal text-gray-400">
                  {item.isTowerBound
                    ? 'Decay is paused while a tower occupies this node.'
                    : 'Expires at the start of a wave once this counter reaches zero.'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400 leading-relaxed border-l-2 border-gray-700 pl-3">
          {isPowerUp ? (
            <>
              Energy concentration detected. Towers placed on this node receive
              a significant damage output boost.
              <br />
              <span className="text-cyan-400 mt-1 block">
                STRATEGY: Place your strongest towers here.
              </span>
            </>
          ) : (
            <>
              Volatile explosive device. Detonates when enemies enter proximity.
              Single use only.
              <br />
              <span className="text-cyan-400 mt-1 block">
                STRATEGY: Lure high-health enemies into path.
              </span>
            </>
          )}
        </div>
      </div>
    </>
  );
}
