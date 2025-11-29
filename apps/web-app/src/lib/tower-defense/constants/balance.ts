export const GRID_SIZE = 12;
export const START_MONEY = 200;
export const START_LIVES = 10;
export const MAX_WAVES = 20;

export const TOWER_STATS = {
  basic: {
    color: 'cyan',
    cost: 50,
    damage: 20,
    fireRate: 500,
    range: 2,
    upgradeCost: 40,
  },
  bomb: {
    color: 'pink',
    cost: 100,
    damage: 50,
    fireRate: 2000,
    range: 2,
    upgradeCost: 80,
  },
  slow: {
    color: 'purple',
    cost: 75,
    damage: 10,
    fireRate: 1000,
    range: 2.5,
    upgradeCost: 60,
  },
  sniper: {
    color: 'green',
    cost: 150,
    damage: 100,
    fireRate: 3000,
    range: 5,
    upgradeCost: 120,
  },
} as const;

export const ENEMY_STATS = {
  basic: {
    color: 'var(--enemy-basic-color)',
    health: 100,
    reward: 10,
    size: 0.5,
    speed: 0.1,
  },
  boss: {
    color: 'var(--enemy-boss-color)',
    health: 800,
    reward: 100,
    size: 0.8,
    speed: 0.04,
  },
  fast: {
    color: 'var(--enemy-fast-color)',
    health: 50,
    reward: 15,
    size: 0.4,
    speed: 0.18,
  },
  tank: {
    color: 'var(--enemy-tank-color)',
    health: 300,
    reward: 30,
    size: 0.65,
    speed: 0.06,
  },
} as const;

export const ADJACENT_TOWER_BONUS = 0.15; // 15% damage boost per adjacent tower
export const COMBO_WINDOW = 2000; // Time in ms to keep combo alive
export const WAVE_COMPLETION_BONUS = 50; // Bonus money per wave completed

// Energy system constants
export const BASE_ENERGY_MAX = 5; // Starting max energy
export const BASE_ENERGY_RECOVERY_RATE = 1; // Energy per hour (base)
export const ENERGY_COST_PER_MAP = 1; // Energy required to play a map
export const ENERGY_REWARD_ON_WIN = 1; // Energy given for beating a level
export const ENERGY_PURCHASE_COST = 50; // Gold cost to buy 1 energy
export const ENERGY_PURCHASE_AMOUNT = 1; // Energy gained per purchase
