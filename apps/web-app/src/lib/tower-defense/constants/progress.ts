import type { PlayerProgress } from '../game-types';

export const DEFAULT_PROGRESS: PlayerProgress = {
  mapRatings: {},
  techPoints: 0,
  upgrades: {
    gridBugDamage: 0,
    gridBugFrequency: 0,
    landmineDamage: 0,
    landmineFrequency: 0,
    powerNodeFrequency: 0,
    powerNodePersistence: 0,
    powerNodePotency: 0,
    streamFrequency: 0,
    streamLength: 0,
  },
};

export function createDefaultProgress(): PlayerProgress {
  return {
    mapRatings: {},
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
    mapRatings: progress.mapRatings ?? {},
    techPoints: progress.techPoints ?? DEFAULT_PROGRESS.techPoints,
    upgrades: {
      ...DEFAULT_PROGRESS.upgrades,
      ...progress.upgrades,
    },
  };
}
