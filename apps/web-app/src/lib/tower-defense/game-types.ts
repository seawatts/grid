export type Position = { x: number; y: number };
export type TowerType = 'basic' | 'slow' | 'bomb' | 'sniper';
export type EnemyType = 'basic' | 'fast' | 'tank' | 'boss';

export type Tower = {
  id: number;
  position: Position;
  type: TowerType;
  level: number;
  lastShot: number;
};

export type Enemy = {
  id: number;
  position: Position;
  path: Position[];
  pathIndex: number;
  health: number;
  maxHealth: number;
  speed: number;
  slowed: boolean;
  spawnTime: number;
  type: EnemyType;
  reward: number;
};

export type Projectile = {
  id: number;
  position: Position;
  sourcePosition: Position;
  target: Position;
  targetEnemyId?: number;
  type: TowerType;
  penetrationRemaining: number;
  direction: { x: number; y: number };
  hitEnemyIds: Set<number>;
};

export type Particle = {
  id: number;
  position: Position;
  velocity: { x: number; y: number };
  color: string;
  life: number;
  maxLife: number;
};

export type DamageNumber = {
  id: number;
  position: Position;
  value: number;
  life: number;
  color: string;
};

// Legacy types - DEPRECATED: Use PlaceableItem instead
// These types are kept only for migration purposes and will be removed in a future version
/**
 * @deprecated Use PlaceableItem with category 'powerup' instead
 */
export type PowerUp = {
  id: number;
  position: Position;
  boost: number; // Damage multiplier (e.g., 1.5 or 2.0)
  remainingWaves: number;
  isTowerBound: boolean;
};

/**
 * @deprecated Use PlaceableItem with category 'trap' and type 'landmine' instead
 */
export type Landmine = {
  id: number;
  position: Position;
  damage: number;
};

// Unified Placeable Item System
export type ItemCategory = 'trap' | 'powerup';
export type TrapType = 'landmine' | 'gridBug' | 'stream';
export type PowerupType = 'powerNode';

// Base placeable item type
export type PlaceableItem = {
  id: number;
  category: ItemCategory;
  type: TrapType | PowerupType;
  positions: Position[]; // Multi-cell support
} & (
  | {
      category: 'trap';
      type: TrapType;
      damage: number;
    }
  | {
      category: 'powerup';
      type: PowerupType;
      boost: number; // Damage multiplier
      remainingWaves: number;
      isTowerBound: boolean;
      rarity: PowerupRarity;
    }
);

// Type guards
export function isTrapItem(
  item: PlaceableItem,
): item is PlaceableItem & { category: 'trap' } {
  return item.category === 'trap';
}

export function isPowerupItem(
  item: PlaceableItem,
): item is PlaceableItem & { category: 'powerup' } {
  return item.category === 'powerup';
}

export type UpgradeType =
  | 'powerNodePotency'
  | 'powerNodeFrequency'
  | 'powerNodePersistence'
  | 'landmineDamage'
  | 'landmineFrequency'
  | 'gridBugDamage'
  | 'gridBugFrequency'
  | 'streamLength'
  | 'streamFrequency'
  | 'energyRecoveryRate'
  | 'maxEnergy';

export type UpgradeLevel = 0 | 1 | 2 | 3 | 4;

export type UpgradeConfig = {
  id: UpgradeType;
  name: string;
  description: string;
  maxLevel: number;
  costs: number[]; // Cost for level 1, 2, 3...
  effects: number[]; // Value for level 0, 1, 2, 3...
};

export type RunUpgrade = {
  id: string;
  name: string;
  description: string;
  icon: 'money' | 'health' | 'damage' | 'speed' | 'reward';
  effect: {
    type:
      | 'startMoney'
      | 'startLives'
      | 'damageMult'
      | 'fireRateMult'
      | 'rewardMult';
    value: number;
  };
};

export type WavePowerUpEffectType =
  | 'damageMult'
  | 'fireRateMult'
  | 'rewardMult'
  | 'addMoney'
  | 'addLives'
  | 'towerRangeMult'
  | 'towerRangeAdd'
  | 'penetrationAdd'
  | 'penetrationMult';

export type WavePowerUpDuration = number | 'permanent'; // number = waves remaining, 'permanent' = rest of run
export type WavePowerUpStacking = 'additive' | 'multiplicative' | 'replace';

export type PowerupRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type WavePowerUp = {
  id: string;
  name: string;
  description: string;
  icon: 'money' | 'health' | 'damage' | 'speed' | 'reward' | 'range';
  effect: {
    type: WavePowerUpEffectType;
    value: number;
  };
  duration: WavePowerUpDuration;
  stacking: WavePowerUpStacking;
  wavesRemaining?: number; // Track remaining waves for non-permanent power-ups
  rarity?: PowerupRarity; // Optional for backward compatibility, defaults to 'common'
};

export type MapRating = 0 | 1 | 2 | 3;

export type PlayerProgress = {
  techPoints: number;
  upgrades: Record<UpgradeType, UpgradeLevel>;
  mapRatings: Record<string, MapRating>;
  energy: number;
  maxEnergy: number;
  lastEnergyUpdate: number;
  energyRecoveryRate: number;
};
