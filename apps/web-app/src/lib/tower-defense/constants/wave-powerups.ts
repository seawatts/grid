import type { WavePowerUp } from '../game-types';

export const WAVE_POWERUP_POOL: WavePowerUp[] = [
  // Permanent damage boosts
  {
    description: 'All towers deal 15% more damage permanently.',
    duration: 'permanent',
    effect: { type: 'damageMult', value: 0.15 },
    icon: 'damage',
    id: 'permanent-damage-15',
    name: 'Overcharged Weapons',
    stacking: 'additive',
  },
  {
    description: 'All towers deal 25% more damage permanently.',
    duration: 'permanent',
    effect: { type: 'damageMult', value: 0.25 },
    icon: 'damage',
    id: 'permanent-damage-25',
    name: 'Supercharged Systems',
    stacking: 'additive',
  },

  // Temporary damage boosts
  {
    description: 'All towers deal 30% more damage for 3 waves.',
    duration: 3,
    effect: { type: 'damageMult', value: 0.3 },
    icon: 'damage',
    id: 'temp-damage-30-3',
    name: 'Tactical Overload',
    stacking: 'additive',
  },
  {
    description: 'All towers deal 50% more damage for the next wave.',
    duration: 1,
    effect: { type: 'damageMult', value: 0.5 },
    icon: 'damage',
    id: 'temp-damage-50-1',
    name: 'Burst Power',
    stacking: 'additive',
  },

  // Fire rate boosts
  {
    description: 'All towers fire 20% faster permanently.',
    duration: 'permanent',
    effect: { type: 'fireRateMult', value: 0.2 },
    icon: 'speed',
    id: 'permanent-firerate-20',
    name: 'Rapid Fire Protocol',
    stacking: 'multiplicative',
  },
  {
    description: 'All towers fire 30% faster for 2 waves.',
    duration: 2,
    effect: { type: 'fireRateMult', value: 0.3 },
    icon: 'speed',
    id: 'temp-firerate-30-2',
    name: 'Speed Boost',
    stacking: 'multiplicative',
  },

  // Money bonuses
  {
    description: 'Gain 50 credits immediately.',
    duration: 0, // Immediate effect, no duration
    effect: { type: 'addMoney', value: 50 },
    icon: 'money',
    id: 'money-50',
    name: 'Emergency Funds',
    stacking: 'additive',
  },
  {
    description: 'Gain 100 credits immediately.',
    duration: 0,
    effect: { type: 'addMoney', value: 100 },
    icon: 'money',
    id: 'money-100',
    name: 'Windfall',
    stacking: 'additive',
  },
  {
    description: 'Gain 150 credits immediately.',
    duration: 0,
    effect: { type: 'addMoney', value: 150 },
    icon: 'money',
    id: 'money-150',
    name: 'Major Funding',
    stacking: 'additive',
  },

  // Life bonuses
  {
    description: 'Gain 5 lives immediately.',
    duration: 0,
    effect: { type: 'addLives', value: 5 },
    icon: 'health',
    id: 'lives-5',
    name: 'Reinforcement',
    stacking: 'additive',
  },
  {
    description: 'Gain 10 lives immediately.',
    duration: 0,
    effect: { type: 'addLives', value: 10 },
    icon: 'health',
    id: 'lives-10',
    name: 'Major Reinforcement',
    stacking: 'additive',
  },

  // Reward multipliers
  {
    description: 'Enemies drop 25% more credits permanently.',
    duration: 'permanent',
    effect: { type: 'rewardMult', value: 0.25 },
    icon: 'reward',
    id: 'permanent-reward-25',
    name: 'Bounty Hunter',
    stacking: 'additive',
  },
  {
    description: 'Enemies drop 50% more credits for 2 waves.',
    duration: 2,
    effect: { type: 'rewardMult', value: 0.5 },
    icon: 'reward',
    id: 'temp-reward-50-2',
    name: 'Double Bounty',
    stacking: 'additive',
  },

  // Range boosts
  {
    description: 'All towers have 20% more range permanently.',
    duration: 'permanent',
    effect: { type: 'towerRangeMult', value: 0.2 },
    icon: 'range',
    id: 'permanent-range-20',
    name: 'Extended Range',
    stacking: 'additive',
  },
  {
    description: 'All towers have 50% more range for the next wave.',
    duration: 1,
    effect: { type: 'towerRangeMult', value: 0.5 },
    icon: 'range',
    id: 'temp-range-50-1',
    name: 'Long Range Mode',
    stacking: 'additive',
  },
  {
    description: 'All towers gain +1 range permanently.',
    duration: 'permanent',
    effect: { type: 'towerRangeAdd', value: 1 },
    icon: 'range',
    id: 'permanent-range-add-1',
    name: 'Range Extension',
    stacking: 'additive',
  },
];

/**
 * Randomly selects 3 unique power-ups from the pool
 */
export function selectRandomPowerUps(count = 3): WavePowerUp[] {
  const shuffled = [...WAVE_POWERUP_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, WAVE_POWERUP_POOL.length));
}
