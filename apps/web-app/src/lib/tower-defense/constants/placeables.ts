import type {
  PlaceableItem,
  PlayerProgress,
  PowerupType,
  TrapType,
} from '../game-types';
import { UPGRADES } from './upgrades';

export interface TrapBehavior {
  blocksPath: boolean;
  damageOnEntry: boolean;
  damageOnStay: boolean; // For future use
  persistent: boolean; // Doesn't get removed after use
  singleCell: boolean; // Single cell vs multi-cell
  placementPattern?: 'single' | 'line' | 'area'; // For multi-cell traps
}

export interface PowerupBehavior {
  effectType: 'damage' | 'fireRate' | 'range' | 'reward'; // Type of boost
  lifetimeBased: boolean; // Uses remainingWaves
  towerBound: boolean; // Can be bound to towers
}

export interface TrapConfig {
  name: string;
  behavior: TrapBehavior;
  baseDamage: number;
  upgradeDamageId: string; // Upgrade ID for damage
  upgradeFrequencyId: string; // Upgrade ID for frequency
  getDamage: (progress: PlayerProgress) => number;
  getFrequency: (progress: PlayerProgress) => number;
}

export interface PowerupConfig {
  name: string;
  behavior: PowerupBehavior;
  baseBoost: number;
  baseLifetime: number;
  upgradePotencyId: string;
  upgradeFrequencyId: string;
  upgradePersistenceId: string;
  getBoost: (progress: PlayerProgress) => number;
  getFrequency: (progress: PlayerProgress) => number;
  getLifetime: (progress: PlayerProgress) => number;
}

export const TRAP_CONFIGS: Record<TrapType, TrapConfig> = {
  gridBug: {
    baseDamage: 50,
    behavior: {
      blocksPath: false,
      damageOnEntry: true,
      damageOnStay: false,
      persistent: true, // Stays after damaging
      placementPattern: 'single',
      singleCell: true,
    },
    getDamage: (progress) => {
      const level = progress.upgrades.gridBugDamage ?? 0;
      return UPGRADES.gridBugDamage?.effects[level] ?? 50;
    },
    getFrequency: (progress) => {
      const level = progress.upgrades.gridBugFrequency ?? 0;
      return UPGRADES.gridBugFrequency?.effects[level] ?? 1;
    },
    name: 'Grid Bug',
    upgradeDamageId: 'gridBugDamage',
    upgradeFrequencyId: 'gridBugFrequency',
  },
  landmine: {
    baseDamage: 100,
    behavior: {
      blocksPath: false,
      damageOnEntry: true,
      damageOnStay: false,
      persistent: false, // Removed after use
      placementPattern: 'single',
      singleCell: true,
    },
    getDamage: (progress) => {
      const level = progress.upgrades.landmineDamage ?? 0;
      return UPGRADES.landmineDamage?.effects[level] ?? 100;
    },
    getFrequency: (progress) => {
      const level = progress.upgrades.landmineFrequency ?? 0;
      return UPGRADES.landmineFrequency?.effects[level] ?? 1;
    },
    name: 'Landmine',
    upgradeDamageId: 'landmineDamage',
    upgradeFrequencyId: 'landmineFrequency',
  },
  stream: {
    baseDamage: 0, // Doesn't damage, just blocks
    behavior: {
      blocksPath: true,
      damageOnEntry: false,
      damageOnStay: false,
      persistent: true,
      placementPattern: 'line',
      singleCell: false, // Multi-cell
    },
    getDamage: () => 0,
    getFrequency: (progress) => {
      const level = progress.upgrades.streamFrequency ?? 0;
      return UPGRADES.streamFrequency?.effects[level] ?? 1;
    },
    name: 'Stream',
    upgradeDamageId: 'streamLength', // Actually controls length
    upgradeFrequencyId: 'streamFrequency',
  },
};

export const POWERUP_CONFIGS: Record<PowerupType, PowerupConfig> = {
  powerNode: {
    baseBoost: 1.5,
    baseLifetime: 3,
    behavior: {
      effectType: 'damage',
      lifetimeBased: true,
      towerBound: true,
    },
    getBoost: (progress) => {
      const level = progress.upgrades.powerNodePotency ?? 0;
      return UPGRADES.powerNodePotency?.effects[level] ?? 1.5;
    },
    getFrequency: (progress) => {
      const level = progress.upgrades.powerNodeFrequency ?? 0;
      return UPGRADES.powerNodeFrequency?.effects[level] ?? 1;
    },
    getLifetime: (progress) => {
      const level = progress.upgrades.powerNodePersistence ?? 0;
      return UPGRADES.powerNodePersistence?.effects[level] ?? 3;
    },
    name: 'Power Node',
    upgradeFrequencyId: 'powerNodeFrequency',
    upgradePersistenceId: 'powerNodePersistence',
    upgradePotencyId: 'powerNodePotency',
  },
};

// Helper functions to get configs
export function getTrapConfig(type: TrapType): TrapConfig {
  return TRAP_CONFIGS[type];
}

export function getPowerupConfig(type: PowerupType): PowerupConfig {
  return POWERUP_CONFIGS[type];
}

export function getPlaceableConfig(
  item: PlaceableItem,
): TrapConfig | PowerupConfig {
  if (item.category === 'trap') {
    return getTrapConfig(item.type as TrapType);
  }
  return getPowerupConfig(item.type as PowerupType);
}

// Helper to check if item blocks path
export function itemBlocksPath(item: PlaceableItem): boolean {
  if (item.category === 'trap') {
    return getTrapConfig(item.type as TrapType).behavior.blocksPath;
  }
  return false; // Powerups don't block paths
}

// Helper to get all positions blocked by placeables
export function getBlockedPositionsFromPlaceables(
  items: PlaceableItem[],
): Array<{ x: number; y: number }> {
  const blocked: Array<{ x: number; y: number }> = [];
  for (const item of items) {
    if (itemBlocksPath(item)) {
      blocked.push(...item.positions);
    }
  }
  return blocked;
}
