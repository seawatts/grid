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
    const { grid, progress, gridWidth, gridHeight } = state;

    // Keep existing placeables if not clearing
    const existingPlaceables = clearExisting
      ? []
      : state.placeables.filter((item) => {
          if (item.category === 'trap') {
            const config = TRAP_CONFIGS[item.type as TrapType];
            return config.behavior.persistent;
          }
          // Preserve powerups that haven't expired (remainingWaves > 0 or isTowerBound)
          if (item.category === 'powerup') {
            return item.isTowerBound || (item.remainingWaves ?? 0) > 0;
          }
          return false;
        });

    // Find empty cells
    const emptyCells: Position[] = [];
    for (let y = 0; y < gridHeight; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = 0; x < gridWidth; x++) {
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

        // Select rarity and apply multiplier to boost
        const rarity = config.getRarity();
        const boost = config.getBoost(progress, rarity);
        newPlaceables.push({
          boost,
          category: 'powerup',
          id: placeableIdCounter++,
          isTowerBound: false,
          positions: [pos],
          rarity,
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
   * Generate items for a new wave (legacy method - DEPRECATED, use generatePlaceables instead)
   * Kept only for test compatibility
   * @deprecated Use generatePlaceables instead
   * @param state - Current game state
   * @param count - Multiplier for item count
   * @param clearExisting - If true, clears existing items before generating new ones
   */
  generateWaveItems(
    state: GameState,
    count = 1,
    clearExisting = false,
  ): SystemUpdateResult {
    const { grid, progress, placeables } = state;
    const powerupLifetime = getPowerupLifetime(state.progress);

    // Convert placeables back to legacy format for backward compatibility with tests
    const powerups: PowerUp[] = clearExisting
      ? []
      : (placeables ?? [])
          .filter((p) => p.category === 'powerup')
          .map((p) => {
            if (p.category === 'powerup') {
              return {
                boost: p.boost,
                id: p.id,
                isTowerBound: p.isTowerBound,
                position: p.positions[0] ?? { x: 0, y: 0 },
                remainingWaves: p.remainingWaves,
              };
            }
            return null;
          })
          .filter((p): p is PowerUp => p !== null)
          .map((powerup) => ensurePowerupFields(powerup, powerupLifetime));

    const landmines: Landmine[] = clearExisting
      ? []
      : (placeables ?? [])
          .filter((p) => p.category === 'trap' && p.type === 'landmine')
          .map((p) => {
            if (p.category === 'trap') {
              return {
                damage: p.damage,
                id: p.id,
                position: p.positions[0] ?? { x: 0, y: 0 },
              };
            }
            return null;
          })
          .filter((l): l is Landmine => l !== null);
    const { gridWidth, gridHeight } = state;

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
    for (let y = 0; y < gridHeight; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = 0; x < gridWidth; x++) {
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
        id: state.placeableIdCounter + i,
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
        id: state.placeableIdCounter + powerupCount + i,
        position: pos,
      });
    }

    // Convert legacy powerups and landmines to placeables for backward compatibility
    const convertedPlaceables: PlaceableItem[] = [];
    let placeableIdCounter = state.placeableIdCounter;

    // Convert powerups
    for (const powerup of [...powerups, ...newPowerups]) {
      convertedPlaceables.push({
        boost: powerup.boost,
        category: 'powerup',
        id: placeableIdCounter++,
        isTowerBound: powerup.isTowerBound,
        positions: [{ x: powerup.position.x, y: powerup.position.y }],
        rarity: 'common',
        remainingWaves: powerup.remainingWaves,
        type: 'powerNode',
      });
    }

    // Convert landmines
    for (const landmine of [...landmines, ...newLandmines]) {
      convertedPlaceables.push({
        category: 'trap',
        damage: landmine.damage,
        id: placeableIdCounter++,
        positions: [{ x: landmine.position.x, y: landmine.position.y }],
        type: 'landmine',
      });
    }

    return {
      placeableIdCounter,
      placeables: convertedPlaceables,
    };
  }
}
