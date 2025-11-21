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
  type: TowerType;
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

export type PowerUp = {
  id: number;
  position: Position;
  boost: number; // Damage multiplier (e.g., 1.5 or 2.0)
};

export type Landmine = {
  id: number;
  position: Position;
  damage: number;
};

export type UpgradeType =
  | 'powerNodePotency'
  | 'powerNodeFrequency'
  | 'landmineDamage'
  | 'landmineFrequency';

export type UpgradeLevel = 0 | 1 | 2 | 3;

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

export type PlayerProgress = {
  techPoints: number;
  upgrades: Record<UpgradeType, UpgradeLevel>;
};
