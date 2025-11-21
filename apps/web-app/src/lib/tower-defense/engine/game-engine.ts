import { MAX_WAVES } from '../constants/balance';
import type { GameState, SystemUpdateResult } from '../store/types';
import { shouldResetCombo } from '../utils/calculations';
import { CollisionSystem } from './systems/collision-system';
import { EnemySystem } from './systems/enemy-system';
import { ItemSystem } from './systems/item-system';
import { ParticleSystem } from './systems/particle-system';
import { ProjectileSystem } from './systems/projectile-system';
import { TowerSystem } from './systems/tower-system';
import { WaveSystem } from './systems/wave-system';

export class GameEngine {
  private enemySystem = new EnemySystem();
  private towerSystem = new TowerSystem();
  private projectileSystem = new ProjectileSystem();
  private collisionSystem = new CollisionSystem();
  private waveSystem = new WaveSystem();
  private itemSystem = new ItemSystem();
  private particleSystem = new ParticleSystem();

  private animationFrameId: number | null = null;
  private lastUpdateTime = 0;
  private isRunning = false;

  private onStateUpdate: (updates: SystemUpdateResult) => void;

  constructor(onStateUpdate: (updates: SystemUpdateResult) => void) {
    this.onStateUpdate = onStateUpdate;
    // Connect the particle pool to the collision system
    this.collisionSystem.setParticlePool(this.particleSystem.getPool());
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastUpdateTime = Date.now();
    this.gameLoop();
  }

  pause() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastUpdateTime = Date.now();
    this.gameLoop();
  }

  stop() {
    this.pause();
  }

  private gameLoop = () => {
    if (!this.isRunning) return;

    const now = Date.now();
    const deltaTime = now - this.lastUpdateTime;

    // Limit update rate to ~20 FPS minimum (50ms between updates)
    if (deltaTime < 50) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
      return;
    }

    this.lastUpdateTime = now;

    // This will be called with the current state from the component
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  /**
   * Update all systems with the current game state
   * This is called from outside the engine with the current state
   */
  update(state: GameState): void {
    if (!this.isRunning || state.isPaused || state.gameStatus !== 'playing') {
      return;
    }

    const timestamp = Date.now();
    const deltaTime = timestamp - this.lastUpdateTime;

    // Accumulate all updates
    const updates: SystemUpdateResult = {};

    // Update systems in order
    this.applySystemUpdate(
      updates,
      this.enemySystem.update(state, deltaTime, timestamp),
    );

    // Update state for next system
    let currentState = { ...state, ...updates };

    this.applySystemUpdate(
      updates,
      this.towerSystem.update(currentState, deltaTime, timestamp),
    );
    currentState = { ...state, ...updates };

    this.applySystemUpdate(
      updates,
      this.collisionSystem.update(currentState, deltaTime, timestamp),
    );
    currentState = { ...state, ...updates };

    this.applySystemUpdate(
      updates,
      this.projectileSystem.update(currentState, deltaTime, timestamp),
    );
    currentState = { ...state, ...updates };

    this.applySystemUpdate(
      updates,
      this.waveSystem.update(currentState, deltaTime, timestamp),
    );
    currentState = { ...state, ...updates };

    this.applySystemUpdate(
      updates,
      this.particleSystem.update(currentState, deltaTime, timestamp),
    );

    // Check for combo reset
    if (
      state.combo > 0 &&
      shouldResetCombo(state.lastKillTime, timestamp) &&
      !updates.combo
    ) {
      updates.combo = 0;
    }

    // Check for game over conditions
    if (updates.lives !== undefined && updates.lives <= 0) {
      updates.gameStatus = 'lost';
    }

    if (
      state.wave >= MAX_WAVES &&
      !state.isWaveActive &&
      state.spawnedEnemies.length === 0 &&
      state.unspawnedEnemies.length === 0
    ) {
      updates.gameStatus = 'won';
    }

    // Send updates back to the component
    if (Object.keys(updates).length > 0) {
      this.onStateUpdate(updates);
    }
  }

  private applySystemUpdate(
    target: SystemUpdateResult,
    source: SystemUpdateResult,
  ): void {
    Object.assign(target, source);
  }

  /**
   * Public method to start a new wave
   */
  startWave(state: GameState): SystemUpdateResult {
    const waveUpdates = this.waveSystem.startWave(state, Date.now());

    // Also generate items for the wave
    const updatedState = { ...state, ...waveUpdates };
    const itemUpdates = this.itemSystem.generateWaveItems(updatedState, 1);

    return {
      ...waveUpdates,
      ...itemUpdates,
      wave: state.wave + 1,
    };
  }

  /**
   * Public method to generate items
   */
  generateItems(state: GameState, count = 1): SystemUpdateResult {
    return this.itemSystem.generateWaveItems(state, count);
  }

  /**
   * Get the particle pool for direct particle spawning
   */
  getParticlePool() {
    return this.particleSystem.getPool();
  }
}
