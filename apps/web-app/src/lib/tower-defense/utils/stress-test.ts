import type { ParticlePool } from '../engine/systems/particle-system';

/**
 * Stress test utility for particle system performance testing
 * Press 'P' key in development to spawn 5000 particles
 */
export function setupStressTest(getPool: () => ParticlePool | null) {
  if (typeof window === 'undefined') return;

  const handleKeyPress = (e: KeyboardEvent) => {
    // Press 'P' to spawn particles
    if (e.key === 'p' || e.key === 'P') {
      const pool = getPool();
      if (!pool) {
        console.warn('Particle pool not available');
        return;
      }

      console.log('🎆 Spawning 5000 particles for stress test...');
      const startTime = performance.now();

      // Spawn 5000 particles in a burst
      const colors = [
        'rgb(6, 182, 212)', // cyan
        'rgb(239, 68, 68)', // red
        'rgb(168, 85, 247)', // purple
        'rgb(236, 72, 153)', // pink
        'rgb(34, 197, 94)', // green
      ];

      for (let i = 0; i < 5000; i++) {
        // Random position in grid (assuming 20x20 grid)
        const x = Math.random() * 20;
        const y = Math.random() * 20;

        // Random velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.05 + Math.random() * 0.1;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        // Random color
        const color = colors[Math.floor(Math.random() * colors.length)];

        // Spawn with varying lifetimes
        const life = 40 + Math.floor(Math.random() * 40);

        pool.spawn(x, y, vx, vy, life, color);
      }

      const endTime = performance.now();
      console.log(
        `✅ Spawned 5000 particles in ${(endTime - startTime).toFixed(2)}ms`,
      );
      console.log(`Active particles: ${pool.getActiveCount()}`);
    }

    // Press 'C' to clear all particles
    if (e.key === 'c' || e.key === 'C') {
      const pool = getPool();
      if (!pool) return;

      pool.clear();
      console.log('🧹 Cleared all particles');
    }

    // Press 'I' to show pool info
    if (e.key === 'i' || e.key === 'I') {
      const pool = getPool();
      if (!pool) return;

      console.log(`ℹ️ Active particles: ${pool.getActiveCount()}`);
    }
  };

  window.addEventListener('keydown', handleKeyPress);

  console.log('🎮 Stress test controls enabled:');
  console.log('  P - Spawn 5000 particles');
  console.log('  C - Clear all particles');
  console.log('  I - Show particle count');

  return () => {
    window.removeEventListener('keydown', handleKeyPress);
  };
}
