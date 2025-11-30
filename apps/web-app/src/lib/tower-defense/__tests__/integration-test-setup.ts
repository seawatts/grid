import { beforeAll } from 'bun:test';
import { GameEngine } from '../engine/game-engine';
import type { GameState, SystemUpdateResult } from '../store/types';

// Mock requestAnimationFrame for Node/Bun environment
beforeAll(() => {
  if (typeof globalThis.requestAnimationFrame === 'undefined') {
    (
      globalThis as unknown as {
        requestAnimationFrame: typeof requestAnimationFrame;
      }
    ).requestAnimationFrame = (callback: FrameRequestCallback) => {
      return setTimeout(callback, 16) as unknown as number;
    };
    (
      globalThis as unknown as {
        cancelAnimationFrame: typeof cancelAnimationFrame;
      }
    ).cancelAnimationFrame = (id: number) => {
      clearTimeout(id);
    };
  }
});

/**
 * Helper to run game until condition is met
 */
export function runGameUntil(
  _engine: GameEngine,
  initialState: GameState,
  condition: (state: GameState) => boolean,
  maxFrames = 1000,
): GameState {
  let state = initialState;
  const updates: SystemUpdateResult[] = [];
  const onUpdate = (update: SystemUpdateResult) => {
    updates.push(update);
  };

  const testEngine = new GameEngine(onUpdate);
  testEngine.start();

  let frame = 0;
  while (frame < maxFrames && !condition(state)) {
    testEngine.update(state);
    if (updates.length > 0) {
      const lastUpdate = updates.at(-1);
      state = { ...state, ...lastUpdate };
      updates.length = 0; // Clear for next frame
    }
    frame++;
  }

  testEngine.stop();
  return state;
}
