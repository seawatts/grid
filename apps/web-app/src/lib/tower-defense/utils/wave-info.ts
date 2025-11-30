import { ENEMY_STATS } from '../constants/balance';
import type { EnemyType } from '../game-types';
import {
  combineBlockedPositions,
  findPathsForMultipleStartsAndGoals,
} from '../pathfinding';
import type { GameState } from '../store/types';

export interface WaveInfo {
  wave: number;
  isBossWave: boolean;
  enemyCount: number;
  enemyTypes: EnemyType[];
  baseHealthMultiplier: number;
  adaptiveMultiplier: number;
  totalHealthMultiplier: number;
  rewardMultiplier: number;
  totalHealth: number;
  totalReward: number;
  totalBosses: number;
}

/**
 * Calculate wave information without actually starting the wave
 * This is used for preview/display purposes
 */
export function calculateWaveInfo(
  state: GameState,
  waveNumber: number,
): WaveInfo {
  // Calculate base enemy count
  const baseEnemyCount = calculateEnemyCount(waveNumber);
  const isBossWave = waveNumber > 0 && waveNumber % 10 === 0;

  // Calculate paths for defensive power calculation
  const baseBlockedPositions = [
    ...state.towers.map((t) => t.position),
    ...state.obstacles,
  ];
  const allBlockedPositions = combineBlockedPositions(
    baseBlockedPositions,
    state.placeables,
  );

  const pathsForStarts = findPathsForMultipleStartsAndGoals(
    state.startPositions,
    state.goalPositions,
    allBlockedPositions,
    state.gridWidth,
    state.gridHeight,
  );

  // Calculate adaptive difficulty
  const defensivePower = calculateDefensivePower(state, pathsForStarts);
  const targetPower = calculateTargetPower(waveNumber);
  const adaptiveMultiplier = calculateAdaptiveMultiplier(
    defensivePower,
    targetPower,
  );

  // Calculate health multipliers
  const baseHealthMultiplier = calculateHealthMultiplier(
    waveNumber,
    isBossWave,
  );
  const totalHealthMultiplier = baseHealthMultiplier * adaptiveMultiplier;
  const rewardMultiplier = 1 + (totalHealthMultiplier - 1) * 0.8;

  // Calculate enemy type distribution
  const enemyTypes: EnemyType[] = [];
  const adjustedEnemyCount = Math.floor(baseEnemyCount * adaptiveMultiplier);

  if (isBossWave) {
    const bossCount = Math.floor(waveNumber / 10);
    const enemyTypePlan: EnemyType[] = new Array(adjustedEnemyCount).fill(
      'basic',
    );

    // Place bosses
    if (bossCount > 0) {
      const spacing = Math.floor(adjustedEnemyCount / (bossCount + 1));
      for (let b = 0; b < bossCount; b++) {
        const bossIndex = Math.floor((b + 1) * spacing);
        if (bossIndex < adjustedEnemyCount) {
          enemyTypePlan[bossIndex] = 'boss';
        }
      }
    }

    // Fill remaining slots
    for (let i = 0; i < adjustedEnemyCount; i++) {
      if (enemyTypePlan[i] === 'boss') continue;
      if (waveNumber >= 2 && i % 4 === 0) {
        enemyTypePlan[i] = 'tank';
      } else if (waveNumber >= 1 && i % 3 === 0) {
        enemyTypePlan[i] = 'fast';
      }
    }

    enemyTypes.push(...enemyTypePlan);
  } else {
    // Regular wave logic
    for (let i = 0; i < adjustedEnemyCount; i++) {
      let enemyType: EnemyType = 'basic';

      if (waveNumber >= 3 && (i + 1) % 5 === 0) {
        enemyType = 'boss';
      } else if (waveNumber >= 2 && i % 4 === 0) {
        enemyType = 'tank';
      } else if (waveNumber >= 1 && i % 3 === 0) {
        enemyType = 'fast';
      }

      enemyTypes.push(enemyType);
    }
  }

  // Calculate total health and rewards
  let totalHealth = 0;
  let totalReward = 0;
  let totalBosses = 0;

  // Get run upgrade reward multiplier
  const runUpgradeRewardMult =
    state.runUpgrade?.effect.type === 'rewardMult'
      ? 1 + state.runUpgrade.effect.value
      : 1;

  for (const enemyType of enemyTypes) {
    const stats = ENEMY_STATS[enemyType];
    const scaledHealth = Math.floor(stats.health * totalHealthMultiplier);
    let scaledReward = Math.floor(stats.reward * rewardMultiplier);
    // Apply run upgrade bonus if present
    if (runUpgradeRewardMult > 1) {
      scaledReward = Math.floor(scaledReward * runUpgradeRewardMult);
    }
    totalHealth += scaledHealth;
    totalReward += scaledReward;
    if (enemyType === 'boss') {
      totalBosses++;
    }
  }

  return {
    adaptiveMultiplier,
    baseHealthMultiplier,
    enemyCount: adjustedEnemyCount,
    enemyTypes,
    isBossWave,
    rewardMultiplier,
    totalBosses,
    totalHealth,
    totalHealthMultiplier,
    totalReward,
    wave: waveNumber,
  };
}

// Helper functions (replicated from WaveSystem for preview calculation)
function calculateEnemyCount(wave: number): number {
  if (wave <= 10) {
    return 5 + wave * 2;
  }
  if (wave <= 25) {
    return 25 + (wave - 10) * 3;
  }
  return 70 + (wave - 25) * 4;
}

function calculateHealthMultiplier(wave: number, isBossWave: boolean): number {
  const baseMultiplier = 1 + (wave - 1) * 0.05;
  const bossTierBonus = isBossWave ? Math.floor(wave / 10) * 0.2 : 0;
  return baseMultiplier + bossTierBonus;
}

function calculateTargetPower(wave: number): number {
  if (wave <= 10) {
    return 50 + wave * 10;
  }
  if (wave <= 25) {
    return 150 + (wave - 10) * 20;
  }
  return 450 + (wave - 25) * 30;
}

function calculateAdaptiveMultiplier(
  defensivePower: number,
  targetPower: number,
): number {
  const powerRatio = defensivePower / Math.max(1, targetPower);
  // If player has more power than target, increase difficulty (maximum 1.2x)
  // If player has less power than target, reduce difficulty (minimum 0.8x)
  const multiplier = 1.0 + (powerRatio - 1.0) * 0.2;
  return Math.max(0.8, Math.min(1.2, multiplier));
}

// Simplified defensive power calculation for preview
// This is a simplified version - full calculation requires access to private methods
function calculateDefensivePower(
  state: GameState,
  paths: (import('../game-types').Position[] | null)[],
): number {
  // Simplified calculation - just use tower count and level as a proxy
  // In a real implementation, this would use the full WaveSystem calculation
  let towerPower = 0;
  for (const tower of state.towers) {
    const level = tower.level ?? 1;
    towerPower += 50 * level; // Base power per tower level
  }

  // Add trap power
  const traps = state.placeables.filter((item) => item.category === 'trap');
  const trapPower = traps.length * 25; // Base power per trap

  // Add power-up power
  let powerUpPower = 0;
  for (const powerUp of state.activeWavePowerUps) {
    if (powerUp.effect.type === 'damageMult') {
      powerUpPower += powerUp.effect.value * 100;
    }
  }

  const totalPower = towerPower + trapPower + powerUpPower;
  const pathDifficulty = Math.max(1, paths.filter((p) => p !== null).length);
  return totalPower / pathDifficulty;
}
