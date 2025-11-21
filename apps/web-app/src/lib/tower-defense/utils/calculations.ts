import {
  ADJACENT_TOWER_BONUS,
  COMBO_WINDOW,
  TOWER_STATS,
} from '../game-constants';
import type { Enemy, PowerUp, RunUpgrade, Tower } from '../game-types';

export interface DamageCalculationParams {
  tower: Tower;
  runUpgrade?: RunUpgrade;
  powerup?: PowerUp;
  adjacentTowerCount: number;
}

export function calculateDamage(params: DamageCalculationParams): number {
  const { tower, runUpgrade, powerup, adjacentTowerCount } = params;
  const stats = TOWER_STATS[tower.type];

  let damageMultiplier = 1;

  // Apply run upgrade damage multiplier
  if (runUpgrade?.effect.type === 'damageMult') {
    damageMultiplier += runUpgrade.effect.value;
  }

  // Apply powerup boost
  if (powerup) {
    damageMultiplier *= powerup.boost;
  }

  // Apply adjacent tower bonus
  damageMultiplier += adjacentTowerCount * ADJACENT_TOWER_BONUS;

  return stats.damage * damageMultiplier;
}

export interface FireRateCalculationParams {
  tower: Tower;
  runUpgrade?: RunUpgrade;
  gameSpeed: number;
}

export function calculateFireRate(params: FireRateCalculationParams): number {
  const { tower, runUpgrade, gameSpeed } = params;
  const stats = TOWER_STATS[tower.type];

  let fireRateMult = 1;
  if (runUpgrade?.effect.type === 'fireRateMult') {
    fireRateMult = 1 - runUpgrade.effect.value;
  }

  return (stats.fireRate * fireRateMult) / gameSpeed;
}

export interface RewardCalculationParams {
  baseReward: number;
  combo: number;
  runUpgrade?: RunUpgrade;
}

export function calculateReward(params: RewardCalculationParams): number {
  const { baseReward, runUpgrade } = params;

  let rewardMult = 1;
  if (runUpgrade?.effect.type === 'rewardMult') {
    rewardMult = 1 + runUpgrade.effect.value;
  }

  const reward = Math.floor(baseReward * rewardMult);
  return reward;
}

export function calculateScoreWithCombo(
  baseReward: number,
  combo: number,
): number {
  return Math.floor(baseReward * (1 + (combo - 1) * 0.1));
}

export function shouldResetCombo(
  lastKillTime: number,
  currentTime: number,
): boolean {
  return currentTime - lastKillTime > COMBO_WINDOW;
}

export function getAdjacentTowerCount(
  towerPosition: { x: number; y: number },
  allTowers: Tower[],
): number {
  const adjacentPositions = [
    { x: towerPosition.x, y: towerPosition.y - 1 },
    { x: towerPosition.x, y: towerPosition.y + 1 },
    { x: towerPosition.x - 1, y: towerPosition.y },
    { x: towerPosition.x + 1, y: towerPosition.y },
  ];

  return adjacentPositions.filter((pos) =>
    allTowers.some((t) => t.position.x === pos.x && t.position.y === pos.y),
  ).length;
}

export function getEnemySpeed(enemy: Enemy, gameSpeed: number): number {
  return (enemy.slowed ? enemy.speed * 0.5 : enemy.speed) * gameSpeed;
}
