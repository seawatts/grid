'use client';

import { Button } from '@seawatts/ui/button';
import { DrawerClose, DrawerHeader, DrawerTitle } from '@seawatts/ui/drawer';
import { X } from 'lucide-react';
import { useMemo } from 'react';
import PowerUpImpactList from '~/components/tower-defense/power-up-impact-list';
import TowerRangeVisualization from '~/components/tower-defense/tower-range-visualization';
import { TOWER_STATS } from '~/lib/tower-defense/game-constants';
import type { Tower } from '~/lib/tower-defense/game-types';
import { useGameStore } from '~/lib/tower-defense/store/game-store';
import {
  calculateDamage,
  calculateFireRate,
  calculateTowerRange,
  getTowerDamageLevelMultiplier,
  getTowerFireRateLevelMultiplier,
  getTowerRangeLevelBonus,
} from '~/lib/tower-defense/utils/calculations';

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
  const activeWavePowerUps = useGameStore((state) => state.activeWavePowerUps);
  const runUpgrade = useGameStore((state) => state.runUpgrade);
  const powerups = useGameStore((state) => state.powerups);
  const getAdjacentTowers = useGameStore((state) => state.getAdjacentTowers);

  const stats = TOWER_STATS[tower.type];
  const towerLevel = tower.level ?? 1;
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

  const tilePowerup = useMemo(
    () =>
      powerups.find(
        (p) =>
          p.position.x === tower.position.x &&
          p.position.y === tower.position.y,
      ),
    [powerups, tower.position.x, tower.position.y],
  );

  const adjacentCount = useMemo(() => {
    if (!getAdjacentTowers) return 0;
    return getAdjacentTowers(tower.position).length;
  }, [getAdjacentTowers, tower.position]);

  const baseDamage = stats.damage * getTowerDamageLevelMultiplier(towerLevel);
  const baseFireRate =
    stats.fireRate * getTowerFireRateLevelMultiplier(towerLevel);
  const baseRange = stats.range + getTowerRangeLevelBonus(towerLevel);

  const damageParams = {
    activeWavePowerUps,
    adjacentTowerCount: adjacentCount,
    powerup: tilePowerup,
    runUpgrade,
    tower,
  };

  const effectiveDamage = calculateDamage(damageParams);

  const nextTower = useMemo(
    () => (tower.level < 3 ? { ...tower, level: tower.level + 1 } : null),
    [tower],
  );

  const nextDamage = nextTower
    ? calculateDamage({
        ...damageParams,
        tower: nextTower,
      })
    : null;

  const effectiveFireRate = calculateFireRate({
    activeWavePowerUps,
    gameSpeed: 1,
    runUpgrade,
    tower,
  });
  const nextFireRate = nextTower
    ? calculateFireRate({
        activeWavePowerUps,
        gameSpeed: 1,
        runUpgrade,
        tower: nextTower,
      })
    : null;

  const effectiveRange = calculateTowerRange({
    activeWavePowerUps,
    baseRange,
    towerLevel: tower.level,
  });
  const nextRange = nextTower
    ? calculateTowerRange({
        activeWavePowerUps,
        baseRange,
        towerLevel: nextTower.level,
      })
    : null;

  const damageDelta = effectiveDamage - baseDamage;
  const fireRateDelta = baseFireRate - effectiveFireRate;
  const rangeDelta = effectiveRange - baseRange;

  type StatCard = {
    key: 'damage' | 'fireRate' | 'range';
    label: string;
    base: number;
    total: number;
    delta: number;
    suffix?: string;
    format: (value: number) => string;
    nextValue: number | null;
    diffFormat?: (diff: number) => string;
  };

  const statCards: StatCard[] = [
    {
      base: baseDamage,
      delta: damageDelta,
      diffFormat: (diff: number) => {
        const symbol = diff >= 0 ? '+' : '-';
        return `${symbol}${Math.round(Math.abs(diff)).toLocaleString()} DMG`;
      },
      format: (value: number) => `${Math.round(value).toLocaleString()}`,
      isBuff: Math.abs(damageDelta) > 0.01,
      key: 'damage',
      label: 'Damage',
      nextValue: nextDamage,
      suffix: ' DMG',
      total: effectiveDamage,
    },
    {
      base: baseFireRate,
      delta: fireRateDelta,
      diffFormat: (diff: number) => {
        const symbol = diff >= 0 ? '+' : '-';
        return `${symbol}${Math.round(Math.abs(diff))} ms`;
      },
      format: (value: number) => `${Math.round(value)}`,
      // positive delta indicates faster rate (lower ms)
      isBuff: fireRateDelta > 0.5,
      key: 'fireRate',
      label: 'Fire Rate',
      nextValue: nextFireRate,
      suffix: ' ms',
      total: effectiveFireRate,
    },
    {
      base: baseRange,
      delta: rangeDelta,
      diffFormat: (diff: number) => {
        const symbol = diff >= 0 ? '+' : '-';
        const formatted =
          Math.abs(diff) % 1 === 0
            ? Math.abs(diff).toFixed(0)
            : Math.abs(diff).toFixed(1);
        return `${symbol}${formatted} tiles`;
      },
      format: (value: number) =>
        value % 1 === 0 ? `${value}` : value.toFixed(1),
      isBuff: rangeDelta > 0.01,
      key: 'range',
      label: 'Range',
      nextValue: nextRange,
      suffix: ' tiles',
      total: effectiveRange,
    },
  ];

  const renderDelta = (
    base: number,
    _total: number,
    delta: number,
    suffix = '',
  ) => {
    if (Math.abs(delta) < 0.01) return null;
    const percent = base !== 0 ? Math.round((Math.abs(delta) / base) * 100) : 0;
    const symbol = delta > 0 ? '+' : '-';
    return (
      <div className="text-[11px] text-gray-300">
        Base {`${base % 1 === 0 ? base : base.toFixed(1)}${suffix}`} •{' '}
        <span className="text-cyan-300 font-semibold">
          {symbol}
          {`${Math.abs(delta % 1 === 0 ? delta : delta.toFixed(1))}${suffix}`}{' '}
          {percent > 0 && `(${symbol}${percent}%)`}
        </span>
      </div>
    );
  };

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
              Base stats before global modifiers are applied.
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

        <div className="mt-4 flex flex-row gap-4 flex-wrap items-stretch">
          <div className="flex flex-col gap-3 w-[170px] flex-shrink-0 sm:h-[220px] justify-between">
            {statCards.map((card) => (
              <div
                className={`p-2.5 rounded border flex flex-col ${
                  card.isBuff
                    ? 'border-cyan-400/50 bg-cyan-500/5'
                    : 'border-gray-800 bg-gray-900/50'
                }`}
                key={card.key}
              >
                <div
                  className={`text-[10px] mb-1 ${
                    card.isBuff ? 'text-cyan-300' : 'text-gray-500'
                  }`}
                >
                  {card.label.toUpperCase()}
                </div>
                <div className="text-sm font-bold text-white flex flex-col">
                  <span>
                    {card.format(card.total)}
                    {card.suffix}
                  </span>
                  {card.isBuff &&
                    renderDelta(
                      card.base,
                      card.total,
                      card.delta,
                      card.suffix ?? '',
                    )}
                </div>
                {tower.level < 3 &&
                  card.nextValue !== null &&
                  Math.abs(card.nextValue - card.total) > 0.01 && (
                    <div className="mt-2 border-t border-cyan-500/20 pt-1 text-[10px] text-cyan-300">
                      <div className="flex items-center justify-between">
                        <span>Next Upgrade</span>
                        <span className="font-semibold text-white">
                          {card.format(card.nextValue)}
                          {card.suffix}
                        </span>
                      </div>
                      {card.diffFormat && (
                        <div className="text-right text-gray-400">
                          {card.diffFormat(card.nextValue - card.total)}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>
          <div className="flex-1 flex items-center justify-center min-w-[220px]">
            <TowerRangeVisualization
              accentColor={color.border}
              damage={effectiveDamage}
              fireRateMs={effectiveFireRate}
              range={effectiveRange}
              tilePowerup={tilePowerup}
              tower={tower}
            />
          </div>
        </div>

        <PowerUpImpactList entity="tower" />
      </div>
    </>
  );
}
