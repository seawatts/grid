import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { GameEngine } from '../../engine/game-engine';
import type { Tower } from '../../game-types';
import { createTestState, createTestTower } from '../test-helpers';

describe('Wave System Integration', () => {
  it('should scale difficulty across waves', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    let state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      startPositions: [{ x: 0, y: 6 }],
      wave: 0,
    });

    // Get enemy counts for different waves
    const wave1Result = engine.startWave(state);
    state = { ...state, ...wave1Result };
    const wave1Count = wave1Result.unspawnedEnemies?.length || 0;

    state = { ...state, isWaveActive: false, wave: 4 };
    const wave5Result = engine.startWave(state);
    const wave5Count = wave5Result.unspawnedEnemies?.length || 0;

    state = { ...state, isWaveActive: false, wave: 9 };
    const wave10Result = engine.startWave(state);
    const wave10Count = wave10Result.unspawnedEnemies?.length || 0;

    // Later waves should have more enemies
    expect(wave5Count).toBeGreaterThan(wave1Count);
    expect(wave10Count).toBeGreaterThan(wave5Count);
  });

  it('should generate boss waves every 10 waves', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    const state = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      startPositions: [{ x: 0, y: 6 }],
      wave: 9,
    });

    const wave10Result = engine.startWave(state);
    const enemies = wave10Result.unspawnedEnemies || [];

    // Wave 10 should have boss enemies
    const bossCount = enemies.filter((e) => e.type === 'boss').length;
    expect(bossCount).toBeGreaterThan(0);
  });

  it('should apply adaptive difficulty based on tower power', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    // Weak defense
    const weakState = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      startPositions: [{ x: 0, y: 6 }],
      towers: [createTestTower({ id: 1, position: { x: 2, y: 5 } })],
      wave: 4,
    });

    const weakResult = engine.startWave(weakState);
    const weakEnemyCount = weakResult.unspawnedEnemies?.length || 0;
    const weakEnemyHealth = weakResult.unspawnedEnemies?.[0]?.health || 0;

    // Strong defense
    const strongTowers: Tower[] = [];
    for (let i = 0; i < 10; i++) {
      strongTowers.push(
        createTestTower({
          id: i + 1,
          level: 3,
          position: { x: 2 + (i % 5), y: 4 + Math.floor(i / 5) },
          type: 'sniper',
        }),
      );
    }

    const strongState = createTestState({
      goalPositions: [{ x: 11, y: 6 }],
      startPositions: [{ x: 0, y: 6 }],
      towers: strongTowers,
      wave: 4,
    });

    const strongResult = engine.startWave(strongState);
    const strongEnemyCount = strongResult.unspawnedEnemies?.length || 0;
    const strongEnemyHealth = strongResult.unspawnedEnemies?.[0]?.health || 0;

    // Strong defense should face harder enemies (adaptive difficulty)
    expect(strongEnemyCount).toBeGreaterThanOrEqual(weakEnemyCount);
    expect(strongEnemyHealth).toBeGreaterThanOrEqual(weakEnemyHealth);
  });
});
