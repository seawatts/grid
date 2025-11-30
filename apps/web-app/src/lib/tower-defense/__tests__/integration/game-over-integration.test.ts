import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { MAX_WAVES } from '../../constants/balance';
import { GameEngine } from '../../engine/game-engine';
import type { SystemUpdateResult } from '../../store/types';
import { runGameUntil } from '../integration-test-setup';
import { createTestEnemy, createTestState } from '../test-helpers';

describe('Game Over Conditions Integration', () => {
  it('should detect game loss when lives reach zero', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    let state = createTestState({
      gameStatus: 'playing',
      lives: 1,
    });

    // Simulate enemy reaching goal
    const enemy = createTestEnemy({
      path: [
        { x: 10, y: 6 },
        { x: 11, y: 6 },
      ],
      pathIndex: 0,
      position: { x: 10, y: 6 },
      speed: 0.5,
    });

    state = { ...state, spawnedEnemies: [enemy] };

    // Run until enemy reaches goal
    state = runGameUntil(
      engine,
      state,
      (s) => s.spawnedEnemies.length === 0,
      100,
    );

    engine.stop();

    // Lives should be 0
    expect(state.lives).toBe(0);
  });

  it('should detect game win when max waves completed', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const state = createTestState({
      gameStatus: 'playing',
      isWaveActive: false,
      spawnedEnemies: [],
      unspawnedEnemies: [],
      wave: MAX_WAVES,
    });

    // Update should detect victory
    engine.update(state);
    engine.stop();

    // Should detect victory
    const wonUpdate = updates.find((u) => u.gameStatus === 'won');
    expect(wonUpdate).toBeDefined();
  });
});
