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
export const POWERUP_BOOST = 1.5; // 50% damage boost for towers on powerups
export const LANDMINE_DAMAGE = 100; // Damage dealt by landmines
export const POWERUPS_PER_WAVE = 3; // Number of powerups to spawn per wave
export const LANDMINES_PER_WAVE = 4; // Number of landmines to spawn per wave

export const COMBO_WINDOW = 2000; // Time in ms to keep combo alive

export const UPGRADES = {
  landmineDamage: {
    costs: [2, 4, 8],
    description: 'Increases the damage dealt by landmines.',
    effects: [100, 150, 225, 350], // Base, Lvl 1, Lvl 2, Lvl 3
    id: 'landmineDamage',
    maxLevel: 3,
    name: 'Landmine Damage',
  },
  landmineFrequency: {
    costs: [2, 4, 8],
    description: 'Increases the number of landmines that appear.',
    effects: [1, 1.5, 2, 3], // Base, Lvl 1, Lvl 2, Lvl 3
    id: 'landmineFrequency',
    maxLevel: 3,
    name: 'Landmine Frequency',
  },
  powerNodeFrequency: {
    costs: [2, 4, 8],
    description: 'Increases the number of power nodes that appear.',
    effects: [1, 1.5, 2, 3], // Base, Lvl 1, Lvl 2, Lvl 3
    id: 'powerNodeFrequency',
    maxLevel: 3,
    name: 'Power Node Frequency',
  },
  powerNodePotency: {
    costs: [2, 4, 8],
    description: 'Increases the damage boost provided by power nodes.',
    effects: [1.5, 1.75, 2.0, 2.5], // Base, Lvl 1, Lvl 2, Lvl 3
    id: 'powerNodePotency',
    maxLevel: 3,
    name: 'Power Node Potency',
  },
} as const;

export const RUN_UPGRADES = [
  {
    description: 'Start the mission with +100 Credits.',
    effect: { type: 'startMoney', value: 100 },
    icon: 'money',
    id: 'wealth',
    name: 'Initial Funding',
  },
  {
    description: 'Start the mission with +10 Lives.',
    effect: { type: 'startLives', value: 10 },
    icon: 'health',
    id: 'health',
    name: 'Reinforced Core',
  },
  {
    description: 'All towers deal 15% more damage.',
    effect: { type: 'damageMult', value: 0.15 },
    icon: 'damage',
    id: 'power',
    name: 'Overcharged Systems',
  },
  {
    description: 'All towers fire 15% faster.',
    effect: { type: 'fireRateMult', value: 0.15 },
    icon: 'speed',
    id: 'speed',
    name: 'Rapid Response',
  },
  {
    description: 'Enemies drop 20% more credits.',
    effect: { type: 'rewardMult', value: 0.2 },
    icon: 'reward',
    id: 'reward',
    name: 'Bounty Hunter',
  },
] as const;

// Other constants or configurations can be added here
