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
import { getDamageNumberColor } from '../../utils/rendering';
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
      landmines,
      towers,
      powerups,
      runUpgrade,
      combo,
      lastKillTime,
    } = state;

    let newEnemies = [...spawnedEnemies];
    const newParticles: Particle[] = [];
    const newDamageNumbers: DamageNumber[] = [];
    let newPlaceables = [...placeables];
    let newLandmines = [...landmines];

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

    // Check legacy landmine collisions (for backward compatibility)
    const landmineCollisionResult = this.checkLandmineCollisions(
      newEnemies,
      newLandmines,
      timestamp,
      combo + comboIncrement,
      placeableCollisionResult.lastKillTime,
      state,
      damageNumberIdCounter,
      particleIdCounter,
    );

    newEnemies = landmineCollisionResult.enemies;
    newLandmines = landmineCollisionResult.landmines;
    newParticles.push(...landmineCollisionResult.particles);
    newDamageNumbers.push(...landmineCollisionResult.damageNumbers);
    moneyGained += landmineCollisionResult.moneyGained;
    scoreGained += landmineCollisionResult.scoreGained;
    comboIncrement += landmineCollisionResult.comboIncrement;
    if (landmineCollisionResult.shouldResetCombo) shouldResetComboFlag = true;
    damageNumberIdCounter = landmineCollisionResult.damageNumberIdCounter;
    particleIdCounter = landmineCollisionResult.particleIdCounter;

    // Check projectile collisions
    const projectileCollisionResult = this.checkProjectileCollisions(
      newEnemies,
      projectiles,
      towers,
      powerups,
      runUpgrade,
      timestamp,
      combo + comboIncrement,
      landmineCollisionResult.lastKillTime,
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
      landmines: newLandmines,
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

  private checkLandmineCollisions(
    enemies: Enemy[],
    landmines: GameState['landmines'],
    timestamp: number,
    combo: number,
    lastKillTime: number,
    state: GameState,
    damageNumberIdCounter: number,
    particleIdCounter: number,
  ) {
    let newEnemies = enemies;
    let newLandmines = landmines;
    const particles: Particle[] = [];
    const damageNumbers: DamageNumber[] = [];
    let moneyGained = 0;
    let scoreGained = 0;
    let comboIncrement = 0;
    let shouldResetComboFlag = false;
    let newLastKillTime = lastKillTime;

    for (const enemy of newEnemies) {
      const hitLandmine = newLandmines.find(
        (mine) =>
          Math.floor(enemy.position.x) === mine.position.x &&
          Math.floor(enemy.position.y) === mine.position.y,
      );

      if (hitLandmine) {
        // Remove landmine
        newLandmines = newLandmines.filter((m) => m.id !== hitLandmine.id);

        // Create explosion particles
        if (this.particlePool) {
          for (let i = 0; i < PARTICLE_COUNT_LANDMINE; i++) {
            const angle = (Math.PI * 2 * i) / PARTICLE_COUNT_LANDMINE;
            const speed = 0.08 + Math.random() * 0.05;
            this.particlePool.spawn(
              hitLandmine.position.x,
              hitLandmine.position.y,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              40,
              'rgb(239, 68, 68)',
            );
          }
        }

        damageNumbers.push({
          color: getDamageNumberColor('landmine'),
          id: damageNumberIdCounter + damageNumbers.length,
          life: 60,
          position: { ...enemy.position },
          value: Math.floor(hitLandmine.damage),
        });

        // Apply damage
        const newHealth = enemy.health - hitLandmine.damage;
        if (newHealth <= 0) {
          // Enemy killed
          newEnemies = newEnemies.filter((e) => e.id !== enemy.id);

          const reward = calculateReward({
            activeWavePowerUps: state.activeWavePowerUps,
            baseReward: enemy.reward,
            combo: 0, // Landmine doesn't get combo multiplier on reward
            runUpgrade: state.runUpgrade,
          });
          moneyGained += reward;

          // Update combo
          if (shouldResetCombo(lastKillTime, timestamp)) {
            shouldResetComboFlag = true;
            comboIncrement = 1;
          } else {
            comboIncrement++;
          }
          newLastKillTime = timestamp;

          // Calculate score with combo
          const effectiveCombo = shouldResetComboFlag
            ? 1
            : combo + comboIncrement;
          scoreGained += calculateScoreWithCombo(enemy.reward, effectiveCombo);
        } else {
          // Enemy damaged but not killed
          newEnemies = newEnemies.map((e) =>
            e.id === enemy.id ? { ...e, health: newHealth } : e,
          );
        }
      }
    }

    return {
      comboIncrement,
      damageNumberIdCounter: damageNumberIdCounter + damageNumbers.length,
      damageNumbers,
      enemies: newEnemies,
      landmines: newLandmines,
      lastKillTime: newLastKillTime,
      moneyGained,
      particleIdCounter: particleIdCounter + particles.length,
      particles,
      scoreGained,
      shouldResetCombo: shouldResetComboFlag,
    };
  }

  private checkProjectileCollisions(
    enemies: Enemy[],
    projectiles: GameState['projectiles'],
    towers: Tower[],
    powerups: GameState['powerups'],
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
    const projectilesProcessed = new Set<number>();

    // For each projectile that just reached its target
    for (const projectile of projectiles) {
      const dist = Math.sqrt(
        (projectile.position.x - projectile.target.x) ** 2 +
          (projectile.position.y - projectile.target.y) ** 2,
      );

      // Only process collisions for projectiles that reached their target
      if (dist > 0.2) continue;

      // Mark projectile for removal
      projectilesProcessed.add(projectile.id);

      // Find the tower that shot this projectile
      const tower = towers.find(
        (t) =>
          t.position.x === projectile.sourcePosition.x &&
          t.position.y === projectile.sourcePosition.y,
      );

      if (!tower) continue;

      // Find target enemy either by tracking ID or fallback to position match
      const targetEnemy =
        projectile.targetEnemyId !== undefined
          ? newEnemies.find((e) => e.id === projectile.targetEnemyId)
          : newEnemies.find(
              (e) =>
                Math.abs(e.position.x - projectile.target.x) < 0.5 &&
                Math.abs(e.position.y - projectile.target.y) < 0.5,
            );

      if (!targetEnemy) continue;

      // Calculate damage
      const adjacentCount = getAdjacentTowerCount(tower.position, towers);
      const powerup = powerups.find(
        (p) =>
          p.position.x === tower.position.x &&
          p.position.y === tower.position.y,
      );

      const damage = calculateDamage({
        activeWavePowerUps: state.activeWavePowerUps,
        adjacentTowerCount: adjacentCount,
        powerup,
        runUpgrade,
        tower,
      });

      // Apply damage to primary target
      const killedEnemies: Enemy[] = [];
      newEnemies = newEnemies.map((e) => {
        if (e.id === targetEnemy.id) {
          const newHealth = e.health - damage;

          damageNumbers.push({
            color: getDamageNumberColor(tower.type),
            id: damageNumberIdCounter + damageNumbers.length,
            life: 60,
            position: { ...e.position },
            value: Math.floor(damage),
          });

          if (newHealth <= 0) {
            killedEnemies.push(e);
            return { ...e, health: 0 }; // Will be filtered out
          }

          return {
            ...e,
            health: newHealth,
            slowed: tower.type === 'slow',
          };
        }
        return e;
      });

      // Handle splash damage for bomb towers
      if (tower.type === 'bomb') {
        newEnemies = newEnemies.map((e) => {
          if (e.id === targetEnemy.id) return e; // Already handled

          const dist = Math.sqrt(
            (e.position.x - targetEnemy.position.x) ** 2 +
              (e.position.y - targetEnemy.position.y) ** 2,
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
              killedEnemies.push(e);
              return { ...e, health: 0 };
            }

            return { ...e, health: newHealth };
          }

          return e;
        });
      }

      // Process killed enemies
      for (const enemy of killedEnemies) {
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
          combo: 0, // Reward doesn't scale with combo
          runUpgrade,
        });
        moneyGained += reward;

        const effectiveCombo = shouldResetComboFlag
          ? 1
          : combo + comboIncrement;
        scoreGained += calculateScoreWithCombo(enemy.reward, effectiveCombo);

        // Create death particles
        if (this.particlePool) {
          for (let i = 0; i < PARTICLE_COUNT_ENEMY_KILL; i++) {
            const angle =
              (Math.PI * 2 * i) / PARTICLE_COUNT_ENEMY_KILL +
              Math.random() * 0.5;
            const speed = 0.05 + Math.random() * 0.05;
            this.particlePool.spawn(
              enemy.position.x,
              enemy.position.y,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              60,
              'rgb(6, 182, 212)',
            );
          }
        }
      }

      // Filter out dead enemies
      newEnemies = newEnemies.filter((e) => e.health > 0);
    }

    // Filter out projectiles that hit their targets
    const remainingProjectiles = projectiles.filter(
      (p) => !projectilesProcessed.has(p.id),
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
