import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { MAX_WAVES } from '../../constants/balance';
import { GameEngine } from '../../engine/game-engine';
import { createTestEnemy, createTestState } from '../test-helpers';

describe('Auto-Advance Integration', () => {
  it('should not auto-advance when wave is still active', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    const state = createTestState({
      autoAdvance: true,
      goalPositions: [{ x: 11, y: 6 }],
      isWaveActive: true,
      spawnedEnemies: [createTestEnemy()],
      startPositions: [{ x: 0, y: 6 }],
      wave: 1,
    });

    // Auto-advance should not trigger when wave is active
    // This is tested by verifying wave doesn't change
    const initialWave = state.wave;
    engine.update(state);

    // Wave should not advance automatically while active
    expect(state.wave).toBe(initialWave);
  });

  it('should not auto-advance when pendingPowerUpSelection is true', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    const state = createTestState({
      autoAdvance: true,
      goalPositions: [{ x: 11, y: 6 }],
      isWaveActive: false,
      pendingPowerUpSelection: true,
      spawnedEnemies: [],
      startPositions: [{ x: 0, y: 6 }],
      unspawnedEnemies: [],
      wave: 1,
    });

    const initialWave = state.wave;
    engine.update(state);

    // Should not advance when waiting for power-up selection
    expect(state.wave).toBe(initialWave);
  });

  it('should not auto-advance when unspawnedEnemies still exist', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    const state = createTestState({
      autoAdvance: true,
      goalPositions: [{ x: 11, y: 6 }],
      isWaveActive: false,
      pendingPowerUpSelection: false,
      spawnedEnemies: [],
      startPositions: [{ x: 0, y: 6 }],
      unspawnedEnemies: [createTestEnemy()], // Still have unspawned enemies
      wave: 1,
    });

    const initialWave = state.wave;
    engine.update(state);

    // Should not advance when unspawned enemies exist
    expect(state.wave).toBe(initialWave);
  });

  it('should not auto-advance when game status is not playing', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    const state = createTestState({
      autoAdvance: true,
      gameStatus: 'lost',
      goalPositions: [{ x: 11, y: 6 }],
      isWaveActive: false,
      pendingPowerUpSelection: false,
      spawnedEnemies: [],
      startPositions: [{ x: 0, y: 6 }],
      unspawnedEnemies: [],
      wave: 1,
    });

    const initialWave = state.wave;
    engine.update(state);

    // Should not advance when game is not playing
    expect(state.wave).toBe(initialWave);
  });

  it('should not auto-advance when wave is 0 or MAX_WAVES', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    // Test wave 0
    let state = createTestState({
      autoAdvance: true,
      goalPositions: [{ x: 11, y: 6 }],
      isWaveActive: false,
      pendingPowerUpSelection: false,
      spawnedEnemies: [],
      startPositions: [{ x: 0, y: 6 }],
      unspawnedEnemies: [],
      wave: 0,
    });

    let initialWave = state.wave;
    engine.update(state);
    expect(state.wave).toBe(initialWave);

    // Test MAX_WAVES
    state = createTestState({
      autoAdvance: true,
      goalPositions: [{ x: 11, y: 6 }],
      isWaveActive: false,
      pendingPowerUpSelection: false,
      spawnedEnemies: [],
      startPositions: [{ x: 0, y: 6 }],
      unspawnedEnemies: [],
      wave: MAX_WAVES,
    });

    initialWave = state.wave;
    engine.update(state);
    expect(state.wave).toBe(initialWave);
  });

  it('should allow manual wave start even with autoAdvance enabled', () => {
    const onUpdate = () => {};
    const engine = new GameEngine(onUpdate);

    let state = createTestState({
      autoAdvance: true,
      goalPositions: [{ x: 11, y: 6 }],
      isWaveActive: false,
      pendingPowerUpSelection: false,
      spawnedEnemies: [],
      startPositions: [{ x: 0, y: 6 }],
      unspawnedEnemies: [],
      wave: 1,
    });

    // Manually start wave
    const waveResult = engine.startWave(state);
    state = { ...state, ...waveResult };

    // Wave should start
    expect(state.isWaveActive).toBe(true);
    expect(state.wave).toBe(2);
  });
});
