import { describe, expect, it } from 'bun:test';
import { ParticleSystem } from '../engine/systems/particle-system';
import { createTestState } from './test-helpers';

describe('Particle System Tests', () => {
  describe('Particle lifecycle', () => {
    it('should update particle positions via pool', () => {
      const particleSystem = new ParticleSystem();
      const pool = particleSystem.getPool();

      const state = createTestState({
        particles: [],
      });

      // Spawn particle through pool
      pool.spawn(5, 5, 0.1, 0.2, 60, 'rgb(255, 0, 0)');

      const result = particleSystem.update(state, 16, Date.now());

      expect(result.particles?.length).toBeGreaterThan(0);
      const updatedParticle = result.particles?.[0];
      expect(updatedParticle).toBeDefined();
    });

    it('should decrease particle life each frame via pool', () => {
      const particleSystem = new ParticleSystem();
      const pool = particleSystem.getPool();

      const state = createTestState({
        particles: [],
      });

      // Spawn particle through pool
      pool.spawn(5, 5, 0, 0, 60, 'rgb(255, 0, 0)');

      const result = particleSystem.update(state, 16, Date.now());

      expect(result.particles?.[0]?.life).toBeLessThan(60);
    });

    it('should remove particles when life expires', () => {
      const state = createTestState({
        particles: [
          {
            color: 'rgb(255, 0, 0)',
            id: 1,
            life: 1, // Very low life
            maxLife: 60,
            position: { x: 5, y: 5 },
            velocity: { x: 0, y: 0 },
          },
        ],
      });

      const particleSystem = new ParticleSystem();
      const result = particleSystem.update(state, 16, Date.now());

      // Particle should be removed
      expect(result.particles).toHaveLength(0);
    });

    it('should handle multiple particles via pool', () => {
      const particleSystem = new ParticleSystem();
      const pool = particleSystem.getPool();

      const state = createTestState({
        particles: [],
      });

      // Spawn multiple particles through pool
      pool.spawn(5, 5, 0.1, 0, 60, 'rgb(255, 0, 0)');
      pool.spawn(6, 6, -0.1, 0, 30, 'rgb(0, 255, 0)');
      pool.spawn(7, 7, 0, 0.1, 1, 'rgb(0, 0, 255)'); // Will expire

      const result = particleSystem.update(state, 16, Date.now());

      // Two or three particles should exist (one might expire)
      expect(result.particles?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Particle pool', () => {
    it('should spawn particles via pool', () => {
      const particleSystem = new ParticleSystem();
      const pool = particleSystem.getPool();

      const state = createTestState({
        particleIdCounter: 0,
        particles: [],
      });

      // Spawn particles through pool
      pool.spawn(5, 5, 0.1, 0.1, 60, 'rgb(255, 0, 0)');
      pool.spawn(6, 6, -0.1, 0.1, 60, 'rgb(0, 255, 0)');

      const result = particleSystem.update(state, 16, Date.now());

      // Particles should be created
      expect(result.particles?.length).toBeGreaterThan(0);
    });

    it('should update pooled particles', () => {
      const particleSystem = new ParticleSystem();
      const pool = particleSystem.getPool();

      const state = createTestState({
        particles: [],
      });

      // Spawn particle
      pool.spawn(5, 5, 0.1, 0.1, 60, 'rgb(255, 0, 0)');

      // Update multiple times
      let currentState = state;
      for (let i = 0; i < 5; i++) {
        const result = particleSystem.update(currentState, 16, Date.now());
        currentState = { ...currentState, ...result };
      }

      // Particle should still exist with decreased life
      expect(currentState.particles?.length).toBeGreaterThan(0);
      expect(currentState.particles?.[0]?.life).toBeLessThan(60);
    });

    it('should cleanup expired pooled particles', () => {
      const particleSystem = new ParticleSystem();
      const pool = particleSystem.getPool();

      const state = createTestState({
        particles: [],
      });

      // Spawn particle with short life
      pool.spawn(5, 5, 0, 0, 5, 'rgb(255, 0, 0)');

      // Update multiple times until particle expires
      let currentState = state;
      for (let i = 0; i < 10; i++) {
        const result = particleSystem.update(currentState, 16, Date.now());
        currentState = { ...currentState, ...result };
      }

      // Particle should be removed
      expect(currentState.particles?.length).toBe(0);
    });

    it('should handle large number of particles efficiently', () => {
      const particleSystem = new ParticleSystem();
      const pool = particleSystem.getPool();

      const state = createTestState({
        particles: [],
      });

      // Spawn many particles
      for (let i = 0; i < 100; i++) {
        const angle = (Math.PI * 2 * i) / 100;
        pool.spawn(
          5,
          5,
          Math.cos(angle) * 0.1,
          Math.sin(angle) * 0.1,
          60,
          'rgb(255, 0, 0)',
        );
      }

      const result = particleSystem.update(state, 16, Date.now());

      // Should handle all particles
      expect(result.particles?.length).toBe(100);
    });
  });

  describe('Damage numbers', () => {
    it('should update damage number positions', () => {
      const state = createTestState({
        damageNumbers: [
          {
            color: 'rgb(255, 0, 0)',
            id: 1,
            life: 60,
            position: { x: 5, y: 5 },
            value: 20,
          },
        ],
      });

      const particleSystem = new ParticleSystem();
      const result = particleSystem.update(state, 16, Date.now());

      const updatedDamageNumber = result.damageNumbers?.[0];
      expect(updatedDamageNumber).toBeDefined();
      // Damage numbers should float upward
      expect(updatedDamageNumber?.position.y).toBeLessThan(5);
    });

    it('should decrease damage number life', () => {
      const state = createTestState({
        damageNumbers: [
          {
            color: 'rgb(255, 0, 0)',
            id: 1,
            life: 60,
            position: { x: 5, y: 5 },
            value: 20,
          },
        ],
      });

      const particleSystem = new ParticleSystem();
      const result = particleSystem.update(state, 16, Date.now());

      expect(result.damageNumbers?.[0]?.life).toBeLessThan(60);
    });

    it('should remove expired damage numbers', () => {
      const state = createTestState({
        damageNumbers: [
          {
            color: 'rgb(255, 0, 0)',
            id: 1,
            life: 1, // Very low life
            position: { x: 5, y: 5 },
            value: 20,
          },
        ],
      });

      const particleSystem = new ParticleSystem();
      const result = particleSystem.update(state, 16, Date.now());

      // Damage number should be removed
      expect(result.damageNumbers).toHaveLength(0);
    });

    it('should handle multiple damage numbers', () => {
      const state = createTestState({
        damageNumbers: [
          {
            color: 'rgb(255, 0, 0)',
            id: 1,
            life: 60,
            position: { x: 5, y: 5 },
            value: 20,
          },
          {
            color: 'rgb(255, 255, 0)',
            id: 2,
            life: 30,
            position: { x: 6, y: 6 },
            value: 50,
          },
          {
            color: 'rgb(255, 0, 255)',
            id: 3,
            life: 1, // Will expire
            position: { x: 7, y: 7 },
            value: 100,
          },
        ],
      });

      const particleSystem = new ParticleSystem();
      const result = particleSystem.update(state, 16, Date.now());

      // Two damage numbers should remain
      expect(result.damageNumbers?.length).toBe(2);

      // Remaining damage numbers should have updated positions and life
      if (result.damageNumbers) {
        for (const damageNumber of result.damageNumbers) {
          expect(damageNumber.life).toBeLessThan(60);
          expect(damageNumber.position.y).toBeLessThan(7);
        }
      }
    });
  });

  describe('System integration', () => {
    it('should handle both particles and damage numbers together', () => {
      const particleSystem = new ParticleSystem();
      const pool = particleSystem.getPool();

      const state = createTestState({
        damageNumbers: [
          {
            color: 'rgb(255, 0, 0)',
            id: 1,
            life: 60,
            position: { x: 5, y: 5 },
            value: 20,
          },
        ],
        particles: [],
      });

      // Spawn particle through pool
      pool.spawn(5, 5, 0.1, 0.1, 60, 'rgb(0, 255, 0)');

      const result = particleSystem.update(state, 16, Date.now());

      // Both should be updated
      expect(result.particles?.length).toBeGreaterThan(0);
      expect(result.damageNumbers?.length).toBe(1);

      // Both should have decreased life
      expect(result.particles?.[0]?.life).toBeLessThan(60);
      expect(result.damageNumbers?.[0]?.life).toBeLessThan(60);
    });

    it('should clean up both particles and damage numbers when expired', () => {
      const state = createTestState({
        damageNumbers: [
          {
            color: 'rgb(255, 0, 0)',
            id: 1,
            life: 1,
            position: { x: 5, y: 5 },
            value: 20,
          },
        ],
        particles: [
          {
            color: 'rgb(0, 255, 0)',
            id: 1,
            life: 1,
            maxLife: 60,
            position: { x: 5, y: 5 },
            velocity: { x: 0, y: 0 },
          },
        ],
      });

      const particleSystem = new ParticleSystem();
      const result = particleSystem.update(state, 16, Date.now());

      // Both should be removed
      expect(result.particles).toHaveLength(0);
      expect(result.damageNumbers).toHaveLength(0);
    });
  });

  describe('No-op updates', () => {
    it('should return empty update when no particles or damage numbers', () => {
      const state = createTestState({
        damageNumbers: [],
        particles: [],
      });

      const particleSystem = new ParticleSystem();
      const result = particleSystem.update(state, 16, Date.now());

      // Should return minimal updates
      expect(result.particles || []).toHaveLength(0);
      expect(result.damageNumbers || []).toHaveLength(0);
    });
  });
});
