export const GRID_SIZE = 12;
export const START_MONEY = 200;
export const START_LIVES = 10;
export const MAX_WAVES = 20;

export const TOWER_STATS = {
  basic: { color: 'cyan', cost: 50, damage: 20, fireRate: 500, range: 2 },
  bomb: { color: 'pink', cost: 100, damage: 50, fireRate: 2000, range: 2 },
  slow: { color: 'purple', cost: 75, damage: 10, fireRate: 1000, range: 2.5 },
  sniper: { color: 'green', cost: 150, damage: 100, fireRate: 3000, range: 5 },
} as const;

export const ENEMY_STATS = {
  basic: {
    color: 'rgb(251, 146, 60)', // orange
    health: 100,
    reward: 10,
    size: 0.5,
    speed: 0.1,
  },
  boss: {
    color: 'rgb(168, 85, 247)', // purple
    health: 800,
    reward: 100,
    size: 0.8,
    speed: 0.04,
  },
  fast: {
    color: 'rgb(34, 197, 94)', // green
    health: 50,
    reward: 15,
    size: 0.4,
    speed: 0.18,
  },
  tank: {
    color: 'rgb(239, 68, 68)', // red
    health: 300,
    reward: 30,
    size: 0.65,
    speed: 0.06,
  },
  // Additional enemy types can be added here
} as const;

export const ADJACENT_TOWER_BONUS = 0.15; // 15% damage boost per adjacent tower

export const WAVE_COMPLETION_BONUS = 50; // Bonus money per wave completed
export const POWERUP_BOOST = 1.5; // 50% damage boost for towers on powerups (legacy constant, now in placeables config)
// Note: Item-specific constants (damage, frequency) are now in constants/placeables.ts

export const COMBO_WINDOW = 2000; // Time in ms to keep combo alive

export { RUN_UPGRADES, UPGRADES } from './constants/upgrades';

// Other constants or configurations can be added here
