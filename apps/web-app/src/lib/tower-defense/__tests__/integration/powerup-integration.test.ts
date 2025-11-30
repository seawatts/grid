import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { GameEngine } from '../../engine/game-engine';
import type { WavePowerUp } from '../../game-types';
import type { SystemUpdateResult } from '../../store/types';
import {
  createTestEnemy,
  createTestState,
  createTestTower,
} from '../test-helpers';

describe('Power-up System Integration', () => {
  it('should apply wave power-ups to tower damage', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const damagePowerUp: WavePowerUp = {
      description: 'Test damage boost',
      duration: 'permanent',
      effect: { type: 'damageMult', value: 0.5 },
      icon: 'damage',
      id: 'test-damage',
      name: 'Test Damage',
      rarity: 'common',
      stacking: 'additive',
    };

    const enemy = createTestEnemy({
      health: 200,
      id: 1,
      pathIndex: 2,
      position: { x: 2, y: 6 },
    });

    const tower = createTestTower({
      id: 1,
      position: { x: 2, y: 5 },
      type: 'basic',
    });

    let state = createTestState({
      activeWavePowerUps: [damagePowerUp],
      spawnedEnemies: [enemy],
      towers: [tower],
    });

    // Run until enemy takes damage
    let damageDealt = 0;
    const initialHealth = enemy.health;
    for (let i = 0; i < 200 && damageDealt === 0; i++) {
      engine.update(state);
      if (updates.length > 0) {
        const lastUpdate = updates.at(-1);
        state = { ...state, ...lastUpdate };
        updates.length = 0;

        if (
          state.spawnedEnemies.length > 0 &&
          state.spawnedEnemies[0]?.health !== undefined
        ) {
          damageDealt = initialHealth - state.spawnedEnemies[0].health;
        } else if (state.spawnedEnemies.length === 0) {
          // Enemy was killed - definitely took damage
          damageDealt = initialHealth;
        }
      }
    }

    engine.stop();
    // Enemy should take damage (either killed or damaged)
    expect(damageDealt).toBeGreaterThan(0);
  });

  it('should apply fire rate power-ups', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const fireRatePowerUp: WavePowerUp = {
      description: 'Test fire rate boost',
      duration: 'permanent',
      effect: { type: 'fireRateMult', value: 0.3 },
      icon: 'speed',
      id: 'test-firerate',
      name: 'Test Fire Rate',
      rarity: 'common',
      stacking: 'multiplicative',
    };

    const enemy = createTestEnemy({
      health: 100,
      id: 1,
      pathIndex: 2,
      position: { x: 2, y: 6 },
    });

    const tower = createTestTower({
      id: 1,
      position: { x: 2, y: 5 },
      type: 'basic',
    });

    let state = createTestState({
      activeWavePowerUps: [fireRatePowerUp],
      spawnedEnemies: [enemy],
      towers: [tower],
    });

    // Count projectiles created (faster fire rate = more projectiles)
    let projectileCount = 0;
    for (let i = 0; i < 50; i++) {
      engine.update(state);
      if (updates.length > 0) {
        const lastUpdate = updates.at(-1);
        if (lastUpdate) {
          state = { ...state, ...lastUpdate };
          projectileCount += lastUpdate.projectiles?.length || 0;
        }
        updates.length = 0;
      }
    }

    engine.stop();
    expect(projectileCount).toBeGreaterThan(0);
  });
});
