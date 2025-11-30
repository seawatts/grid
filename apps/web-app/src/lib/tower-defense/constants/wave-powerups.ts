import type { WavePowerUp } from '../game-types';
import { selectRarityByWeight } from './rarity';

export const WAVE_POWERUP_POOL: WavePowerUp[] = [
  // Permanent damage boosts
  {
    description: 'All towers deal 15% more damage permanently.',
    duration: 'permanent',
    effect: { type: 'damageMult', value: 0.15 },
    icon: 'damage',
    id: 'permanent-damage-15',
    name: 'Overclock',
    rarity: 'common',
    stacking: 'additive',
  },
  {
    description: 'All towers deal 25% more damage permanently.',
    duration: 'permanent',
    effect: { type: 'damageMult', value: 0.25 },
    icon: 'damage',
    id: 'permanent-damage-25',
    name: 'Turbo',
    rarity: 'rare',
    stacking: 'additive',
  },

  // Temporary damage boosts
  {
    description: 'All towers deal 30% more damage for 3 waves.',
    duration: 3,
    effect: { type: 'damageMult', value: 0.3 },
    icon: 'damage',
    id: 'temp-damage-30-3',
    name: 'Overload',
    rarity: 'epic',
    stacking: 'additive',
  },
  {
    description: 'All towers deal 50% more damage for the next wave.',
    duration: 1,
    effect: { type: 'damageMult', value: 0.5 },
    icon: 'damage',
    id: 'temp-damage-50-1',
    name: 'Burst',
    rarity: 'legendary',
    stacking: 'additive',
  },

  // Fire rate boosts
  {
    description: 'All towers fire 20% faster permanently.',
    duration: 'permanent',
    effect: { type: 'fireRateMult', value: 0.2 },
    icon: 'speed',
    id: 'permanent-firerate-20',
    name: 'Turbo Mode',
    rarity: 'rare',
    stacking: 'multiplicative',
  },
  {
    description: 'All towers fire 30% faster for 2 waves.',
    duration: 2,
    effect: { type: 'fireRateMult', value: 0.3 },
    icon: 'speed',
    id: 'temp-firerate-30-2',
    name: 'Cache',
    rarity: 'epic',
    stacking: 'multiplicative',
  },

  // Money bonuses
  {
    description: 'Gain 50 credits immediately.',
    duration: 0, // Immediate effect, no duration
    effect: { type: 'addMoney', value: 50 },
    icon: 'money',
    id: 'money-50',
    name: 'Buffer',
    rarity: 'common',
    stacking: 'additive',
  },
  {
    description: 'Gain 100 credits immediately.',
    duration: 0,
    effect: { type: 'addMoney', value: 100 },
    icon: 'money',
    id: 'money-100',
    name: 'Stack',
    rarity: 'rare',
    stacking: 'additive',
  },
  {
    description: 'Gain 150 credits immediately.',
    duration: 0,
    effect: { type: 'addMoney', value: 150 },
    icon: 'money',
    id: 'money-150',
    name: 'Heap',
    rarity: 'epic',
    stacking: 'additive',
  },

  // Life bonuses
  {
    description: 'Gain 5 lives immediately.',
    duration: 0,
    effect: { type: 'addLives', value: 5 },
    icon: 'health',
    id: 'lives-5',
    name: 'Core',
    rarity: 'common',
    stacking: 'additive',
  },
  {
    description: 'Gain 10 lives immediately.',
    duration: 0,
    effect: { type: 'addLives', value: 10 },
    icon: 'health',
    id: 'lives-10',
    name: 'Core+',
    rarity: 'rare',
    stacking: 'additive',
  },

  // Reward multipliers
  {
    description: 'Enemies drop 25% more credits permanently.',
    duration: 'permanent',
    effect: { type: 'rewardMult', value: 0.25 },
    icon: 'reward',
    id: 'permanent-reward-25',
    name: 'Hash',
    rarity: 'rare',
    stacking: 'additive',
  },
  {
    description: 'Enemies drop 50% more credits for 2 waves.',
    duration: 2,
    effect: { type: 'rewardMult', value: 0.5 },
    icon: 'reward',
    id: 'temp-reward-50-2',
    name: 'Dual Hash',
    rarity: 'epic',
    stacking: 'additive',
  },

  // Range boosts
  {
    description: 'All towers have 20% more range permanently.',
    duration: 'permanent',
    effect: { type: 'towerRangeMult', value: 0.2 },
    icon: 'range',
    id: 'permanent-range-20',
    name: 'Vector',
    rarity: 'rare',
    stacking: 'additive',
  },
  {
    description: 'All towers have 50% more range for the next wave.',
    duration: 1,
    effect: { type: 'towerRangeMult', value: 0.5 },
    icon: 'range',
    id: 'temp-range-50-1',
    name: 'Long Mode',
    rarity: 'legendary',
    stacking: 'additive',
  },
  {
    description: 'All towers gain +1 range permanently.',
    duration: 'permanent',
    effect: { type: 'towerRangeAdd', value: 1 },
    icon: 'range',
    id: 'permanent-range-add-1',
    name: 'Extend',
    rarity: 'epic',
    stacking: 'additive',
  },
];

/**
 * Randomly selects power-ups from the pool using weighted selection based on rarity
 * @param count - Number of power-ups to select
 * @param permanentOnly - If true, only select power-ups with permanent duration (for pre-game selection)
 */
export function selectRandomPowerUps(
  count = 3,
  permanentOnly = false,
): WavePowerUp[] {
  // Filter pool if only permanent power-ups are requested
  const pool = permanentOnly
    ? WAVE_POWERUP_POOL.filter((p) => p.duration === 'permanent')
    : WAVE_POWERUP_POOL;

  // Group powerups by rarity
  const byRarity: Record<string, WavePowerUp[]> = {
    common: [],
    epic: [],
    legendary: [],
    rare: [],
  };

  for (const powerup of pool) {
    const rarity = powerup.rarity ?? 'common';
    if (rarity in byRarity && byRarity[rarity]) {
      byRarity[rarity]?.push(powerup);
    }
  }

  const selected: WavePowerUp[] = [];
  const usedIds = new Set<string>();

  // Select powerups using weighted rarity selection
  while (selected.length < count && selected.length < pool.length) {
    // Select a rarity using weighted selection
    const selectedRarity = selectRarityByWeight();
    const poolForRarity =
      byRarity[selectedRarity]?.filter((p) => !usedIds.has(p.id)) ?? [];

    if (poolForRarity.length === 0) {
      // If no powerups of this rarity are available, try another
      const availableRarities = Object.keys(byRarity).filter(
        (r): r is keyof typeof byRarity =>
          r in byRarity &&
          (byRarity[r]?.some((p) => !usedIds.has(p.id)) ?? false),
      );
      if (availableRarities.length === 0) break;

      const fallbackRarity =
        availableRarities[Math.floor(Math.random() * availableRarities.length)];
      if (!fallbackRarity || !(fallbackRarity in byRarity)) break;
      const fallbackPool = byRarity[fallbackRarity]?.filter(
        (p) => !usedIds.has(p.id),
      );
      if (fallbackPool && fallbackPool.length > 0) {
        const selectedPowerup =
          fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
        if (selectedPowerup) {
          selected.push(selectedPowerup);
          usedIds.add(selectedPowerup.id);
        }
      } else {
        break;
      }
    } else {
      const selectedPowerup =
        poolForRarity[Math.floor(Math.random() * poolForRarity.length)];
      if (selectedPowerup) {
        selected.push(selectedPowerup);
        usedIds.add(selectedPowerup.id);
      }
    }
  }

  return selected;
}
