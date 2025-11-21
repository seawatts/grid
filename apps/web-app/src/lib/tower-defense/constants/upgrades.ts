import type { RunUpgrade, UpgradeConfig } from '../game-types';

export const UPGRADES: Record<string, UpgradeConfig> = {
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

export const RUN_UPGRADES: RunUpgrade[] = [
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
