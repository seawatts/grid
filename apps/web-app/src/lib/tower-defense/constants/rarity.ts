import type { PowerupRarity } from '../game-types';
import type { TierInfo } from '../utils/rendering';

/**
 * Rarity weights for spawn probability
 * These represent the relative chance of each rarity appearing
 */
export const RARITY_WEIGHTS: Record<PowerupRarity, number> = {
  common: 50, // 50% chance
  epic: 15, // 15% chance
  legendary: 5, // 5% chance
  rare: 30, // 30% chance
};

/**
 * Power multipliers per rarity
 * These multiply the base effect values
 */
export const RARITY_MULTIPLIERS: Record<PowerupRarity, number> = {
  common: 1.0, // No multiplier
  epic: 1.5, // 50% boost
  legendary: 2.0, // 100% boost
  rare: 1.2, // 20% boost
};

/**
 * Colors for each rarity tier
 */
export const RARITY_COLORS: Record<PowerupRarity, string> = {
  common: 'var(--rarity-common-color)',
  epic: 'var(--rarity-epic-color)',
  legendary: 'var(--rarity-legendary-color)',
  rare: 'var(--rarity-rare-color)',
};

/**
 * Glow colors for each rarity tier
 */
export const RARITY_GLOW_COLORS: Record<PowerupRarity, string> = {
  common: 'var(--rarity-common-glow)',
  epic: 'var(--rarity-epic-glow)',
  legendary: 'var(--rarity-legendary-glow)',
  rare: 'var(--rarity-rare-glow)',
};

/**
 * Border colors for each rarity tier
 */
export const RARITY_BORDER_COLORS: Record<PowerupRarity, string> = {
  common: 'var(--rarity-common-color)',
  epic: 'var(--rarity-epic-color)',
  legendary: 'var(--rarity-legendary-color)',
  rare: 'var(--rarity-rare-color)',
};

/**
 * Get the spawn weight for a rarity
 */
export function getRarityWeight(rarity: PowerupRarity): number {
  return RARITY_WEIGHTS[rarity];
}

/**
 * Get the power multiplier for a rarity
 */
export function getRarityMultiplier(rarity: PowerupRarity): number {
  return RARITY_MULTIPLIERS[rarity];
}

/**
 * Select a rarity using weighted random selection
 */
export function selectRarityByWeight(): PowerupRarity {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce(
    (sum, weight) => sum + weight,
    0,
  );
  let random = Math.random() * totalWeight;

  const rarities: PowerupRarity[] = ['common', 'rare', 'epic', 'legendary'];
  for (const rarity of rarities) {
    const weight = RARITY_WEIGHTS[rarity];
    if (random < weight) {
      return rarity;
    }
    random -= weight;
  }

  // Fallback to common (should never reach here)
  return 'common';
}

/**
 * Get the color for a rarity
 */
export function getRarityColor(rarity: PowerupRarity): string {
  return RARITY_COLORS[rarity];
}

/**
 * Get the glow color for a rarity
 */
export function getRarityGlowColor(rarity: PowerupRarity): string {
  return RARITY_GLOW_COLORS[rarity];
}

/**
 * Get the border color for a rarity
 */
export function getRarityBorderColor(rarity: PowerupRarity): string {
  return RARITY_BORDER_COLORS[rarity];
}

/**
 * Get tier info for a rarity (for visual display)
 */
export function getRarityTierInfo(rarity: PowerupRarity): TierInfo {
  const tierMap: Record<PowerupRarity, number> = {
    common: 1,
    epic: 3,
    legendary: 4,
    rare: 2,
  };

  const iconMap: Record<PowerupRarity, string> = {
    common: '⚡',
    epic: '⚡⚡⚡',
    legendary: '⚡⚡⚡⚡',
    rare: '⚡⚡',
  };

  return {
    color: getRarityColor(rarity),
    glowColor: getRarityGlowColor(rarity),
    icon: iconMap[rarity],
    tier: tierMap[rarity],
  };
}

/**
 * Get display name for a rarity
 */
export function getRarityName(rarity: PowerupRarity): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}
