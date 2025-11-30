import '../integration-test-setup';
import { describe, expect, it } from 'bun:test';
import { GameEngine } from '../../engine/game-engine';
import type { SystemUpdateResult } from '../../store/types';
import { createTestState, createTestTower } from '../test-helpers';

describe('State Persistence Integration', () => {
  it('should maintain game state across updates', () => {
    const updates: SystemUpdateResult[] = [];
    const onUpdate = (update: SystemUpdateResult) => {
      updates.push(update);
    };

    const engine = new GameEngine(onUpdate);
    engine.start();

    const tower = createTestTower({
      id: 1,
      position: { x: 2, y: 5 },
    });

    let state = createTestState({
      money: 100,
      towers: [tower],
      wave: 1,
    });

    const initialMoney = state.money;
    const initialWave = state.wave;

    // Run multiple updates
    for (let i = 0; i < 10; i++) {
      engine.update(state);
      if (updates.length > 0) {
        const lastUpdate = updates.at(-1);
        state = { ...state, ...lastUpdate };
        updates.length = 0;
      }
    }

    engine.stop();

    // State should be maintained
    expect(state.money).toBe(initialMoney);
    expect(state.wave).toBe(initialWave);
    expect(state.towers.length).toBe(1);
  });
});
