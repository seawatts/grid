import type { DamageNumber, Particle } from '../../game-types';
import type {
  GameState,
  GameSystem,
  SystemUpdateResult,
} from '../../store/types';

const MAX_PARTICLES = 10000;

// Particle pool using typed arrays for maximum performance
class ParticlePool {
  private capacity: number;
  private activeCount = 0;

  // Typed arrays for particle data (Structure of Arrays pattern)
  private posX: Float32Array;
  private posY: Float32Array;
  private velX: Float32Array;
  private velY: Float32Array;
  private life: Uint16Array;
  private maxLife: Uint16Array;
  private ids: Uint32Array;
  private colors: Uint32Array; // Packed RGBA color

  // Free list for efficient allocation
  private freeIndices: Uint32Array;
  private freeCount: number;

  // ID counter
  private nextId = 0;

  constructor(capacity: number = MAX_PARTICLES) {
    this.capacity = capacity;

    // Allocate typed arrays
    this.posX = new Float32Array(capacity);
    this.posY = new Float32Array(capacity);
    this.velX = new Float32Array(capacity);
    this.velY = new Float32Array(capacity);
    this.life = new Uint16Array(capacity);
    this.maxLife = new Uint16Array(capacity);
    this.ids = new Uint32Array(capacity);
    this.colors = new Uint32Array(capacity);

    // Initialize free list
    this.freeIndices = new Uint32Array(capacity);
    this.freeCount = capacity;
    for (let i = 0; i < capacity; i++) {
      this.freeIndices[i] = i;
    }
  }

  // Convert RGB string to packed 32-bit color
  private packColor(colorStr: string): number {
    // Parse rgb(r, g, b) format
    const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match?.[1] && match?.[2] && match?.[3]) {
      const r = Number.parseInt(match[1], 10);
      const g = Number.parseInt(match[2], 10);
      const b = Number.parseInt(match[3], 10);
      return (255 << 24) | (b << 16) | (g << 8) | r;
    }
    return 0xffffffff; // Default white
  }

  // Convert packed color back to CSS rgb string
  private unpackColor(packed: number): string {
    const r = packed & 0xff;
    const g = (packed >> 8) & 0xff;
    const b = (packed >> 16) & 0xff;
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Spawn a new particle (reuses dead particles)
  spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    color: string,
  ): number {
    if (this.freeCount === 0) {
      // Pool exhausted, try to free oldest particle
      let oldestIdx = 0;
      let oldestLife = this.life[0] ?? 0;
      for (let i = 1; i < this.activeCount; i++) {
        const currentLife = this.life[i] ?? 0;
        if (currentLife < oldestLife) {
          oldestLife = currentLife;
          oldestIdx = i;
        }
      }
      // Mark oldest as free
      this.life[oldestIdx] = 0;
      this.freeIndices[this.freeCount++] = oldestIdx;
    }

    // Get index from free list
    const idx = this.freeIndices[--this.freeCount] ?? 0;

    // Set particle data
    this.posX[idx] = x;
    this.posY[idx] = y;
    this.velX[idx] = vx;
    this.velY[idx] = vy;
    this.life[idx] = life;
    this.maxLife[idx] = life;
    this.ids[idx] = this.nextId++;
    this.colors[idx] = this.packColor(color);

    this.activeCount = Math.max(this.activeCount, idx + 1);

    return this.ids[idx] ?? 0;
  }

  // Update all particles in-place
  update(gameSpeed: number): void {
    let writeIdx = 0;

    for (let readIdx = 0; readIdx < this.activeCount; readIdx++) {
      const currentLife = this.life[readIdx] ?? 0;

      // Skip dead particles
      if (currentLife === 0) continue;

      // Update life
      const newLife = currentLife - gameSpeed;
      if (newLife <= 0) {
        // Particle died, add to free list
        this.freeIndices[this.freeCount++] = readIdx;
        this.life[readIdx] = 0;
        continue;
      }

      // Update position and life in-place
      const velX = this.velX[readIdx] ?? 0;
      const velY = this.velY[readIdx] ?? 0;
      const posX = this.posX[readIdx] ?? 0;
      const posY = this.posY[readIdx] ?? 0;
      this.posX[readIdx] = posX + velX * gameSpeed;
      this.posY[readIdx] = posY + velY * gameSpeed;
      this.life[readIdx] = newLife;

      // Compact the active region
      if (writeIdx !== readIdx) {
        this.posX[writeIdx] = this.posX[readIdx] ?? 0;
        this.posY[writeIdx] = this.posY[readIdx] ?? 0;
        this.velX[writeIdx] = this.velX[readIdx] ?? 0;
        this.velY[writeIdx] = this.velY[readIdx] ?? 0;
        this.life[writeIdx] = this.life[readIdx] ?? 0;
        this.maxLife[writeIdx] = this.maxLife[readIdx] ?? 0;
        this.ids[writeIdx] = this.ids[readIdx] ?? 0;
        this.colors[writeIdx] = this.colors[readIdx] ?? 0;

        this.life[readIdx] = 0;
      }

      writeIdx++;
    }

    this.activeCount = writeIdx;
  }

  // Convert active particles to standard Particle array (for rendering)
  toArray(): Particle[] {
    const result: Particle[] = [];

    for (let i = 0; i < this.activeCount; i++) {
      const life = this.life[i] ?? 0;
      if (life > 0) {
        result.push({
          color: this.unpackColor(this.colors[i] ?? 0xffffffff),
          id: this.ids[i] ?? 0,
          life,
          maxLife: this.maxLife[i] ?? 0,
          position: {
            x: this.posX[i] ?? 0,
            y: this.posY[i] ?? 0,
          },
          velocity: {
            x: this.velX[i] ?? 0,
            y: this.velY[i] ?? 0,
          },
        });
      }
    }

    return result;
  }

  // Get active particle count
  getActiveCount(): number {
    return this.activeCount;
  }

  // Clear all particles
  clear(): void {
    this.activeCount = 0;
    this.freeCount = this.capacity;
    for (let i = 0; i < this.capacity; i++) {
      this.freeIndices[i] = i;
      this.life[i] = 0;
    }
  }
}

export class ParticleSystem implements GameSystem {
  private pool: ParticlePool;

  constructor() {
    this.pool = new ParticlePool(MAX_PARTICLES);
  }

  // Get the pool instance for external spawning
  getPool(): ParticlePool {
    return this.pool;
  }

  update(
    state: GameState,
    _deltaTime: number,
    _timestamp: number,
  ): SystemUpdateResult {
    const { damageNumbers, gameSpeed } = state;

    // Update all particles in the pool
    this.pool.update(gameSpeed);

    // Convert back to array for rendering
    const updatedParticles = this.pool.toArray();

    // Update damage numbers
    const updatedDamageNumbers = damageNumbers
      .map(
        (d): DamageNumber => ({
          ...d,
          life: d.life - 1,
          position: {
            ...d.position,
            y: d.position.y - 0.01, // Float up slightly
          },
        }),
      )
      .filter((d) => d.life > 0);

    return {
      damageNumbers: updatedDamageNumbers,
      particles: updatedParticles,
    };
  }
}

// Export the pool for direct spawning
export { ParticlePool };
