import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { GameEngine } from '../../engine/game-engine';
import type { SystemUpdateResult } from '../../store/types';
import {
  createTestEnemy,
  createTestState,
  createTestTower,
} from '../test-helpers';

describe('Pause Integration', () => {
  it('should not update game state when paused', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const enemy = createTestEnemy({
      health: 100,
      position: { x: 0, y: 6 },
    });

    const state = createTestState({
      isPaused: true,
      spawnedEnemies: [enemy],
    });

    // Update should be ignored when paused
    engine.update(state);
    engine.stop();

    // Should not receive updates
    expect(updates.length).toBe(0);
  });

  it('should not update when paused during active wave', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const enemy = createTestEnemy();
    const tower = createTestTower();

    const state = createTestState({
      isPaused: true,
      isWaveActive: true,
      spawnedEnemies: [enemy],
      towers: [tower],
      wave: 1,
    });

    // Update should be ignored even during active wave
    engine.update(state);
    engine.stop();

    expect(updates.length).toBe(0);
  });

  it('should not update when paused and game status is playing', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const state = createTestState({
      gameStatus: 'playing',
      isPaused: true,
      spawnedEnemies: [createTestEnemy()],
    });

    engine.update(state);
    engine.stop();

    expect(updates.length).toBe(0);
  });

  it('should resume updates after unpausing', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const enemy = createTestEnemy();

    // First update while paused
    let state = createTestState({
      isPaused: true,
      spawnedEnemies: [enemy],
    });
    engine.update(state);
    expect(updates.length).toBe(0);

    // Unpause and update
    state = { ...state, isPaused: false };
    engine.update(state);
    engine.stop();

    // Should now receive updates
    expect(updates.length).toBeGreaterThan(0);
  });

  it('should not update when game status is not playing, even if not paused', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const state = createTestState({
      gameStatus: 'lost',
      isPaused: false,
      spawnedEnemies: [createTestEnemy()],
    });

    engine.update(state);
    engine.stop();

    expect(updates.length).toBe(0);
  });

  it('should handle pause state transitions correctly', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const enemy = createTestEnemy();

    // Start unpaused
    let state = createTestState({
      isPaused: false,
      spawnedEnemies: [enemy],
    });
    engine.update(state);
    updates.length = 0;

    // Pause
    state = { ...state, isPaused: true };
    engine.update(state);
    expect(updates.length).toBe(0);

    // Unpause again
    state = { ...state, isPaused: false };
    engine.update(state);
    engine.stop();

    // Should receive updates again
    expect(updates.length).toBeGreaterThan(0);
  });
});
