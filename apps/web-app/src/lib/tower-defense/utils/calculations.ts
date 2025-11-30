import { TOWER_STATS } from '../constants/balance';
import { ADJACENT_TOWER_BONUS, COMBO_WINDOW } from '../game-constants';
import type {
  Enemy,
  PlaceableItem,
  RunUpgrade,
  Tower,
  WavePowerUp,
} from '../game-types';

export interface DamageCalculationParams {
  tower: Tower;
  runUpgrade?: RunUpgrade;
  powerup?: PlaceableItem & { category: 'powerup' };
  activeWavePowerUps?: WavePowerUp[];
  adjacentTowerCount: number;
}

export function getTowerDamageLevelMultiplier(level?: number): number {
  const towerLevel = Math.max(1, level ?? 1);
  return towerLevel;
}

export function getTowerFireRateLevelMultiplier(level?: number): number {
  const towerLevel = Math.max(1, level ?? 1);
  const reductionPerLevel = 0.1; // 10% faster per level
  const multiplier = 1 - (towerLevel - 1) * reductionPerLevel;
  return Math.max(0.7, multiplier); // cap at 30% faster
}

export function getTowerRangeLevelBonus(level?: number): number {
  const towerLevel = Math.max(1, level ?? 1);
  const bonusPerLevel = 0.25;
  return Math.max(0, towerLevel - 1) * bonusPerLevel;
}

export function getTowerPenetrationLevelBonus(level?: number): number {
  const towerLevel = Math.max(1, level ?? 1);
  const bonusPerLevel = 0.5; // +0.5 penetration per level
  return Math.max(0, towerLevel - 1) * bonusPerLevel;
}

/**
 * Aggregates wave power-up effects based on stacking rules
 */
export function aggregateWavePowerUpEffects(
  powerUps: WavePowerUp[],
  effectType: WavePowerUp['effect']['type'],
): number {
  const relevantPowerUps = powerUps.filter(
    (pu) => pu.effect.type === effectType,
  );

  if (relevantPowerUps.length === 0) return 0;

  // Group by stacking type
  const additive = relevantPowerUps.filter((pu) => pu.stacking === 'additive');
  const multiplicative = relevantPowerUps.filter(
    (pu) => pu.stacking === 'multiplicative',
  );
  const replace = relevantPowerUps.filter((pu) => pu.stacking === 'replace');

  let result = 0;

  // Replace takes precedence
  if (replace.length > 0) {
    // Use the highest value
    result = Math.max(...replace.map((pu) => pu.effect.value));
  } else {
    // Additive effects sum
    const additiveSum = additive.reduce((sum, pu) => sum + pu.effect.value, 0);

    // Multiplicative effects compound
    const multiplicativeProduct = multiplicative.reduce(
      (prod, pu) => prod * (1 + pu.effect.value),
      1,
    );

    result = additiveSum + (multiplicativeProduct - 1);
  }

  return result;
}

export function calculateDamage(params: DamageCalculationParams): number {
  const {
    tower,
    runUpgrade,
    powerup,
    activeWavePowerUps = [],
    adjacentTowerCount,
  } = params;
  const stats = TOWER_STATS[tower.type];

  let damageMultiplier = 1;

  // Apply run upgrade damage multiplier
  if (runUpgrade?.effect.type === 'damageMult') {
    damageMultiplier += runUpgrade.effect.value;
  }

  // Apply wave power-up damage multipliers
  const waveDamageBoost = aggregateWavePowerUpEffects(
    activeWavePowerUps,
    'damageMult',
  );
  damageMultiplier += waveDamageBoost;

  // Apply powerup boost
  if (powerup) {
    damageMultiplier *= powerup.boost;
  }

  // Apply adjacent tower bonus
  damageMultiplier += adjacentTowerCount * ADJACENT_TOWER_BONUS;

  const baseDamage =
    stats.damage * getTowerDamageLevelMultiplier(tower.level ?? 1);
  return baseDamage * damageMultiplier;
}

export interface FireRateCalculationParams {
  tower: Tower;
  runUpgrade?: RunUpgrade;
  activeWavePowerUps?: WavePowerUp[];
  gameSpeed: number;
}

export function calculateFireRate(params: FireRateCalculationParams): number {
  const { tower, runUpgrade, activeWavePowerUps = [], gameSpeed } = params;
  const stats = TOWER_STATS[tower.type];

  // Start with base fire rate multiplier
  let fireRateMult = 1;

  // Collect all fire rate boosts (runUpgrade + wave power-ups)
  const fireRateBoosts: number[] = [];
  if (runUpgrade?.effect.type === 'fireRateMult') {
    fireRateBoosts.push(runUpgrade.effect.value);
  }

  // Apply wave power-up fire rate multipliers
  const relevantPowerUps = activeWavePowerUps.filter(
    (pu) => pu.effect.type === 'fireRateMult',
  );

  if (relevantPowerUps.length > 0) {
    // Group by stacking type
    const additive = relevantPowerUps.filter(
      (pu) => pu.stacking === 'additive',
    );
    const multiplicative = relevantPowerUps.filter(
      (pu) => pu.stacking === 'multiplicative',
    );
    const replace = relevantPowerUps.filter((pu) => pu.stacking === 'replace');

    if (replace.length > 0) {
      // Replace takes precedence - use highest value, ignore runUpgrade
      const maxValue = Math.max(...replace.map((pu) => pu.effect.value));
      fireRateMult = 1 - maxValue;
    } else {
      // Additive effects sum (including runUpgrade)
      const additiveSum =
        (runUpgrade?.effect.type === 'fireRateMult'
          ? runUpgrade.effect.value
          : 0) + additive.reduce((sum, pu) => sum + pu.effect.value, 0);

      // Multiplicative effects compound
      const multiplicativeProduct = multiplicative.reduce(
        (prod, pu) => prod * (1 - pu.effect.value),
        1,
      );

      // Apply: (1 - additiveSum) * multiplicativeProduct
      fireRateMult = (1 - additiveSum) * multiplicativeProduct;
    }
  } else if (runUpgrade?.effect.type === 'fireRateMult') {
    // Only runUpgrade, no wave power-ups
    fireRateMult = 1 - runUpgrade.effect.value;
  }

  fireRateMult *= getTowerFireRateLevelMultiplier(tower.level);

  return (stats.fireRate * fireRateMult) / gameSpeed;
}

export interface RewardCalculationParams {
  baseReward: number;
  combo: number;
  runUpgrade?: RunUpgrade;
  activeWavePowerUps?: WavePowerUp[];
}

export function calculateReward(params: RewardCalculationParams): number {
  const { baseReward, runUpgrade, activeWavePowerUps = [] } = params;

  let rewardMult = 1;
  if (runUpgrade?.effect.type === 'rewardMult') {
    rewardMult = 1 + runUpgrade.effect.value;
  }

  // Apply wave power-up reward multipliers
  const waveRewardBoost = aggregateWavePowerUpEffects(
    activeWavePowerUps,
    'rewardMult',
  );
  rewardMult += waveRewardBoost;

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

export interface TowerRangeCalculationParams {
  baseRange: number;
  towerLevel?: number;
  activeWavePowerUps?: WavePowerUp[];
}

export function calculateTowerRange(
  params: TowerRangeCalculationParams,
): number {
  const { baseRange, towerLevel, activeWavePowerUps = [] } = params;

  let range = baseRange + getTowerRangeLevelBonus(towerLevel);

  // Apply additive range boosts
  const rangeMultBoost = aggregateWavePowerUpEffects(
    activeWavePowerUps,
    'towerRangeMult',
  );
  range *= 1 + rangeMultBoost;

  // Apply flat range additions
  const rangeAddBoost = aggregateWavePowerUpEffects(
    activeWavePowerUps,
    'towerRangeAdd',
  );
  range += rangeAddBoost;

  return range;
}

export interface PenetrationCalculationParams {
  tower: Tower;
  runUpgrade?: RunUpgrade;
  activeWavePowerUps?: WavePowerUp[];
}

export function calculatePenetration(
  params: PenetrationCalculationParams,
): number {
  const { tower, activeWavePowerUps = [] } = params;
  const stats = TOWER_STATS[tower.type];

  // Start with base penetration (default to 0 if not present for backward compatibility)
  let penetration = 'penetration' in stats ? stats.penetration : 0;

  // Apply level bonus
  penetration += getTowerPenetrationLevelBonus(tower.level);

  // Apply run upgrade penetration (if it exists in the future)
  // For now, we'll support it in the structure but not implement it yet
  // if (runUpgrade?.effect.type === 'penetrationAdd') {
  //   penetration += runUpgrade.effect.value;
  // }

  // Apply wave power-up penetration additions
  const penetrationAddBoost = aggregateWavePowerUpEffects(
    activeWavePowerUps,
    'penetrationAdd',
  );
  penetration += penetrationAddBoost;

  // Apply wave power-up penetration multipliers
  const penetrationMultBoost = aggregateWavePowerUpEffects(
    activeWavePowerUps,
    'penetrationMult',
  );
  penetration *= 1 + penetrationMultBoost;

  // Round to nearest integer (penetration is discrete)
  return Math.max(0, Math.round(penetration));
}
