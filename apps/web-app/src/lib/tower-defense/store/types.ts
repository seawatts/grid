import type {
  DamageNumber,
  Enemy,
  Particle,
  PlaceableItem,
  PlayerProgress,
  Position,
  Projectile,
  RunUpgrade,
  Tower,
  TowerType,
  WavePowerUp,
} from '../game-types';

export interface GameState {
  // Core game state
  grid: string[][];
  gridWidth: number; // Number of columns
  gridHeight: number; // Number of rows
  towers: Tower[];
  spawnedEnemies: Enemy[];
  unspawnedEnemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  damageNumbers: DamageNumber[];
  // Unified placeable system
  placeables: PlaceableItem[];

  // Game stats
  money: number;
  lives: number;
  score: number;
  combo: number;
  wave: number;
  maxWaves: number;

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
  activeWavePowerUps: WavePowerUp[];
  pendingPowerUpSelection: boolean;

  // UI state
  selectedTowerType: TowerType | null;
  selectedTower: Tower | null;
  selectedItem: PlaceableItem | null;

  // UI display state
  cellSize: number;
  isMobile: boolean;
  showSettings: boolean;
  showUI: boolean;
  showActivePowerUps: boolean;
  showWaveInfo: boolean;
  wasPausedBeforeWaveInfo: boolean;
  debugPaths: Position[][];
  animatedPathLengths: number[];
  availablePowerUps: WavePowerUp[];

  // Settings
  autoAdvance: boolean;
  showGrid: boolean;
  showPerformanceMonitor: boolean;
  showDamageNumbers: boolean;

  // Counters
  towerIdCounter: number;
  enemyIdCounter: number;
  projectileIdCounter: number;
  particleIdCounter: number;
  damageNumberIdCounter: number;
  placeableIdCounter: number;

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
  placeables?: PlaceableItem[];
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
  enemyIdCounter?: number;
  placeableIdCounter?: number;
}

export interface GameSystem {
  update(
    state: GameState,
    deltaTime: number,
    timestamp: number,
  ): SystemUpdateResult;
}
