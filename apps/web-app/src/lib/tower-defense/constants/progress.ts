import type { PlayerProgress } from '../game-types';

export const DEFAULT_PROGRESS: PlayerProgress = {
  techPoints: 0,
  upgrades: {
    landmineDamage: 0,
    landmineFrequency: 0,
    powerNodeFrequency: 0,
    powerNodePersistence: 0,
    powerNodePotency: 0,
  },
};

export function createDefaultProgress(): PlayerProgress {
  return {
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
    techPoints: progress.techPoints ?? DEFAULT_PROGRESS.techPoints,
    upgrades: {
      ...DEFAULT_PROGRESS.upgrades,
      ...progress.upgrades,
    },
  };
}
