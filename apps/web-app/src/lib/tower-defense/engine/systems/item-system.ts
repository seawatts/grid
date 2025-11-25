import { UPGRADES } from '../../constants/upgrades';
import type { Landmine, Position, PowerUp } from '../../game-types';
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
   * Generate items for a new wave
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
