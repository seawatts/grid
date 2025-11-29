import type { PlayerProgress } from '../game-types';
import { BASE_ENERGY_MAX, BASE_ENERGY_RECOVERY_RATE } from './balance';

export const DEFAULT_PROGRESS: PlayerProgress = {
  energy: BASE_ENERGY_MAX,
  energyRecoveryRate: BASE_ENERGY_RECOVERY_RATE,
  lastEnergyUpdate: Date.now(),
  mapRatings: {},
  maxEnergy: BASE_ENERGY_MAX,
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
};

export function createDefaultProgress(): PlayerProgress {
  return {
    energy: DEFAULT_PROGRESS.energy,
    energyRecoveryRate: DEFAULT_PROGRESS.energyRecoveryRate,
    lastEnergyUpdate: DEFAULT_PROGRESS.lastEnergyUpdate,
    mapRatings: {},
    maxEnergy: DEFAULT_PROGRESS.maxEnergy,
    techPoints: DEFAULT_PROGRESS.techPoints,
    upgrades: { ...DEFAULT_PROGRESS.upgrades },
  };
}

export function withProgressDefaults(
  progress?: PlayerProgress,
): PlayerProgress {
  if (!progress) {
    return createDefaultProgress();
  }

  return {
    energy: progress.energy ?? DEFAULT_PROGRESS.energy,
    energyRecoveryRate:
      progress.energyRecoveryRate ?? DEFAULT_PROGRESS.energyRecoveryRate,
    lastEnergyUpdate:
      progress.lastEnergyUpdate ?? DEFAULT_PROGRESS.lastEnergyUpdate,
    mapRatings: progress.mapRatings ?? {},
    maxEnergy: progress.maxEnergy ?? DEFAULT_PROGRESS.maxEnergy,
    techPoints: progress.techPoints ?? DEFAULT_PROGRESS.techPoints,
    upgrades: {
      ...DEFAULT_PROGRESS.upgrades,
      ...progress.upgrades,
    },
  };
}
