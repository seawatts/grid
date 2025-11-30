export const GRID_SIZE = 12; // Legacy constant - kept for backward compatibility
export const START_MONEY = 200;

/**
 * Calculates optimal grid dimensions (columns x rows) based on available screen space
 * Prioritizes height to maximize vertical space and make cells larger
 * @param availableWidth Available width in pixels
 * @param availableHeight Available height in pixels
 * @returns Object with columns and rows for the grid
 */
export function calculateOptimalGridDimensions(
  availableWidth: number,
  availableHeight: number,
): { columns: number; rows: number } {
  // Detect if this is a mobile device based on screen width
  const isMobile = availableWidth < 640;

  // Force minimum even if it means smaller grid
  const FORCE_MIN_CELL = isMobile ? 55 : 30;

  // Allow smaller grids on mobile to maximize cell size
  // Try different configurations: 8x10, 9x12, 10x12, 10x14, 12x12, 12x14
  const GRID_CONFIGS = isMobile
    ? [
        { columns: 8, rows: 10 },
        { columns: 9, rows: 12 },
        { columns: 10, rows: 12 },
        { columns: 10, rows: 14 },
        { columns: 12, rows: 12 },
        { columns: 12, rows: 14 },
      ]
    : [
        { columns: 10, rows: 12 },
        { columns: 12, rows: 12 },
        { columns: 12, rows: 14 },
        { columns: 12, rows: 16 },
        { columns: 14, rows: 14 },
      ];

  let bestCellSize = 0;
  let bestConfig = GRID_CONFIGS.at(-1); // Default to largest
  if (!bestConfig) {
    throw new Error('GRID_CONFIGS must not be empty');
  }

  // Try each configuration and pick the one that maximizes cell size
  for (const config of GRID_CONFIGS) {
    const cellSizeFromWidth = availableWidth / config.columns;
    const cellSizeFromHeight = availableHeight / config.rows;
    const cellSize = Math.min(cellSizeFromWidth, cellSizeFromHeight);

    // Prefer configurations that:
    // 1. Give us larger cells
    // 2. Meet our minimum cell size requirement
    // 3. Prefer taller grids on mobile (more rows) to fill vertical space
    const meetsMinimum = cellSize >= FORCE_MIN_CELL;
    const isLarger = cellSize > bestCellSize;
    const isTaller =
      isMobile &&
      config.rows > bestConfig.rows &&
      cellSize >= bestCellSize * 0.95;

    if (meetsMinimum && (isLarger || isTaller)) {
      bestCellSize = cellSize;
      bestConfig = config;
    }
  }

  // If we still don't meet minimum, use the config that gives largest cells
  if (bestCellSize < FORCE_MIN_CELL) {
    bestCellSize = 0;
    for (const config of GRID_CONFIGS) {
      const cellSizeFromWidth = availableWidth / config.columns;
      const cellSizeFromHeight = availableHeight / config.rows;
      const cellSize = Math.min(cellSizeFromWidth, cellSizeFromHeight);

      if (cellSize > bestCellSize) {
        bestCellSize = cellSize;
        bestConfig = config;
      }
    }
  }

  return {
    columns: bestConfig.columns,
    rows: bestConfig.rows,
  };
}
export const START_LIVES = 10;
export const MAX_WAVES = 50;

export const TOWER_STATS = {
  basic: {
    color: 'cyan',
    cost: 50,
    damage: 20,
    fireRate: 500,
    penetration: 0,
    range: 2,
    upgradeCost: 40,
  },
  bomb: {
    color: 'pink',
    cost: 100,
    damage: 50,
    fireRate: 2000,
    penetration: 0,
    range: 2,
    upgradeCost: 80,
  },
  slow: {
    color: 'purple',
    cost: 75,
    damage: 10,
    fireRate: 1000,
    penetration: 0,
    range: 2.5,
    upgradeCost: 60,
  },
  sniper: {
    color: 'green',
    cost: 150,
    damage: 100,
    fireRate: 3000,
    penetration: 1,
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
export const BASE_ENERGY_RECOVERY_RATE = 1; // Energy per minute (base)
export const ENERGY_COST_PER_MAP = 1; // Energy required to play a map
export const ENERGY_REWARD_ON_WIN = 1; // Energy given for beating a level
export const ENERGY_PURCHASE_COST = 50; // Gold cost to buy 1 energy
export const ENERGY_PURCHASE_AMOUNT = 1; // Energy gained per purchase
