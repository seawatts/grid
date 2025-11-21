import type {
  DamageNumber,
  Enemy,
  Landmine,
  Particle,
  PlayerProgress,
  Position,
  PowerUp,
  Projectile,
  RunUpgrade,
  Tower,
  TowerType,
} from '../game-types';

export interface GameState {
  // Core game state
  grid: string[][];
  towers: Tower[];
  spawnedEnemies: Enemy[];
  unspawnedEnemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  damageNumbers: DamageNumber[];
  powerups: PowerUp[];
  landmines: Landmine[];

  // Game stats
  money: number;
  lives: number;
  score: number;
  combo: number;
  wave: number;

  // Game status
  isWaveActive: boolean;
  gameStatus: 'playing' | 'won' | 'lost';
  isPaused: boolean;
  gameSpeed: 1 | 2 | 4;

  // Map info
  startPositions: Position[];
  goalPositions: Position[];
  obstacles: Position[];

  // Upgrades and bonuses
  progress: PlayerProgress;
  runUpgrade?: RunUpgrade;

  // UI state
  selectedTowerType: TowerType | null;
  selectedTower: Tower | null;
  selectedItem: PowerUp | Landmine | null;

  // Settings
  autoAdvance: boolean;
  showGrid: boolean;
  showPerformanceMonitor: boolean;

  // Counters
  towerIdCounter: number;
  enemyIdCounter: number;
  projectileIdCounter: number;
  particleIdCounter: number;
  damageNumberIdCounter: number;
  powerupIdCounter: number;
  landmineIdCounter: number;

  // Timing
  lastKillTime: number;
}

export interface GameConfig {
  mapId: string;
  runUpgrade?: RunUpgrade;
  progress?: PlayerProgress;
}

export interface SystemUpdateResult {
  spawnedEnemies?: Enemy[];
  unspawnedEnemies?: Enemy[];
  towers?: Tower[];
  projectiles?: Projectile[];
  particles?: Particle[];
  damageNumbers?: DamageNumber[];
  powerups?: PowerUp[];
  landmines?: Landmine[];
  money?: number;
  lives?: number;
  score?: number;
  combo?: number;
  wave?: number;
  isWaveActive?: boolean;
  gameStatus?: 'playing' | 'won' | 'lost';
  lastKillTime?: number;
  projectileIdCounter?: number;
  particleIdCounter?: number;
  damageNumberIdCounter?: number;
}

export interface GameSystem {
  update(
    state: GameState,
    deltaTime: number,
    timestamp: number,
  ): SystemUpdateResult;
}
