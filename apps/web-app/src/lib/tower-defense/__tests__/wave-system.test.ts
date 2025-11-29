import { describe, expect, it } from 'bun:test';
import { WaveSystem } from '../engine/systems/wave-system';
import type { GameState } from '../store/types';

describe('Wave System Integration Tests', () => {
  const createTestState = (overrides: Partial<GameState> = {}): GameState => ({
    activeWavePowerUps: [],
    autoAdvance: false,
    combo: 0,
    damageNumberIdCounter: 0,
    damageNumbers: [],
    enemyIdCounter: 0,
    gameSpeed: 1,
    gameStatus: 'playing',
    goalPositions: [{ x: 11, y: 6 }],
    grid: Array(12)
      .fill(null)
      .map(() => Array(12).fill('empty')),
    isPaused: false,
    isWaveActive: false,
    landmineIdCounter: 0,
    landmines: [],
    lastKillTime: 0,
    lives: 10,
    money: 500,
    obstacles: [],
    particleIdCounter: 0,
    particles: [],
    pendingPowerUpSelection: false,
    placeableIdCounter: 0,
    placeables: [],
    powerupIdCounter: 0,
    powerups: [],
    progress: {
      energy: 100,
      energyRecoveryRate: 1,
      lastEnergyUpdate: Date.now(),
      mapRatings: {},
      maxEnergy: 100,
      techPoints: 0,
      upgrades: {
        energyRecoveryRate: 0,
        gridBugDamage: 0,
        gridBugFrequency: 0,
        landmineDamage: 0,
        landmineFrequency: 0,
        maxEnergy: 0,
        powerNodeFrequency: 0,
        powerNodePersistence: 0,
        powerNodePotency: 0,
        streamFrequency: 0,
        streamLength: 0,
      },
    },
    projectileIdCounter: 0,
    projectiles: [],
    score: 0,
    selectedItem: null,
    selectedTower: null,
    selectedTowerType: null,
    showDamageNumbers: true,
    showGrid: false,
    showPerformanceMonitor: false,
    spawnedEnemies: [],
    startPositions: [{ x: 0, y: 6 }],
    towerIdCounter: 0,
    towers: [],
    unspawnedEnemies: [],
    wave: 0,
    ...overrides,
  });

  describe('Wave generation', () => {
    it('should generate enemies with unique IDs', () => {
      const state = createTestState({
        enemyIdCounter: 0,
      });

      const waveSystem = new WaveSystem();
      const result = waveSystem.startWave(state, Date.now());

      expect(result.unspawnedEnemies).toBeDefined();
      expect(result.unspawnedEnemies?.length).toBeGreaterThan(0);

      // All enemies should have unique IDs
      const ids = result.unspawnedEnemies?.map((e) => e.id) ?? [];
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);

      // IDs should start from the counter
      for (const id of ids) {
        expect(id).toBeGreaterThanOrEqual(0);
      }
    });

    it('should generate more enemies in later waves', () => {
      const waveSystem = new WaveSystem();

      const wave1State = createTestState({ wave: 0 });
      const wave1Result = waveSystem.startWave(wave1State, Date.now());

      const wave5State = createTestState({ wave: 4 });
      const wave5Result = waveSystem.startWave(wave5State, Date.now());

      const wave1Length = wave1Result.unspawnedEnemies?.length ?? 0;
      const wave5Length = wave5Result.unspawnedEnemies?.length ?? 0;
      expect(wave5Length).toBeGreaterThan(wave1Length);
    });

    it('should stagger enemy spawn times', () => {
      const state = createTestState();
      const waveSystem = new WaveSystem();
      const timestamp = Date.now();

      const result = waveSystem.startWave(state, timestamp);

      expect(result.unspawnedEnemies).toBeDefined();
      const spawnTimes = result.unspawnedEnemies?.map((e) => e.spawnTime) ?? [];

      // Each enemy should have a different spawn time
      const uniqueSpawnTimes = new Set(spawnTimes);
      expect(uniqueSpawnTimes.size).toBe(spawnTimes.length);

      // Spawn times should be in order
      for (let i = 1; i < spawnTimes.length; i++) {
        const prev = spawnTimes[i - 1];
        const current = spawnTimes[i];
        if (prev !== undefined && current !== undefined) {
          expect(current).toBeGreaterThan(prev);
        }
      }
    });

    it('should include different enemy types in later waves', () => {
      const waveSystem = new WaveSystem();

      // Wave 1: Should have some basic and fast enemies
      const wave1State = createTestState({ wave: 0 });
      const wave1Result = waveSystem.startWave(wave1State, Date.now());
      const wave1Types = new Set(
        wave1Result.unspawnedEnemies?.map((e) => e.type),
      );

      // Wave 3: Should include tank enemies
      const wave3State = createTestState({ wave: 2 });
      waveSystem.startWave(wave3State, Date.now());

      // Wave 5: Should include boss enemies
      const wave5State = createTestState({ wave: 4 });
      const wave5Result = waveSystem.startWave(wave5State, Date.now());
      const wave5Types = new Set(
        wave5Result.unspawnedEnemies?.map((e) => e.type),
      );

      // Later waves should have more variety
      expect(wave5Types.size).toBeGreaterThanOrEqual(wave1Types.size);
      expect(wave5Types.has('boss')).toBe(true);
    });

    it('should mark wave as active', () => {
      const state = createTestState({
        isWaveActive: false,
      });

      const waveSystem = new WaveSystem();
      const result = waveSystem.startWave(state, Date.now());

      expect(result.isWaveActive).toBe(true);
    });

    it('should not start wave if already active', () => {
      const state = createTestState({
        isWaveActive: true,
      });

      const waveSystem = new WaveSystem();
      const result = waveSystem.startWave(state, Date.now());

      // Should return empty result
      expect(result).toEqual({});
    });

    it('should detect wave completion', () => {
      const waveSystem = new WaveSystem();

      // Wave is complete when both spawned and unspawned are empty
      const state = createTestState({
        isWaveActive: true,
        spawnedEnemies: [],
        unspawnedEnemies: [],
      });

      const result = waveSystem.update(state, 16, Date.now());

      expect(result.isWaveActive).toBe(false);
    });

    it('should not complete wave if enemies remain', () => {
      const waveSystem = new WaveSystem();

      // Wave not complete if unspawned enemies remain
      const state1 = createTestState({
        isWaveActive: true,
        spawnedEnemies: [],
        unspawnedEnemies: [
          {
            health: 100,
            id: 1,
            maxHealth: 100,
            path: [{ x: 0, y: 0 }],
            pathIndex: 0,
            position: { x: 0, y: 0 },
            reward: 10,
            slowed: false,
            spawnTime: Date.now() + 1000,
            speed: 0.1,
            type: 'basic',
          },
        ],
      });

      const result1 = waveSystem.update(state1, 16, Date.now());
      expect(result1.isWaveActive).toBeUndefined();

      // Wave not complete if spawned enemies remain
      const state2 = createTestState({
        isWaveActive: true,
        spawnedEnemies: [
          {
            health: 100,
            id: 1,
            maxHealth: 100,
            path: [{ x: 0, y: 0 }],
            pathIndex: 0,
            position: { x: 0, y: 0 },
            reward: 10,
            slowed: false,
            spawnTime: Date.now(),
            speed: 0.1,
            type: 'basic',
          },
        ],
        unspawnedEnemies: [],
      });

      const result2 = waveSystem.update(state2, 16, Date.now());
      expect(result2.isWaveActive).toBeUndefined();
    });
  });
});
