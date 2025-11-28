import {
  POWERUP_CONFIGS,
  type PowerupConfig,
  TRAP_CONFIGS,
  type TrapConfig,
} from '../../constants/placeables';
import { UPGRADES } from '../../constants/upgrades';
import type {
  Landmine,
  PlaceableItem,
  Position,
  PowerUp,
  PowerupType,
  TrapType,
} from '../../game-types';
import type {
  GameState,
  GameSystem,
  SystemUpdateResult,
} from '../../store/types';
import { ensurePowerupFields, getPowerupLifetime } from '../../utils/powerups';

export class ItemSystem implements GameSystem {
  update(
    _state: GameState,
    _deltaTime: number,
    _timestamp: number,
  ): SystemUpdateResult {
    // Items are mostly static, no per-frame updates needed
    return {};
  }

  /**
   * Generate placeables for a new wave using unified system
   * @param state - Current game state
   * @param count - Multiplier for item count
   * @param clearExisting - If true, clears existing items before generating new ones
   */
  generatePlaceables(
    state: GameState,
    count = 1,
    clearExisting = false,
  ): SystemUpdateResult {
    const { grid, progress } = state;
    const gridSize = grid.length;

    // Keep persistent placeables if not clearing
    const existingPlaceables = clearExisting
      ? []
      : state.placeables.filter((item) => {
          if (item.category === 'trap') {
            const config = TRAP_CONFIGS[item.type as TrapType];
            return config.behavior.persistent;
          }
          // Powerups are handled separately with lifetime
          return false;
        });

    // Find empty cells
    const emptyCells: Position[] = [];
    for (let y = 0; y < gridSize; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = 0; x < gridSize; x++) {
        if (row[x] === 'empty') {
          // Check if occupied by existing placeables
          const isOccupied = existingPlaceables.some((item) =>
            item.positions.some((p) => p.x === x && p.y === y),
          );

          if (!isOccupied) {
            emptyCells.push({ x, y });
          }
        }
      }
    }

    const newPlaceables: PlaceableItem[] = [];
    let placeableIdCounter = state.placeableIdCounter;

    // Generate traps
    for (const [trapType, config] of Object.entries(TRAP_CONFIGS) as [
      TrapType,
      TrapConfig,
    ][]) {
      // Skip persistent traps that already exist
      if (config.behavior.persistent && !clearExisting) {
        const existingCount = existingPlaceables.filter(
          (item) => item.category === 'trap' && item.type === trapType,
        ).length;
        if (existingCount > 0) continue;
      }

      const frequency = config.getFrequency(progress);
      const trapCount = Math.max(1, Math.floor(frequency * count));

      for (let i = 0; i < trapCount && emptyCells.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const pos = emptyCells.splice(randomIndex, 1)[0];
        if (!pos) continue;

        const damage = config.getDamage(progress);
        const positions = config.behavior.singleCell
          ? [pos]
          : this.generateMultiCellPositions(pos, config, emptyCells);

        // Remove used positions from emptyCells
        positions.forEach((p) => {
          const idx = emptyCells.findIndex(
            (cell) => cell.x === p.x && cell.y === p.y,
          );
          if (idx >= 0) emptyCells.splice(idx, 1);
        });

        newPlaceables.push({
          category: 'trap',
          damage,
          id: placeableIdCounter++,
          positions,
          type: trapType,
        });
      }
    }

    // Generate powerups
    for (const [powerupType, config] of Object.entries(POWERUP_CONFIGS) as [
      PowerupType,
      PowerupConfig,
    ][]) {
      const frequency = config.getFrequency(progress);
      const powerupCount = Math.max(1, Math.floor(frequency * count));
      const lifetime = config.getLifetime(progress);

      for (let i = 0; i < powerupCount && emptyCells.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const pos = emptyCells.splice(randomIndex, 1)[0];
        if (!pos) continue;

        const boost = config.getBoost(progress);
        newPlaceables.push({
          boost,
          category: 'powerup',
          id: placeableIdCounter++,
          isTowerBound: false,
          positions: [pos],
          remainingWaves: lifetime,
          type: powerupType,
        });
      }
    }

    return {
      placeableIdCounter,
      placeables: [...existingPlaceables, ...newPlaceables],
    };
  }

  /**
   * Generate multi-cell positions for traps like Stream
   */
  private generateMultiCellPositions(
    startPos: Position,
    config: TrapConfig,
    availableCells: Position[],
  ): Position[] {
    if (config.behavior.placementPattern === 'line') {
      // Generate a horizontal line (can be extended to vertical or other patterns)
      const positions: Position[] = [startPos];
      const length = 3; // Default length, can be configurable
      for (let i = 1; i < length; i++) {
        const nextPos = { x: startPos.x + i, y: startPos.y };
        if (
          availableCells.some(
            (cell) => cell.x === nextPos.x && cell.y === nextPos.y,
          )
        ) {
          positions.push(nextPos);
        } else {
          break; // Stop if we hit an obstacle
        }
      }
      return positions;
    }
    // Default to single cell
    return [startPos];
  }

  /**
   * Generate items for a new wave (legacy method for backward compatibility)
   * @param state - Current game state
   * @param count - Multiplier for item count
   * @param clearExisting - If true, clears existing items before generating new ones
   */
  generateWaveItems(
    state: GameState,
    count = 1,
    clearExisting = false,
  ): SystemUpdateResult {
    const { grid, progress } = state;
    const powerupLifetime = getPowerupLifetime(state.progress);
    const powerups = clearExisting
      ? []
      : state.powerups.map((powerup) =>
          ensurePowerupFields(powerup, powerupLifetime),
        );
    const landmines = clearExisting ? [] : state.landmines;
    const gridSize = grid.length;

    const powerupBoost =
      UPGRADES.powerNodePotency?.effects[progress.upgrades.powerNodePotency] ??
      0;
    const powerupFreq =
      UPGRADES.powerNodeFrequency?.effects[
        progress.upgrades.powerNodeFrequency
      ] ?? 0;
    const landmineDmg =
      UPGRADES.landmineDamage?.effects[progress.upgrades.landmineDamage] ?? 0;
    const landmineFreq =
      UPGRADES.landmineFrequency?.effects[
        progress.upgrades.landmineFrequency
      ] ?? 0;

    // Find empty cells
    const emptyCells: Position[] = [];
    for (let y = 0; y < gridSize; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = 0; x < gridSize; x++) {
        if (row[x] === 'empty') {
          // Check if occupied by existing items
          const isOccupied =
            powerups.some((p) => p.position.x === x && p.position.y === y) ||
            landmines.some((l) => l.position.x === x && l.position.y === y);

          if (!isOccupied) {
            emptyCells.push({ x, y });
          }
        }
      }
    }

    const newPowerups: PowerUp[] = [];
    const powerupCount = Math.max(1, Math.floor(powerupFreq * count));

    for (let i = 0; i < powerupCount && emptyCells.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const pos = emptyCells.splice(randomIndex, 1)[0];
      if (!pos) continue;
      newPowerups.push({
        boost: powerupBoost,
        id: state.powerupIdCounter + i,
        isTowerBound: false,
        position: pos,
        remainingWaves: powerupLifetime,
      });
    }

    const newLandmines: Landmine[] = [];
    const landmineCount = Math.max(1, Math.floor(landmineFreq * count));

    for (let i = 0; i < landmineCount && emptyCells.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const pos = emptyCells.splice(randomIndex, 1)[0];
      if (!pos) continue;
      newLandmines.push({
        damage: landmineDmg,
        id: state.landmineIdCounter + i,
        position: pos,
      });
    }

    return {
      landmineIdCounter: state.landmineIdCounter + newLandmines.length,
      landmines: [...landmines, ...newLandmines],
      powerupIdCounter: state.powerupIdCounter + newPowerups.length,
      powerups: [...powerups, ...newPowerups],
    };
  }
}
