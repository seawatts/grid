import type { RunUpgrade, UpgradeConfig } from '../game-types';

export const UPGRADES: Record<string, UpgradeConfig> = {
  energyRecoveryRate: {
    costs: [5, 10, 15, 20],
    description: 'Increases energy recovery rate per minute.',
    effects: [1, 1.5, 2, 2.5, 3], // Base, Lvl 1, Lvl 2, Lvl 3, Lvl 4 (energy per minute)
    id: 'energyRecoveryRate',
    maxLevel: 4,
    name: 'Energy Recovery Rate',
  },
  gridBugDamage: {
    costs: [2, 4, 8],
    description: 'Increases the damage dealt by Glitches.',
    effects: [50, 75, 100, 150], // Base, Lvl 1, Lvl 2, Lvl 3
    id: 'gridBugDamage',
    maxLevel: 3,
    name: 'Glitch Damage',
  },
  gridBugFrequency: {
    costs: [2, 4, 8],
    description: 'Increases the number of Glitches that appear.',
    effects: [1, 1.5, 2, 3], // Base, Lvl 1, Lvl 2, Lvl 3
    id: 'gridBugFrequency',
    maxLevel: 3,
    name: 'Glitch Frequency',
  },
  landmineDamage: {
    costs: [2, 4, 8],
    description: 'Increases the damage dealt by Traps.',
    effects: [100, 150, 225, 350], // Base, Lvl 1, Lvl 2, Lvl 3
    id: 'landmineDamage',
    maxLevel: 3,
    name: 'Trap Damage',
  },
  landmineFrequency: {
    costs: [2, 4, 8],
    description: 'Increases the number of Traps that appear.',
    effects: [1, 1.5, 2, 3], // Base, Lvl 1, Lvl 2, Lvl 3
    id: 'landmineFrequency',
    maxLevel: 3,
    name: 'Trap Frequency',
  },
  maxEnergy: {
    costs: [10, 20, 30],
    description: 'Increases maximum energy capacity.',
    effects: [5, 7, 10, 15], // Base, Lvl 1, Lvl 2, Lvl 3 (max energy)
    id: 'maxEnergy',
    maxLevel: 3,
    name: 'Max Energy',
  },
  powerNodeFrequency: {
    costs: [2, 4, 8],
    description: 'Increases the number of Nodes that appear.',
    effects: [1, 1.5, 2, 3], // Base, Lvl 1, Lvl 2, Lvl 3
    id: 'powerNodeFrequency',
    maxLevel: 3,
    name: 'Node Frequency',
  },
  powerNodePersistence: {
    costs: [3, 6, 9, 12],
    description: 'Extends how many waves Nodes persist without towers.',
    effects: [3, 4, 5, 6, 7], // Base + four upgrade levels
    id: 'powerNodePersistence',
    maxLevel: 4,
    name: 'Node Persistence',
  },
  powerNodePotency: {
    costs: [2, 4, 8],
    description: 'Increases the damage boost provided by Nodes.',
    effects: [1.5, 1.75, 2.0, 2.5], // Base, Lvl 1, Lvl 2, Lvl 3
    id: 'powerNodePotency',
    maxLevel: 3,
    name: 'Node Potency',
  },
  streamFrequency: {
    costs: [2, 4, 8],
    description: 'Increases the number of Stream traps that appear.',
    effects: [1, 1.5, 2, 2.5], // Base, Lvl 1, Lvl 2, Lvl 3
    id: 'streamFrequency',
    maxLevel: 3,
    name: 'Stream Frequency',
  },
  streamLength: {
    costs: [3, 6, 9],
    description: 'Increases the length of Stream traps.',
    effects: [3, 4, 5, 6], // Base, Lvl 1, Lvl 2, Lvl 3
    id: 'streamLength',
    maxLevel: 3,
    name: 'Stream Length',
  },
} as const;

export const RUN_UPGRADES: RunUpgrade[] = [
  {
    description: 'Start the mission with +100 Credits.',
    effect: { type: 'startMoney', value: 100 },
    icon: 'money',
    id: 'wealth',
    name: 'Init',
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
    name: 'Overclock',
  },
  {
    description: 'All towers fire 15% faster.',
    effect: { type: 'fireRateMult', value: 0.15 },
    icon: 'speed',
    id: 'speed',
    name: 'Turbo',
  },
  {
    description: 'Enemies drop 20% more credits.',
    effect: { type: 'rewardMult', value: 0.2 },
    icon: 'reward',
    id: 'reward',
    name: 'Hash',
  },
] as const;
