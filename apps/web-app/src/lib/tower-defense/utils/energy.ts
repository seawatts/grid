import { BASE_ENERGY_RECOVERY_RATE } from '../constants/balance';
import { UPGRADES } from '../constants/upgrades';
import type { PlayerProgress } from '../game-types';

/**
 * Gets the current energy recovery rate including upgrades
 */
export function getEnergyRecoveryRate(progress: PlayerProgress): number {
  const upgradeLevel = progress.upgrades.energyRecoveryRate || 0;
  const upgrade = UPGRADES.energyRecoveryRate;
  if (!upgrade) {
    return BASE_ENERGY_RECOVERY_RATE;
  }
  return upgrade.effects[upgradeLevel] ?? BASE_ENERGY_RECOVERY_RATE;
}

/**
 * Gets the current max energy including upgrades
 */
export function getMaxEnergy(progress: PlayerProgress): number {
  const upgradeLevel = progress.upgrades.maxEnergy || 0;
  const upgrade = UPGRADES.maxEnergy;
  if (!upgrade) {
    return progress.maxEnergy;
  }
  return upgrade.effects[upgradeLevel] ?? progress.maxEnergy;
}

/**
 * Checks if a new day has started since the last energy update
 * Compares the date (year, month, day) of lastEnergyUpdate with current date
 */
function isNewDay(lastUpdate: number): boolean {
  const lastDate = new Date(lastUpdate);
  const now = new Date();

  return (
    lastDate.getFullYear() !== now.getFullYear() ||
    lastDate.getMonth() !== now.getMonth() ||
    lastDate.getDate() !== now.getDate()
  );
}

/**
 * Calculates how much energy should be recovered since last update
 * Returns the amount of energy recovered (can be fractional)
 */
export function calculateEnergyRecovery(progress: PlayerProgress): number {
  const now = Date.now();
  const lastUpdate = progress.lastEnergyUpdate || now;
  const hoursElapsed = (now - lastUpdate) / (1000 * 60 * 60); // Convert ms to hours

  if (hoursElapsed <= 0) {
    return 0;
  }

  const recoveryRate = getEnergyRecoveryRate(progress);
  return hoursElapsed * recoveryRate;
}

/**
 * Updates energy based on time elapsed since last update
 * If a new day has started, energy is set to max instead of calculating recovery
 * Returns updated progress with energy recovered and timestamp updated
 */
export function updateEnergy(progress: PlayerProgress): PlayerProgress {
  const maxEnergy = getMaxEnergy(progress);
  const now = Date.now();
  const lastUpdate = progress.lastEnergyUpdate || now;

  // If it's a new day, set energy to max
  let newEnergy: number;
  if (isNewDay(lastUpdate)) {
    newEnergy = maxEnergy;
  } else {
    // Otherwise, calculate normal recovery
    const energyRecovered = calculateEnergyRecovery(progress);
    // Cap energy at max
    newEnergy = Math.min(progress.energy + energyRecovered, maxEnergy);
  }

  return {
    ...progress,
    energy: newEnergy,
    energyRecoveryRate: getEnergyRecoveryRate(progress),
    lastEnergyUpdate: now,
    maxEnergy,
  };
}

/**
 * Calculates time until next energy recovery (in milliseconds)
 * Returns 0 if energy is already at max
 */
export function getTimeUntilNextEnergy(progress: PlayerProgress): number {
  const maxEnergy = getMaxEnergy(progress);
  if (progress.energy >= maxEnergy) {
    return 0;
  }

  const recoveryRate = getEnergyRecoveryRate(progress);
  if (recoveryRate <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  // Calculate how much energy is needed
  const energyNeeded = 1; // Time until next full energy point
  const hoursNeeded = energyNeeded / recoveryRate;
  return hoursNeeded * 60 * 60 * 1000; // Convert to milliseconds
}
