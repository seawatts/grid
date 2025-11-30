'use client';

import {
  Coins,
  Crown,
  Heart,
  type LucideIcon,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import {
  ENEMY_STATS,
  TOWER_STATS,
} from '~/lib/tower-defense/constants/balance';
import {
  getRarityBorderColor,
  getRarityColor,
  getRarityGlowColor,
  getRarityName,
} from '~/lib/tower-defense/constants/rarity';
import type {
  EnemyType,
  TowerType,
  WavePowerUp,
} from '~/lib/tower-defense/game-types';
import type { GameState } from '~/lib/tower-defense/store/types';
import {
  calculateDamage,
  calculateFireRate,
  calculateTowerRange,
  getTowerDamageLevelMultiplier,
  getTowerFireRateLevelMultiplier,
  getTowerRangeLevelBonus,
} from '~/lib/tower-defense/utils/calculations';
import { calculateWaveInfo } from '~/lib/tower-defense/utils/wave-info';

interface WaveInfoDrawerProps {
  gameState: GameState;
  onClose: () => void;
}

interface WaveCardProps {
  waveNumber: number;
  gameState: GameState;
  isCurrentWave: boolean;
  isNextWave: boolean;
}

function WaveCard({
  waveNumber,
  gameState,
  isCurrentWave,
  isNextWave,
}: WaveCardProps) {
  const waveInfo = calculateWaveInfo(gameState, waveNumber);
  const isBossWave = waveNumber > 0 && waveNumber % 10 === 0;

  // Calculate wave progress if this is the current active wave
  let waveProgress: {
    enemiesKilled: number;
    totalEnemies: number;
    healthDestroyed: number;
    totalHealth: number;
    rewardsEarned: number;
    totalRewards: number;
    bossesKilled: number;
    totalBosses: number;
  } | null = null;

  if (isCurrentWave && gameState.isWaveActive && waveNumber > 0) {
    const totalEnemies = waveInfo.enemyCount;
    const remainingEnemies =
      gameState.spawnedEnemies.length + gameState.unspawnedEnemies.length;
    const enemiesKilled = Math.max(0, totalEnemies - remainingEnemies);

    const totalHealth = waveInfo.totalHealth;
    const remainingHealth =
      gameState.spawnedEnemies.reduce((sum, e) => sum + e.health, 0) +
      gameState.unspawnedEnemies.reduce((sum, e) => sum + e.maxHealth, 0);
    const healthDestroyed = Math.max(0, totalHealth - remainingHealth);

    const totalRewards = waveInfo.totalReward;
    const avgRewardPerEnemy =
      totalEnemies > 0 ? totalRewards / totalEnemies : 0;
    const rewardsEarned = Math.round(enemiesKilled * avgRewardPerEnemy);

    const totalBosses = waveInfo.enemyTypes.filter((t) => t === 'boss').length;
    const remainingBosses =
      gameState.spawnedEnemies.filter((e) => e.type === 'boss').length +
      gameState.unspawnedEnemies.filter((e) => e.type === 'boss').length;
    const bossesKilled = Math.max(0, totalBosses - remainingBosses);

    waveProgress = {
      bossesKilled,
      enemiesKilled,
      healthDestroyed,
      rewardsEarned,
      totalBosses,
      totalEnemies,
      totalHealth,
      totalRewards,
    };
  }

  // Group enemies by type
  const enemyCounts: Record<EnemyType, number> = {
    basic: 0,
    boss: 0,
    fast: 0,
    tank: 0,
  };

  for (const enemyType of waveInfo.enemyTypes) {
    enemyCounts[enemyType]++;
  }

  const getEnemyTypeName = (type: EnemyType): string => {
    switch (type) {
      case 'basic':
        return 'Basic';
      case 'fast':
        return 'Fast';
      case 'tank':
        return 'Tank';
      case 'boss':
        return 'Boss';
    }
  };

  const getEnemyTypeColor = (type: EnemyType): string => {
    switch (type) {
      case 'basic':
        return 'text-cyan-400';
      case 'fast':
        return 'text-yellow-400';
      case 'tank':
        return 'text-red-400';
      case 'boss':
        return 'text-purple-400';
    }
  };

  const getDifficultyColor = (multiplier: number): string => {
    if (multiplier < 0.9) return 'text-green-400';
    if (multiplier > 1.1) return 'text-orange-400';
    return 'text-yellow-400';
  };

  const getDifficultyLabel = (multiplier: number): string => {
    if (multiplier < 0.9) return 'Easier';
    if (multiplier > 1.1) return 'Harder';
    return 'Normal';
  };

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

  return (
    <div className="shrink-0 w-[90vw] md:w-[85vw] lg:w-[80vw] px-2 md:px-4">
      <div className="bg-black border-2 border-purple-400 rounded-lg p-4 md:p-6 max-w-2xl mx-auto h-full">
        {/* Wave Header */}
        <div className="flex items-center gap-3 mb-6">
          {isBossWave ? (
            <Crown className="w-8 h-8 text-yellow-400" />
          ) : (
            <Zap className="w-8 h-8 text-purple-400" />
          )}
          <h2
            className="text-2xl font-bold"
            style={{
              background:
                'linear-gradient(135deg, rgb(168, 85, 247), rgb(236, 72, 153))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            WAVE {waveNumber} {isBossWave && '/ BOSS WAVE'}
          </h2>
        </div>

        {/* Wave Progress */}
        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-purple-400/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Overall Progress</span>
            <span className="text-white font-bold">
              {waveNumber}/{gameState.maxWaves}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                background:
                  'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))',
                width: `${(waveNumber / gameState.maxWaves) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Wave Stats Summary - Always show, even if wave hasn't started */}
        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-purple-400/30">
          <h3 className="font-bold text-white mb-3">
            {waveProgress
              ? 'Wave Progress'
              : isNextWave
                ? 'Next Wave Preview'
                : isCurrentWave
                  ? 'Current Wave Preview'
                  : 'Wave Preview'}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {waveProgress ? (
              <>
                <div>
                  <span className="text-gray-400">Enemies:</span>
                  <div className="text-white font-bold">
                    {waveProgress.enemiesKilled}/{waveProgress.totalEnemies}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Health:</span>
                  <div className="text-white font-bold">
                    {waveProgress.healthDestroyed.toLocaleString()}/
                    {waveProgress.totalHealth.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Rewards:</span>
                  <div className="text-cyan-400 font-bold">
                    {waveProgress.rewardsEarned.toLocaleString()}/
                    {waveProgress.totalRewards.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Bosses:</span>
                  <div className="text-purple-400 font-bold">
                    {waveProgress.bossesKilled}/{waveProgress.totalBosses}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-gray-400">Enemies:</span>
                  <div className="text-white font-bold">
                    0/{waveInfo.enemyCount}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Health:</span>
                  <div className="text-white font-bold">
                    0/{waveInfo.totalHealth.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Rewards:</span>
                  <div className="text-cyan-400 font-bold">
                    0/{waveInfo.totalReward.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Bosses:</span>
                  <div className="text-purple-400 font-bold">
                    0/{waveInfo.totalBosses}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Active Power-Ups */}
        {gameState.activeWavePowerUps.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-white mb-3">Active Power-Ups</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameState.activeWavePowerUps.map((powerUp, index) => {
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
                        <Icon
                          className="w-5 h-5"
                          style={{ color: rarityColor }}
                        />
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
        )}

        {/* Run Upgrade Bonus */}
        {gameState.runUpgrade && (
          <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-cyan-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white">Run Upgrade</h3>
            </div>
            <div className="text-sm">
              <div className="text-white font-bold mb-1">
                {gameState.runUpgrade.name}
              </div>
              {gameState.runUpgrade.effect.type === 'rewardMult' && (
                <div className="text-cyan-300 text-xs">
                  +{Math.round(gameState.runUpgrade.effect.value * 100)}% enemy
                  rewards
                </div>
              )}
            </div>
          </div>
        )}

        {/* Difficulty Info */}
        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-purple-400/30">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white">Difficulty</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-gray-400 text-xs">Base Multiplier</span>
              <div className="text-white font-mono font-bold">
                {waveInfo.baseHealthMultiplier.toFixed(2)}x
              </div>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Adaptive Multiplier</span>
              <div
                className={`font-mono font-bold ${getDifficultyColor(
                  waveInfo.adaptiveMultiplier,
                )}`}
              >
                {waveInfo.adaptiveMultiplier.toFixed(2)}x
                {waveInfo.adaptiveMultiplier !== 1.0 && (
                  <span className="ml-2 text-xs">
                    ({getDifficultyLabel(waveInfo.adaptiveMultiplier)})
                  </span>
                )}
              </div>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Total Multiplier</span>
              <div className="text-white font-mono font-bold">
                {waveInfo.totalHealthMultiplier.toFixed(2)}x
              </div>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Enemy Count</span>
              <div className="text-white font-mono font-bold">
                {waveInfo.enemyCount}
              </div>
            </div>
          </div>

          {/* Defensive Setup Summary */}
          <div className="pt-4 border-t border-gray-700">
            <h4 className="text-sm font-bold text-white mb-3">
              Defensive Setup
            </h4>

            {/* Towers by Type */}
            {gameState.towers.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-2">Towers</div>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const towersByType = new Map<
                      TowerType,
                      { count: number; totalDPS: number }
                    >();
                    for (const tower of gameState.towers) {
                      const existing = towersByType.get(tower.type) || {
                        count: 0,
                        totalDPS: 0,
                      };
                      existing.count++;

                      const effectiveDamage = calculateDamage({
                        activeWavePowerUps: gameState.activeWavePowerUps,
                        adjacentTowerCount: 0,
                        powerup: undefined,
                        runUpgrade: gameState.runUpgrade,
                        tower,
                      });

                      const effectiveFireRate = calculateFireRate({
                        activeWavePowerUps: gameState.activeWavePowerUps,
                        gameSpeed: 1,
                        runUpgrade: gameState.runUpgrade,
                        tower,
                      });

                      const dps = effectiveDamage / (effectiveFireRate / 1000);
                      existing.totalDPS += dps;
                      towersByType.set(tower.type, existing);
                    }

                    const towerColors = {
                      basic: 'text-cyan-400',
                      bomb: 'text-pink-400',
                      slow: 'text-purple-400',
                      sniper: 'text-green-400',
                    };

                    return Array.from(towersByType.entries()).map(
                      ([type, { count, totalDPS }]) => (
                        <div
                          className="px-2 py-1 rounded bg-gray-800/50 border border-gray-700"
                          key={type}
                        >
                          <span
                            className={`text-xs font-bold ${towerColors[type]}`}
                          >
                            {type.toUpperCase()}
                          </span>
                          <span className="text-white text-xs ml-1">
                            ×{count}
                          </span>
                          <span className="text-gray-400 text-xs ml-1">
                            ({Math.round(totalDPS)} DPS)
                          </span>
                        </div>
                      ),
                    );
                  })()}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Total: {gameState.towers.length} towers • {(() => {
                    let totalDPS = 0;
                    for (const tower of gameState.towers) {
                      const effectiveDamage = calculateDamage({
                        activeWavePowerUps: gameState.activeWavePowerUps,
                        adjacentTowerCount: 0,
                        powerup: undefined,
                        runUpgrade: gameState.runUpgrade,
                        tower,
                      });
                      const effectiveFireRate = calculateFireRate({
                        activeWavePowerUps: gameState.activeWavePowerUps,
                        gameSpeed: 1,
                        runUpgrade: gameState.runUpgrade,
                        tower,
                      });
                      totalDPS += effectiveDamage / (effectiveFireRate / 1000);
                    }
                    return Math.round(totalDPS);
                  })()} total DPS
                </div>
              </div>
            )}

            {/* Traps */}
            {(() => {
              const traps = gameState.placeables.filter(
                (item) => item.category === 'trap',
              );
              return traps.length > 0 ? (
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">Traps</div>
                  <div className="text-white font-mono text-sm">
                    {traps.length} trap{traps.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Power-ups */}
            {gameState.activeWavePowerUps.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-1">
                  Active Power-Ups
                </div>
                <div className="text-white font-mono text-sm">
                  {gameState.activeWavePowerUps.length} power-up
                  {gameState.activeWavePowerUps.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
          {waveInfo.adaptiveMultiplier !== 1.0 && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {waveInfo.adaptiveMultiplier < 1.0 ? (
                  <TrendingDown className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-red-400" />
                )}
                <span>
                  {waveInfo.adaptiveMultiplier > 1.0
                    ? 'Your defensive setup is strong! Enemies are harder to maintain challenge.'
                    : 'Your defensive setup needs improvement. Enemies are easier to keep it playable.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Enemy Types */}
        <div className="mb-6">
          <h3 className="font-bold text-white mb-3">Enemy Composition</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.entries(enemyCounts) as [EnemyType, number][]).map(
              ([type, count]) => {
                if (count === 0) return null;
                const stats = ENEMY_STATS[type];
                const scaledHealth = Math.floor(
                  stats.health * waveInfo.totalHealthMultiplier,
                );
                const scaledReward = Math.floor(
                  stats.reward * waveInfo.rewardMultiplier,
                );

                return (
                  <div
                    className="bg-gray-900/50 border-2 rounded-lg p-4"
                    key={type}
                    style={{
                      borderColor:
                        type === 'boss'
                          ? 'rgba(168, 85, 247, 0.5)'
                          : 'rgba(107, 114, 128, 0.3)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-bold ${getEnemyTypeColor(type)}`}>
                        {getEnemyTypeName(type)}
                      </h4>
                      <span className="text-white font-mono text-sm">
                        ×{count}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {/* Health with breakdown */}
                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-gray-400">Health:</span>
                          <span className="text-white font-mono font-bold">
                            {scaledHealth.toLocaleString()}
                          </span>
                        </div>
                        {waveInfo.totalHealthMultiplier !== 1.0 && (
                          <div className="text-[11px] text-gray-300 pl-1">
                            Base {stats.health.toLocaleString()} •{' '}
                            <span className="text-cyan-300 font-semibold">
                              ×{waveInfo.totalHealthMultiplier.toFixed(2)}
                            </span>
                            {waveInfo.baseHealthMultiplier !==
                              waveInfo.totalHealthMultiplier && (
                              <>
                                {' '}
                                (
                                <span className="text-purple-300">
                                  base ×
                                  {waveInfo.baseHealthMultiplier.toFixed(2)}
                                </span>
                                {' × '}
                                <span className="text-orange-300">
                                  adaptive ×
                                  {waveInfo.adaptiveMultiplier.toFixed(2)}
                                </span>
                                )
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Speed */}
                      <div className="flex justify-between text-gray-400">
                        <span>Speed:</span>
                        <span className="text-white font-mono">
                          {stats.speed.toFixed(2)}
                        </span>
                      </div>

                      {/* Reward with breakdown */}
                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-gray-400">Reward:</span>
                          <span className="text-cyan-400 font-mono font-bold">
                            {(() => {
                              let finalReward = scaledReward;
                              if (
                                gameState.runUpgrade?.effect.type ===
                                'rewardMult'
                              ) {
                                finalReward = Math.floor(
                                  finalReward *
                                    (1 + gameState.runUpgrade.effect.value),
                                );
                              }
                              return finalReward;
                            })()}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-300 pl-1">
                          Base {stats.reward} •{' '}
                          <span className="text-cyan-300 font-semibold">
                            ×{waveInfo.rewardMultiplier.toFixed(2)}
                          </span>
                          {gameState.runUpgrade?.effect.type ===
                            'rewardMult' && (
                            <>
                              {' '}
                              (
                              <span className="text-yellow-300">
                                run upgrade +
                                {Math.round(
                                  gameState.runUpgrade.effect.value * 100,
                                )}
                                %
                              </span>
                              )
                            </>
                          )}
                        </div>
                      </div>

                      {/* Size */}
                      <div className="flex justify-between text-gray-400">
                        <span>Size:</span>
                        <span className="text-white font-mono">
                          {stats.size.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>

        {/* Towers Overview */}
        <div className="mb-6">
          <h3 className="font-bold text-white mb-3">Available Towers</h3>
          <div className="space-y-6">
            {(['basic', 'bomb', 'slow', 'sniper'] as TowerType[]).map(
              (type) => {
                const stats = TOWER_STATS[type];
                const towerColors = {
                  basic: 'text-cyan-400',
                  bomb: 'text-pink-400',
                  slow: 'text-purple-400',
                  sniper: 'text-green-400',
                };

                const levels = [1, 2, 3, 4, 5];

                return (
                  <div key={type}>
                    <h4
                      className={`font-bold text-sm mb-3 ${towerColors[type]}`}
                    >
                      {type.toUpperCase()} Tower
                    </h4>
                    <div
                      className="overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
                      style={{
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                      }}
                    >
                      <div className="flex gap-4">
                        {levels.map((level) => {
                          const baseDamage =
                            stats.damage * getTowerDamageLevelMultiplier(level);
                          const baseFireRate =
                            stats.fireRate *
                            getTowerFireRateLevelMultiplier(level);
                          const baseRange =
                            stats.range + getTowerRangeLevelBonus(level);

                          const representativeTower = {
                            id: 0,
                            lastShot: 0,
                            level,
                            position: { x: 0, y: 0 },
                            type,
                          };

                          const effectiveDamage = calculateDamage({
                            activeWavePowerUps: gameState.activeWavePowerUps,
                            adjacentTowerCount: 0,
                            powerup: undefined,
                            runUpgrade: gameState.runUpgrade,
                            tower: representativeTower,
                          });

                          const effectiveFireRate = calculateFireRate({
                            activeWavePowerUps: gameState.activeWavePowerUps,
                            gameSpeed: 1,
                            runUpgrade: gameState.runUpgrade,
                            tower: representativeTower,
                          });

                          const effectiveRange = calculateTowerRange({
                            activeWavePowerUps: gameState.activeWavePowerUps,
                            baseRange,
                            towerLevel: level,
                          });

                          const damageDelta = effectiveDamage - baseDamage;
                          const fireRateDelta =
                            baseFireRate - effectiveFireRate;
                          const rangeDelta = effectiveRange - baseRange;

                          return (
                            <div
                              className="snap-center shrink-0 w-[85vw] md:w-[40vw] lg:w-[35vw]"
                              key={level}
                            >
                              <div
                                className="bg-gray-900/50 border-2 rounded-lg p-3"
                                style={{
                                  borderColor: 'rgba(107, 114, 128, 0.3)',
                                }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h5
                                    className={`font-bold text-sm ${towerColors[type]}`}
                                  >
                                    {type.toUpperCase()} • Lv.{level}
                                  </h5>
                                </div>
                                <div className="space-y-2 text-xs">
                                  {/* Damage */}
                                  <div>
                                    <div className="flex justify-between items-baseline mb-1">
                                      <span className="text-gray-400">
                                        Damage:
                                      </span>
                                      <span className="text-white font-mono font-bold">
                                        {Math.round(
                                          effectiveDamage,
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                    {damageDelta !== 0 && (
                                      <div className="text-[11px] text-gray-300 pl-1">
                                        Base{' '}
                                        {Math.round(
                                          baseDamage,
                                        ).toLocaleString()}{' '}
                                        •{' '}
                                        <span className="text-cyan-300 font-semibold">
                                          +
                                          {Math.round(
                                            Math.abs(damageDelta),
                                          ).toLocaleString()}{' '}
                                          (
                                          {Math.round(
                                            (Math.abs(damageDelta) /
                                              baseDamage) *
                                              100,
                                          )}
                                          %)
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Fire Rate */}
                                  <div>
                                    <div className="flex justify-between items-baseline mb-1">
                                      <span className="text-gray-400">
                                        Fire Rate:
                                      </span>
                                      <span className="text-white font-mono font-bold">
                                        {Math.round(effectiveFireRate)}ms
                                      </span>
                                    </div>
                                    {fireRateDelta !== 0 && (
                                      <div className="text-[11px] text-gray-300 pl-1">
                                        Base {Math.round(baseFireRate)}ms •{' '}
                                        <span className="text-cyan-300 font-semibold">
                                          {fireRateDelta > 0 ? '-' : '+'}
                                          {Math.round(Math.abs(fireRateDelta))}
                                          ms (
                                          {Math.round(
                                            (Math.abs(fireRateDelta) /
                                              baseFireRate) *
                                              100,
                                          )}
                                          %)
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Range */}
                                  <div>
                                    <div className="flex justify-between items-baseline mb-1">
                                      <span className="text-gray-400">
                                        Range:
                                      </span>
                                      <span className="text-white font-mono font-bold">
                                        {effectiveRange.toFixed(1)}
                                      </span>
                                    </div>
                                    {rangeDelta !== 0 && (
                                      <div className="text-[11px] text-gray-300 pl-1">
                                        Base {baseRange.toFixed(1)} •{' '}
                                        <span className="text-cyan-300 font-semibold">
                                          +{rangeDelta.toFixed(1)} (
                                          {Math.round(
                                            (rangeDelta / baseRange) * 100,
                                          )}
                                          %)
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WaveInfoDrawer({
  gameState,
  onClose,
}: WaveInfoDrawerProps) {
  const currentWave = gameState.wave;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentWaveRef = useRef<HTMLDivElement>(null);

  // Generate wave numbers to show (3 before, current, 3 after)
  const wavesToShow: number[] = [];
  const startWave = Math.max(1, currentWave - 2);
  const endWave = Math.min(gameState.maxWaves, currentWave + 3);

  for (let i = startWave; i <= endWave; i++) {
    wavesToShow.push(i);
  }

  // Scroll to current wave on mount
  useEffect(() => {
    if (currentWaveRef.current && scrollContainerRef.current) {
      // Wait for layout to settle
      setTimeout(() => {
        currentWaveRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }, 100);
    }
  }, []);

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
        className="relative bg-black border-2 border-purple-400 rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)' }}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10 bg-black/50 rounded-full p-2"
          onClick={onClose}
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Carousel */}
        <div
          className="overflow-x-auto overflow-y-auto max-h-[90vh] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
          ref={scrollContainerRef}
          style={{
            msOverflowStyle: 'none', // IE/Edge
            scrollbarWidth: 'none', // Firefox
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex">
            {wavesToShow.map((waveNumber) => (
              <div
                className="snap-center shrink-0"
                key={waveNumber}
                ref={waveNumber === currentWave ? currentWaveRef : null}
                style={{ scrollSnapAlign: 'center' }}
              >
                <WaveCard
                  gameState={gameState}
                  isCurrentWave={waveNumber === currentWave}
                  isNextWave={waveNumber === currentWave + 1}
                  waveNumber={waveNumber}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
