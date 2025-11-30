import { ENEMY_STATS, TOWER_STATS } from '../../constants/balance';
import { getTrapConfig } from '../../constants/placeables';
import type {
  Enemy,
  EnemyType,
  PlaceableItem,
  Position,
  Tower,
  TrapType,
  WavePowerUp,
} from '../../game-types';
import {
  combineBlockedPositions,
  findPathsForMultipleStartsAndGoals,
} from '../../pathfinding';
import type {
  GameState,
  GameSystem,
  SystemUpdateResult,
} from '../../store/types';
import {
  calculateDamage,
  calculateFireRate,
  calculateTowerRange,
  getAdjacentTowerCount,
} from '../../utils/calculations';

export class WaveSystem implements GameSystem {
  /**
   * Check if a wave number is a boss wave (every 10th wave)
   */
  private isBossWave(wave: number): boolean {
    return wave > 0 && wave % 10 === 0;
  }

  /**
   * Calculate enemy count with tiered scaling for later waves
   */
  private calculateEnemyCount(wave: number): number {
    if (wave <= 10) {
      // Early waves: linear scaling
      return 5 + wave * 2;
    }
    if (wave <= 25) {
      // Mid waves: steeper linear scaling
      return 25 + (wave - 10) * 3;
    }
    // Late waves: even steeper scaling
    return 70 + (wave - 25) * 4;
  }

  /**
   * Calculate health multiplier based on wave number
   * Scales at 5% per wave, with additional scaling on boss waves
   */
  private calculateHealthMultiplier(wave: number, isBossWave: boolean): number {
    // Base scaling: 5% per wave (wave 1 = 1.0, wave 10 = 1.45, wave 50 = 3.45)
    const baseMultiplier = 1 + (wave - 1) * 0.05;

    // Boss waves get additional 20% per boss tier (wave 10 = +20%, wave 20 = +40%, etc.)
    const bossTierBonus = isBossWave ? Math.floor(wave / 10) * 0.2 : 0;

    return baseMultiplier + bossTierBonus;
  }

  /**
   * Calculate reward multiplier based on health scaling
   * Rewards scale proportionally to health to maintain economy balance
   */
  private calculateRewardMultiplier(healthMultiplier: number): number {
    // Rewards scale at 80% of health scaling to prevent economy inflation
    return 1 + (healthMultiplier - 1) * 0.8;
  }

  /**
   * Calculate path coverage - analyze how well towers cover the A* paths
   * Returns coverage metrics including path length, tower coverage, and path complexity
   */
  private calculatePathCoverage(
    paths: (Position[] | null)[],
    towers: Tower[],
    activeWavePowerUps: WavePowerUp[],
  ): {
    totalPathLength: number;
    averagePathLength: number;
    pathCount: number;
    coverageScore: number; // How much of paths are covered by towers
    pathDifficulty: number; // Higher = harder to defend
  } {
    const validPaths = paths.filter((p): p is Position[] => p !== null);
    if (validPaths.length === 0) {
      return {
        averagePathLength: 0,
        coverageScore: 0,
        pathCount: 0,
        pathDifficulty: 1,
        totalPathLength: 0,
      };
    }

    let totalPathLength = 0;
    let totalCoveredCells = 0;
    let totalPathCells = 0;

    // Sample path positions every N cells for performance (sample every 2 cells)
    const SAMPLE_RATE = 2;

    for (const path of validPaths) {
      const pathLength = path.length;
      totalPathLength += pathLength;

      // Sample path positions
      for (let i = 0; i < path.length; i += SAMPLE_RATE) {
        const pathPos = path[i];
        if (!pathPos) continue;

        totalPathCells++;

        // Check if any tower can hit this position
        for (const tower of towers) {
          const towerStats = TOWER_STATS[tower.type];
          const towerRange = calculateTowerRange({
            activeWavePowerUps,
            baseRange: towerStats.range,
            towerLevel: tower.level,
          });

          const distance = Math.sqrt(
            (pathPos.x - tower.position.x) ** 2 +
              (pathPos.y - tower.position.y) ** 2,
          );

          if (distance <= towerRange) {
            totalCoveredCells++;
            break; // Count each cell only once
          }
        }
      }
    }

    const averagePathLength = totalPathLength / validPaths.length;
    const coverageScore =
      totalPathCells > 0 ? totalCoveredCells / totalPathCells : 0;

    // Path difficulty: longer paths are easier (more time to kill), more paths are harder
    // Longer paths = multiply by 0.9 per extra 10 cells
    const lengthDifficulty = Math.max(0.5, 1 - (averagePathLength - 10) * 0.01);
    // More paths = multiply by 1.1 per extra path
    const pathCountDifficulty = Math.min(2, 1 + (validPaths.length - 1) * 0.1);
    const pathDifficulty = lengthDifficulty * pathCountDifficulty;

    return {
      averagePathLength,
      coverageScore,
      pathCount: validPaths.length,
      pathDifficulty,
      totalPathLength,
    };
  }

  /**
   * Calculate tower power score - evaluates how effective towers are on paths
   */
  private calculateTowerPowerScore(
    paths: (Position[] | null)[],
    towers: Tower[],
    activeWavePowerUps: WavePowerUp[],
    runUpgrade?: GameState['runUpgrade'],
    placeables?: PlaceableItem[],
  ): number {
    if (towers.length === 0) return 0;

    const validPaths = paths.filter((p): p is Position[] => p !== null);
    if (validPaths.length === 0) return 0;

    let totalPower = 0;
    const SAMPLE_RATE = 2;

    // For each tower, calculate its contribution to path coverage
    for (const tower of towers) {
      const towerStats = TOWER_STATS[tower.type];
      const towerRange = calculateTowerRange({
        activeWavePowerUps,
        baseRange: towerStats.range,
        towerLevel: tower.level,
      });

      // Find powerup on this tower's position
      const foundPowerup = placeables?.find(
        (p) =>
          p.category === 'powerup' &&
          p.positions.some(
            (pos) => pos.x === tower.position.x && pos.y === tower.position.y,
          ),
      );
      const towerPowerup =
        foundPowerup && foundPowerup.category === 'powerup'
          ? foundPowerup
          : undefined;

      // Calculate adjacent tower count
      const adjacentTowerCount = getAdjacentTowerCount(tower.position, towers);

      // Calculate damage and fire rate
      const damage = calculateDamage({
        activeWavePowerUps,
        adjacentTowerCount,
        powerup: towerPowerup,
        runUpgrade,
        tower,
      });

      const fireRate = calculateFireRate({
        activeWavePowerUps,
        gameSpeed: 1,
        runUpgrade,
        tower,
      });

      // Damage per second
      const dps = damage / (fireRate / 1000);

      // Count how many path cells this tower covers
      let coveredCells = 0;
      for (const path of validPaths) {
        for (let i = 0; i < path.length; i += SAMPLE_RATE) {
          const pathPos = path[i];
          if (!pathPos) continue;

          const distance = Math.sqrt(
            (pathPos.x - tower.position.x) ** 2 +
              (pathPos.y - tower.position.y) ** 2,
          );

          if (distance <= towerRange) {
            coveredCells++;
          }
        }
      }

      // Tower power = DPS × coverage
      totalPower += dps * coveredCells;
    }

    return totalPower;
  }

  /**
   * Calculate trap power score - evaluates trap damage potential on paths
   */
  private calculateTrapPowerScore(
    paths: (Position[] | null)[],
    placeables: PlaceableItem[],
    progress: GameState['progress'],
  ): number {
    const traps = placeables.filter((item) => item.category === 'trap');
    if (traps.length === 0) return 0;

    const validPaths = paths.filter((p): p is Position[] => p !== null);
    if (validPaths.length === 0) return 0;

    // Create a set of path positions for quick lookup
    const pathPositions = new Set<string>();
    for (const path of validPaths) {
      for (const pos of path) {
        pathPositions.add(`${Math.floor(pos.x)},${Math.floor(pos.y)}`);
      }
    }

    let totalTrapPower = 0;

    for (const trap of traps) {
      // Type guard: ensure it's a trap type
      if (trap.category !== 'trap') continue;
      const trapConfig = getTrapConfig(trap.type as TrapType);
      const damage = trapConfig.getDamage(progress);

      // Check if trap is on a path position
      let onPathCount = 0;
      for (const pos of trap.positions) {
        const key = `${Math.floor(pos.x)},${Math.floor(pos.y)}`;
        if (pathPositions.has(key)) {
          onPathCount++;
        }
      }

      if (onPathCount === 0) continue;

      // Weight by trap type: persistent traps (grid bugs) are more valuable
      const trapWeight = trapConfig.behavior.persistent ? 1.5 : 1.0;

      totalTrapPower += damage * onPathCount * trapWeight;
    }

    return totalTrapPower;
  }

  /**
   * Calculate defensive power - combines all defensive elements
   */
  private calculateDefensivePower(
    state: GameState,
    paths: (Position[] | null)[],
  ): number {
    const { activeWavePowerUps, placeables, progress, runUpgrade, towers } =
      state;

    // Calculate path coverage metrics
    const pathCoverage = this.calculatePathCoverage(
      paths,
      towers,
      activeWavePowerUps,
    );

    // Calculate tower power
    const towerPower = this.calculateTowerPowerScore(
      paths,
      towers,
      activeWavePowerUps,
      runUpgrade,
      placeables,
    );

    // Calculate trap power
    const trapPower = this.calculateTrapPowerScore(paths, placeables, progress);

    // Calculate power-up bonuses
    let powerUpPower = 0;
    for (const powerUp of activeWavePowerUps) {
      let weight = 1.0;
      if (powerUp.duration === 'permanent') {
        weight = 1.5; // Permanent power-ups weighted more
      } else if (powerUp.wavesRemaining !== undefined) {
        weight = 0.5 + (powerUp.wavesRemaining / 10) * 0.5; // Weight by remaining waves
      }

      if (powerUp.effect.type === 'damageMult') {
        powerUpPower += powerUp.effect.value * 100 * weight; // Scale to match tower power units
      } else if (powerUp.effect.type === 'fireRateMult') {
        powerUpPower += powerUp.effect.value * 50 * weight; // Fire rate is less impactful
      }
    }

    // Combine all power sources
    const totalPower = towerPower + trapPower + powerUpPower;

    // Normalize by path difficulty (harder paths need more power)
    const defensivePower =
      totalPower / Math.max(1, pathCoverage.pathDifficulty);

    return defensivePower;
  }

  /**
   * Calculate target defensive power for a given wave
   * This represents the expected defensive power a player should have
   */
  private calculateTargetPower(wave: number): number {
    // Target power scales with wave number
    // Early waves: low target (easy to exceed)
    // Mid waves: medium target (requires some optimization)
    // Late waves: high target (requires good builds)
    if (wave <= 10) {
      return 50 + wave * 10; // 60 to 150
    }
    if (wave <= 25) {
      return 150 + (wave - 10) * 20; // 150 to 450
    }
    return 450 + (wave - 25) * 30; // 450 to 1200
  }

  /**
   * Calculate adaptive multiplier based on defensive power
   * Returns a multiplier between 0.8 (easier) and 1.2 (harder)
   */
  private calculateAdaptiveMultiplier(
    defensivePower: number,
    targetPower: number,
  ): number {
    // Calculate ratio: how much power player has vs expected
    const powerRatio = defensivePower / Math.max(1, targetPower);

    // If player has more power than target, increase difficulty (maximum 1.2x)
    // If player has less power than target, reduce difficulty (minimum 0.8x)
    // Formula: 1.0 + (powerRatio - 1.0) * 0.2, clamped to [0.8, 1.2]
    const multiplier = 1.0 + (powerRatio - 1.0) * 0.2;
    return Math.max(0.8, Math.min(1.2, multiplier));
  }

  update(
    state: GameState,
    _deltaTime: number,
    _timestamp: number,
  ): SystemUpdateResult {
    const { isWaveActive, spawnedEnemies, unspawnedEnemies } = state;

    // Check if wave is complete (both spawned and unspawned must be empty)
    if (
      isWaveActive &&
      spawnedEnemies.length === 0 &&
      unspawnedEnemies.length === 0
    ) {
      return {
        isWaveActive: false,
      };
    }

    return {};
  }

  /**
   * Start a new wave - this should be called explicitly, not from the game loop
   */
  startWave(state: GameState, timestamp: number): SystemUpdateResult {
    if (state.isWaveActive || state.gameStatus !== 'playing') {
      return {};
    }

    const newWave = state.wave + 1;
    const baseEnemyCount = this.calculateEnemyCount(newWave);

    const baseBlockedPositions = [
      ...state.towers.map((t) => t.position),
      ...state.obstacles,
    ];
    const allBlockedPositions = combineBlockedPositions(
      baseBlockedPositions,
      state.placeables,
    );

    const pathsForStarts = findPathsForMultipleStartsAndGoals(
      state.startPositions,
      state.goalPositions,
      allBlockedPositions,
      state.gridWidth,
      state.gridHeight,
    );

    if (pathsForStarts.some((p) => !p)) {
      // Check if this is a map configuration issue (no user-placed items) or user-placed items
      const hasUserPlacedItems =
        state.towers.length > 0 || state.placeables.length > 0;

      if (!hasUserPlacedItems) {
        // This is a map configuration issue - obstacles from the map itself are blocking paths
        throw new Error(
          `Cannot start wave: This map configuration has blocked spawn points. The map's obstacles are preventing paths from start positions to goal positions. This appears to be a map design issue.`,
        );
      }
      // User has placed towers or items that are blocking paths
      throw new Error(
        'Cannot start wave: Some spawn points are blocked! Please remove towers or items that are blocking the path from start positions to goal positions.',
      );
    }

    const newEnemies: Enemy[] = [];
    const isBossWave = this.isBossWave(newWave);

    // For boss waves, calculate boss count and create enemy type plan
    let enemyTypePlan: EnemyType[] = [];

    if (isBossWave) {
      // Calculate boss count: scales with wave number (1 at wave 10, 2 at wave 20, etc.)
      const bossCount = Math.floor(newWave / 10);

      // Create a plan with ~70-80% bosses and ~20-30% regular enemies
      // Distribute bosses evenly throughout the wave
      // Note: enemyCount will be updated after adaptive multiplier is calculated
      enemyTypePlan = new Array(baseEnemyCount).fill('basic' as EnemyType);

      // Place bosses at evenly spaced intervals
      if (bossCount > 0) {
        const spacing = Math.floor(baseEnemyCount / (bossCount + 1));
        for (let b = 0; b < bossCount; b++) {
          const bossIndex = Math.floor((b + 1) * spacing);
          if (bossIndex < baseEnemyCount) {
            enemyTypePlan[bossIndex] = 'boss';
          }
        }
      }

      // Fill remaining slots with variety of regular enemies
      for (let i = 0; i < baseEnemyCount; i++) {
        if (enemyTypePlan[i] === 'boss') continue;

        // Tank enemies appear after wave 2
        if (newWave >= 2 && i % 4 === 0) {
          enemyTypePlan[i] = 'tank';
        }
        // Fast enemies appear after wave 1
        else if (newWave >= 1 && i % 3 === 0) {
          enemyTypePlan[i] = 'fast';
        }
        // Otherwise keep as basic
      }
    } else {
      // Regular wave logic: build plan as we go
      for (let i = 0; i < baseEnemyCount; i++) {
        let enemyType: EnemyType = 'basic';

        // Boss every 5th enemy after wave 3
        if (newWave >= 3 && (i + 1) % 5 === 0) {
          enemyType = 'boss';
        }
        // Tank enemies appear after wave 2
        else if (newWave >= 2 && i % 4 === 0) {
          enemyType = 'tank';
        }
        // Fast enemies appear after wave 1
        else if (newWave >= 1 && i % 3 === 0) {
          enemyType = 'fast';
        }

        enemyTypePlan.push(enemyType);
      }
    }

    // Calculate adaptive difficulty based on defensive power
    const defensivePower = this.calculateDefensivePower(state, pathsForStarts);
    const targetPower = this.calculateTargetPower(newWave);
    const adaptiveMultiplier = this.calculateAdaptiveMultiplier(
      defensivePower,
      targetPower,
    );

    // Calculate base scaling multipliers
    const baseHealthMultiplier = this.calculateHealthMultiplier(
      newWave,
      isBossWave,
    );

    // Apply adaptive multiplier
    const healthMultiplier = baseHealthMultiplier * adaptiveMultiplier;
    const adjustedEnemyCount = Math.floor(baseEnemyCount * adaptiveMultiplier);

    const rewardMultiplier = this.calculateRewardMultiplier(healthMultiplier);

    // Adjust enemy type plan if count changed significantly
    // If count increased, add more basic enemies
    // If count decreased, truncate the plan
    if (adjustedEnemyCount > enemyTypePlan.length) {
      const diff = adjustedEnemyCount - enemyTypePlan.length;
      for (let i = 0; i < diff; i++) {
        enemyTypePlan.push('basic');
      }
    } else if (adjustedEnemyCount < enemyTypePlan.length) {
      enemyTypePlan = enemyTypePlan.slice(0, adjustedEnemyCount);
    }

    // Generate enemies based on the plan
    for (let i = 0; i < adjustedEnemyCount; i++) {
      const enemyType = enemyTypePlan[i] || 'basic';
      const enemyStats = ENEMY_STATS[enemyType];

      // Scale health based on wave number
      const baseHealth = enemyStats.health;
      const scaledHealth = Math.floor(baseHealth * healthMultiplier);
      const health = scaledHealth;
      const speed = enemyStats.speed;

      // Scale reward proportionally to health (with run upgrade bonus)
      let reward = Math.floor(enemyStats.reward * rewardMultiplier);
      if (state.runUpgrade?.effect.type === 'rewardMult') {
        reward = Math.floor(reward * (1 + state.runUpgrade.effect.value));
      }

      const startIdx = i % state.startPositions.length;
      const startPos = state.startPositions[startIdx];
      const path = pathsForStarts[startIdx];
      if (!path || !startPos) continue;

      newEnemies.push({
        health,
        id: state.enemyIdCounter + i,
        maxHealth: health,
        path: [...path],
        pathIndex: 0,
        position: { x: startPos.x, y: startPos.y },
        reward,
        slowed: false,
        spawnTime: timestamp + i * 1000, // Stagger spawns by 1 second
        speed,
        type: enemyType,
      });
    }

    return {
      enemyIdCounter: state.enemyIdCounter + newEnemies.length,
      isWaveActive: true,
      unspawnedEnemies: [...state.unspawnedEnemies, ...newEnemies],
    };
  }
}
