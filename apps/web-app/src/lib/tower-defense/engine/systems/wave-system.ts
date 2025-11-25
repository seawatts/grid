import { ENEMY_STATS } from '../../constants/balance';
import type { Enemy, EnemyType } from '../../game-types';
import { findPathsForMultipleStartsAndGoals } from '../../pathfinding';
import type {
  GameState,
  GameSystem,
  SystemUpdateResult,
} from '../../store/types';

export class WaveSystem implements GameSystem {
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

    const allBlockedPositions = [
      ...state.towers.map((t) => t.position),
      ...state.obstacles,
    ];

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
