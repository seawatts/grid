import { ENEMY_STATS } from '../../constants/balance';
import type { Enemy, EnemyType } from '../../game-types';
import {
  combineBlockedPositions,
  findPathsForMultipleStartsAndGoals,
} from '../../pathfinding';
import type {
  GameState,
  GameSystem,
  SystemUpdateResult,
} from '../../store/types';

export class WaveSystem implements GameSystem {
  /**
   * Check if a wave number is a boss wave (every 10th wave)
   */
  private isBossWave(wave: number): boolean {
    return wave > 0 && wave % 10 === 0;
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
    const enemyCount = 5 + newWave * 2;

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
      state.grid.length,
    );

    if (pathsForStarts.some((p) => !p)) {
      console.error('Some spawn points are blocked!');
      return {};
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
      enemyTypePlan = new Array(enemyCount).fill('basic' as EnemyType);

      // Place bosses at evenly spaced intervals
      if (bossCount > 0) {
        const spacing = Math.floor(enemyCount / (bossCount + 1));
        for (let b = 0; b < bossCount; b++) {
          const bossIndex = Math.floor((b + 1) * spacing);
          if (bossIndex < enemyCount) {
            enemyTypePlan[bossIndex] = 'boss';
          }
        }
      }

      // Fill remaining slots with variety of regular enemies
      for (let i = 0; i < enemyCount; i++) {
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
      for (let i = 0; i < enemyCount; i++) {
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

    // Generate enemies based on the plan
    for (let i = 0; i < enemyCount; i++) {
      const enemyType = enemyTypePlan[i] || 'basic';
      const enemyStats = ENEMY_STATS[enemyType];
      const health = enemyStats.health;
      const speed = enemyStats.speed;

      let reward = enemyStats.reward;
      if (state.runUpgrade?.effect.type === 'rewardMult') {
        reward = Math.floor(reward * (1 + state.runUpgrade.effect.value)) as
          | 10
          | 15
          | 30
          | 100;
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
