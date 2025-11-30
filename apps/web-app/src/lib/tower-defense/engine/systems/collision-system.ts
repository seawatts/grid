import { TRAP_CONFIGS } from '../../constants/placeables';
import {
  PARTICLE_COUNT_ENEMY_KILL,
  PARTICLE_COUNT_LANDMINE,
} from '../../constants/visuals';
import type {
  DamageNumber,
  Enemy,
  Particle,
  PlaceableItem,
  Tower,
} from '../../game-types';
import type {
  GameState,
  GameSystem,
  SystemUpdateResult,
} from '../../store/types';
import {
  calculateDamage,
  calculateReward,
  calculateScoreWithCombo,
  getAdjacentTowerCount,
  shouldResetCombo,
} from '../../utils/calculations';
import { getDamageNumberColor, getEnemyColorRgb } from '../../utils/rendering';
import type { ParticlePool } from './particle-system';

export class CollisionSystem implements GameSystem {
  private particlePool: ParticlePool | null = null;

  setParticlePool(pool: ParticlePool): void {
    this.particlePool = pool;
  }
  // Track damage cooldowns per enemy per trap (for persistent traps like Grid Bug)
  private trapDamageCooldowns = new Map<number, Map<number, number>>(); // enemyId -> trapId -> lastDamageTime

  update(
    state: GameState,
    _deltaTime: number,
    timestamp: number,
  ): SystemUpdateResult {
    const {
      spawnedEnemies,
      projectiles,
      placeables,
      towers,
      runUpgrade,
      combo,
      lastKillTime,
    } = state;

    let newEnemies = [...spawnedEnemies];
    const newParticles: Particle[] = [];
    const newDamageNumbers: DamageNumber[] = [];
    let newPlaceables = [...placeables];

    let moneyGained = 0;
    let scoreGained = 0;
    let comboIncrement = 0;
    let shouldResetComboFlag = false;
    let damageNumberIdCounter = state.damageNumberIdCounter;
    let particleIdCounter = state.particleIdCounter;

    // Check placeable collisions first (unified system)
    const placeableCollisionResult = this.checkPlaceableCollisions(
      newEnemies,
      newPlaceables,
      timestamp,
      combo,
      lastKillTime,
      state,
      damageNumberIdCounter,
      particleIdCounter,
    );

    newEnemies = placeableCollisionResult.enemies;
    newPlaceables = placeableCollisionResult.placeables;
    newParticles.push(...placeableCollisionResult.particles);
    newDamageNumbers.push(...placeableCollisionResult.damageNumbers);
    moneyGained += placeableCollisionResult.moneyGained;
    scoreGained += placeableCollisionResult.scoreGained;
    comboIncrement += placeableCollisionResult.comboIncrement;
    if (placeableCollisionResult.shouldResetCombo) shouldResetComboFlag = true;
    damageNumberIdCounter = placeableCollisionResult.damageNumberIdCounter;
    particleIdCounter = placeableCollisionResult.particleIdCounter;

    // Check projectile collisions
    const projectileCollisionResult = this.checkProjectileCollisions(
      newEnemies,
      projectiles,
      towers,
      placeables,
      runUpgrade,
      timestamp,
      combo + comboIncrement,
      placeableCollisionResult.lastKillTime,
      state,
      damageNumberIdCounter,
      particleIdCounter,
    );

    newEnemies = projectileCollisionResult.enemies;
    newParticles.push(...projectileCollisionResult.particles);
    newDamageNumbers.push(...projectileCollisionResult.damageNumbers);
    moneyGained += projectileCollisionResult.moneyGained;
    scoreGained += projectileCollisionResult.scoreGained;
    comboIncrement += projectileCollisionResult.comboIncrement;
    if (projectileCollisionResult.shouldResetCombo) shouldResetComboFlag = true;
    damageNumberIdCounter = projectileCollisionResult.damageNumberIdCounter;
    particleIdCounter = projectileCollisionResult.particleIdCounter;

    const result: SystemUpdateResult = {
      placeables: newPlaceables,
      projectiles: projectileCollisionResult.projectiles,
      spawnedEnemies: newEnemies,
    };

    if (newParticles.length > 0) {
      result.particles = [...state.particles, ...newParticles];
      result.particleIdCounter = particleIdCounter;
    }

    if (newDamageNumbers.length > 0) {
      result.damageNumbers = [...state.damageNumbers, ...newDamageNumbers];
      result.damageNumberIdCounter = damageNumberIdCounter;
    }

    if (moneyGained > 0) {
      result.money = state.money + moneyGained;
    }

    if (scoreGained > 0) {
      result.score = state.score + scoreGained;
    }

    if (comboIncrement > 0 || shouldResetComboFlag) {
      result.combo = shouldResetComboFlag
        ? comboIncrement
        : combo + comboIncrement;
    }

    if (projectileCollisionResult.lastKillTime > lastKillTime) {
      result.lastKillTime = projectileCollisionResult.lastKillTime;
    }

    return result;
  }

  private checkPlaceableCollisions(
    enemies: Enemy[],
    placeables: PlaceableItem[],
    timestamp: number,
    combo: number,
    lastKillTime: number,
    state: GameState,
    damageNumberIdCounter: number,
    particleIdCounter: number,
  ) {
    let newEnemies = enemies;
    let newPlaceables = placeables;
    const particles: Particle[] = [];
    const damageNumbers: DamageNumber[] = [];
    let moneyGained = 0;
    let scoreGained = 0;
    let comboIncrement = 0;
    let shouldResetComboFlag = false;
    let newLastKillTime = lastKillTime;

    // Only process trap items (powerups don't have collisions)
    const traps = placeables.filter((item) => item.category === 'trap');

    for (const enemy of newEnemies) {
      const enemyCellX = Math.floor(enemy.position.x);
      const enemyCellY = Math.floor(enemy.position.y);

      // Find traps at enemy's position
      const hitTraps = traps.filter((trap) =>
        trap.positions.some(
          (pos) =>
            Math.floor(pos.x) === enemyCellX &&
            Math.floor(pos.y) === enemyCellY,
        ),
      );

      for (const trap of hitTraps) {
        const config = TRAP_CONFIGS[trap.type as keyof typeof TRAP_CONFIGS];
        if (!config) continue;

        // Check if trap should damage on entry
        if (config.behavior.damageOnEntry) {
          // For persistent traps, check cooldown per enemy
          if (config.behavior.persistent) {
            const enemyCooldowns =
              this.trapDamageCooldowns.get(enemy.id) ?? new Map();
            const lastDamageTime = enemyCooldowns.get(trap.id);

            // Only damage if enemy just entered (no previous damage time) or enough time has passed
            // For Grid Bug, we want to damage once per cell entry, so we check if enemy moved to a new cell
            if (
              lastDamageTime === undefined ||
              timestamp - lastDamageTime > 100
            ) {
              // Update cooldown
              enemyCooldowns.set(trap.id, timestamp);
              this.trapDamageCooldowns.set(enemy.id, enemyCooldowns);

              // Apply damage
              const damage = trap.damage;
              damageNumbers.push({
                color: getDamageNumberColor(trap.type),
                id: damageNumberIdCounter + damageNumbers.length,
                life: 60,
                position: { ...enemy.position },
                value: Math.floor(damage),
              });

              const newHealth = enemy.health - damage;
              if (newHealth <= 0) {
                // Enemy killed
                newEnemies = newEnemies.filter((e) => e.id !== enemy.id);
                this.trapDamageCooldowns.delete(enemy.id);

                const reward = calculateReward({
                  activeWavePowerUps: state.activeWavePowerUps,
                  baseReward: enemy.reward,
                  combo: 0,
                  runUpgrade: state.runUpgrade,
                });
                moneyGained += reward;

                if (shouldResetCombo(newLastKillTime, timestamp)) {
                  shouldResetComboFlag = true;
                  comboIncrement = 1;
                } else {
                  comboIncrement++;
                }
                newLastKillTime = timestamp;

                const effectiveCombo = shouldResetComboFlag
                  ? 1
                  : combo + comboIncrement;
                scoreGained += calculateScoreWithCombo(
                  enemy.reward,
                  effectiveCombo,
                );
              } else {
                newEnemies = newEnemies.map((e) =>
                  e.id === enemy.id ? { ...e, health: newHealth } : e,
                );
              }
            }
          } else {
            // Non-persistent trap (like landmine) - remove after use
            newPlaceables = newPlaceables.filter((p) => p.id !== trap.id);

            // Create explosion particles
            if (this.particlePool && trap.positions.length > 0) {
              const trapPos = trap.positions[0];
              if (trapPos) {
                for (let i = 0; i < PARTICLE_COUNT_LANDMINE; i++) {
                  const angle = (Math.PI * 2 * i) / PARTICLE_COUNT_LANDMINE;
                  const speed = 0.08 + Math.random() * 0.05;
                  this.particlePool.spawn(
                    trapPos.x,
                    trapPos.y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    40,
                    'rgb(239, 68, 68)',
                  );
                }
              }
            }

            const damage = trap.damage;
            damageNumbers.push({
              color: getDamageNumberColor(trap.type),
              id: damageNumberIdCounter + damageNumbers.length,
              life: 60,
              position: { ...enemy.position },
              value: Math.floor(damage),
            });

            const newHealth = enemy.health - damage;
            if (newHealth <= 0) {
              newEnemies = newEnemies.filter((e) => e.id !== enemy.id);

              const reward = calculateReward({
                activeWavePowerUps: state.activeWavePowerUps,
                baseReward: enemy.reward,
                combo: 0,
                runUpgrade: state.runUpgrade,
              });
              moneyGained += reward;

              if (shouldResetCombo(newLastKillTime, timestamp)) {
                shouldResetComboFlag = true;
                comboIncrement = 1;
              } else {
                comboIncrement++;
              }
              newLastKillTime = timestamp;

              const effectiveCombo = shouldResetComboFlag
                ? 1
                : combo + comboIncrement;
              scoreGained += calculateScoreWithCombo(
                enemy.reward,
                effectiveCombo,
              );
            } else {
              newEnemies = newEnemies.map((e) =>
                e.id === enemy.id ? { ...e, health: newHealth } : e,
              );
            }
          }
        }
      }
    }

    // Clean up cooldowns for enemies that no longer exist
    const existingEnemyIds = new Set(newEnemies.map((e) => e.id));
    for (const enemyId of this.trapDamageCooldowns.keys()) {
      if (!existingEnemyIds.has(enemyId)) {
        this.trapDamageCooldowns.delete(enemyId);
      }
    }

    return {
      comboIncrement,
      damageNumberIdCounter: damageNumberIdCounter + damageNumbers.length,
      damageNumbers,
      enemies: newEnemies,
      lastKillTime: newLastKillTime,
      moneyGained,
      particleIdCounter: particleIdCounter + particles.length,
      particles,
      placeables: newPlaceables,
      scoreGained,
      shouldResetCombo: shouldResetComboFlag,
    };
  }

  private checkProjectileCollisions(
    enemies: Enemy[],
    projectiles: GameState['projectiles'],
    towers: Tower[],
    placeables: PlaceableItem[],
    runUpgrade: GameState['runUpgrade'],
    timestamp: number,
    combo: number,
    lastKillTime: number,
    state: GameState,
    damageNumberIdCounter: number,
    particleIdCounter: number,
  ) {
    let newEnemies = enemies;
    const particles: Particle[] = [];
    const damageNumbers: DamageNumber[] = [];
    let moneyGained = 0;
    let scoreGained = 0;
    let comboIncrement = 0;
    let shouldResetComboFlag = false;
    let newLastKillTime = lastKillTime;
    const updatedProjectiles: typeof projectiles = [];
    const projectilesToRemove = new Set<number>();

    // Enemy hitbox radius (approximate)
    const ENEMY_HITBOX_RADIUS = 0.4;

    // For each projectile, check for collisions with enemies
    for (const projectile of projectiles) {
      // Skip projectiles that have no penetration remaining
      if (projectile.penetrationRemaining < 0) {
        projectilesToRemove.add(projectile.id);
        continue;
      }

      // Find the tower that shot this projectile
      const tower = towers.find(
        (t) =>
          t.position.x === projectile.sourcePosition.x &&
          t.position.y === projectile.sourcePosition.y,
      );

      if (!tower) {
        projectilesToRemove.add(projectile.id);
        continue;
      }

      // Calculate damage once per projectile
      const adjacentCount = getAdjacentTowerCount(tower.position, towers);
      const powerup = placeables.find(
        (p) =>
          p.category === 'powerup' &&
          p.positions.some(
            (pos) => pos.x === tower.position.x && pos.y === tower.position.y,
          ),
      );

      const damage = calculateDamage({
        activeWavePowerUps: state.activeWavePowerUps,
        adjacentTowerCount: adjacentCount,
        powerup:
          powerup && powerup.category === 'powerup' ? powerup : undefined,
        runUpgrade,
        tower,
      });

      // Check for collisions with enemies along the projectile's path
      // We check distance from projectile position to enemy position
      let projectileHitEnemy = false;
      let newPenetrationRemaining = projectile.penetrationRemaining;
      const newHitEnemyIds = new Set(projectile.hitEnemyIds);

      for (const enemy of newEnemies) {
        // Skip if this enemy was already hit by this projectile
        if (newHitEnemyIds.has(enemy.id)) continue;

        // Calculate distance from projectile to enemy
        const distToEnemy = Math.sqrt(
          (projectile.position.x - enemy.position.x) ** 2 +
            (projectile.position.y - enemy.position.y) ** 2,
        );

        // Check if projectile is close enough to hit enemy
        if (distToEnemy <= ENEMY_HITBOX_RADIUS) {
          projectileHitEnemy = true;
          newHitEnemyIds.add(enemy.id);

          // Apply damage to enemy
          const newHealth = enemy.health - damage;

          damageNumbers.push({
            color: getDamageNumberColor(tower.type),
            id: damageNumberIdCounter + damageNumbers.length,
            life: 60,
            position: { ...enemy.position },
            value: Math.floor(damage),
          });

          if (newHealth <= 0) {
            // Enemy killed
            newEnemies = newEnemies.filter((e) => e.id !== enemy.id);

            // Update combo
            if (shouldResetCombo(newLastKillTime, timestamp)) {
              shouldResetComboFlag = true;
              comboIncrement = 1;
            } else {
              comboIncrement++;
            }
            newLastKillTime = timestamp;

            // Calculate rewards
            const reward = calculateReward({
              activeWavePowerUps: state.activeWavePowerUps,
              baseReward: enemy.reward,
              combo: 0,
              runUpgrade,
            });
            moneyGained += reward;

            const effectiveCombo = shouldResetComboFlag
              ? 1
              : combo + comboIncrement;
            scoreGained += calculateScoreWithCombo(
              enemy.reward,
              effectiveCombo,
            );

            // Create death particles with varied lifetimes and sizes
            if (this.particlePool) {
              const enemyColor = getEnemyColorRgb(enemy.type);
              // Spawn more particles for more explosive feel
              const particleCount = PARTICLE_COUNT_ENEMY_KILL * 2;
              for (let i = 0; i < particleCount; i++) {
                // More random spread for explosive burst
                const angle = Math.random() * Math.PI * 2;
                // Fast initial burst speed (0.2 to 0.4) for explosive expansion
                const speed = 0.2 + Math.random() * 0.2;
                // Short lifetime (10-25 frames) for quick dissipation
                const lifetime = 10 + Math.random() * 15;
                this.particlePool.spawn(
                  enemy.position.x,
                  enemy.position.y,
                  Math.cos(angle) * speed,
                  Math.sin(angle) * speed,
                  lifetime,
                  enemyColor,
                );
              }
            }
          } else {
            // Enemy damaged but not killed
            newEnemies = newEnemies.map((e) =>
              e.id === enemy.id
                ? {
                    ...e,
                    health: newHealth,
                    slowed: tower.type === 'slow',
                  }
                : e,
            );
          }

          // Decrement penetration remaining
          newPenetrationRemaining--;

          // If penetration is exhausted, stop checking for more hits
          if (newPenetrationRemaining < 0) {
            break;
          }
        }
      }

      // Handle splash damage for bomb towers (only on first hit)
      if (tower.type === 'bomb' && projectileHitEnemy) {
        // Find the first enemy that was hit (for splash center)
        const firstHitEnemyId = Array.from(newHitEnemyIds)[0];
        const firstHitEnemy = newEnemies.find((e) => e.id === firstHitEnemyId);

        if (firstHitEnemy) {
          newEnemies = newEnemies.map((e) => {
            // Skip enemies already hit by the projectile
            if (newHitEnemyIds.has(e.id)) return e;

            const dist = Math.sqrt(
              (e.position.x - firstHitEnemy.position.x) ** 2 +
                (e.position.y - firstHitEnemy.position.y) ** 2,
            );

            if (dist <= 1.5) {
              const splashDamage = damage * 0.5;
              const newHealth = e.health - splashDamage;

              damageNumbers.push({
                color: getDamageNumberColor(tower.type),
                id: damageNumberIdCounter + damageNumbers.length,
                life: 60,
                position: { ...e.position },
                value: Math.floor(splashDamage),
              });

              if (newHealth <= 0) {
                newEnemies = newEnemies.filter((en) => en.id !== e.id);

                // Update combo for splash kill
                if (shouldResetCombo(newLastKillTime, timestamp)) {
                  shouldResetComboFlag = true;
                  comboIncrement = 1;
                } else {
                  comboIncrement++;
                }
                newLastKillTime = timestamp;

                const reward = calculateReward({
                  activeWavePowerUps: state.activeWavePowerUps,
                  baseReward: e.reward,
                  combo: 0,
                  runUpgrade,
                });
                moneyGained += reward;

                const effectiveCombo = shouldResetComboFlag
                  ? 1
                  : combo + comboIncrement;
                scoreGained += calculateScoreWithCombo(
                  e.reward,
                  effectiveCombo,
                );

                // Create death particles with varied lifetimes and sizes
                if (this.particlePool) {
                  const enemyColor = getEnemyColorRgb(e.type);
                  // Spawn more particles for more explosive feel
                  const particleCount = PARTICLE_COUNT_ENEMY_KILL * 2;
                  for (let i = 0; i < particleCount; i++) {
                    // More random spread for explosive burst
                    const angle = Math.random() * Math.PI * 2;
                    // Fast initial burst speed (0.2 to 0.4) for explosive expansion
                    const speed = 0.2 + Math.random() * 0.2;
                    // Short lifetime (10-25 frames) for quick dissipation
                    const lifetime = 10 + Math.random() * 15;
                    this.particlePool.spawn(
                      e.position.x,
                      e.position.y,
                      Math.cos(angle) * speed,
                      Math.sin(angle) * speed,
                      lifetime,
                      enemyColor,
                    );
                  }
                }
              } else {
                return { ...e, health: newHealth };
              }
            }

            return e;
          });
        }
      }

      // Update projectile: continue if penetration remaining, remove if exhausted
      if (newPenetrationRemaining < 0) {
        projectilesToRemove.add(projectile.id);
      } else {
        updatedProjectiles.push({
          ...projectile,
          hitEnemyIds: newHitEnemyIds,
          penetrationRemaining: newPenetrationRemaining,
        });
      }
    }

    // Filter out dead enemies
    newEnemies = newEnemies.filter((e) => e.health > 0);

    // Keep projectiles that weren't removed
    const remainingProjectiles = updatedProjectiles.filter(
      (p) => !projectilesToRemove.has(p.id),
    );

    return {
      comboIncrement,
      damageNumberIdCounter: damageNumberIdCounter + damageNumbers.length,
      damageNumbers,
      enemies: newEnemies,
      lastKillTime: newLastKillTime,
      moneyGained,
      particleIdCounter: particleIdCounter + particles.length,
      particles,
      projectiles: remainingProjectiles,
      scoreGained,
      shouldResetCombo: shouldResetComboFlag,
    };
  }
}
