import { useEffect, useState } from 'react';
import { UPGRADES } from '../constants/upgrades';
import type { PlayerProgress, UpgradeType } from '../game-types';

const DEFAULT_PROGRESS: PlayerProgress = {
  techPoints: 0,
  upgrades: {
    landmineDamage: 0,
    landmineFrequency: 0,
    powerNodeFrequency: 0,
    powerNodePotency: 0,
  },
};

const STORAGE_KEY = 'grid_defense_progress';

export function useGameProgress() {
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProgress({ ...DEFAULT_PROGRESS, ...parsed });
      } catch (e) {
        console.error('Failed to load progress', e);
      }
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const purchaseUpgrade = (upgradeId: UpgradeType) => {
    const upgrade = UPGRADES[upgradeId];
    if (!upgrade) return;

    const currentLevel = progress.upgrades[upgradeId] || 0;

    if (currentLevel >= upgrade.maxLevel) return;

    const cost = upgrade.costs[currentLevel];
    if (!cost || progress.techPoints < cost) return;

    setProgress((prev) => ({
      ...prev,
      techPoints: prev.techPoints - cost,
      upgrades: {
        ...prev.upgrades,
        [upgradeId]: currentLevel + 1,
      },
    }));
  };

  const earnTechPoints = (amount: number) => {
    setProgress((prev) => ({
      ...prev,
      techPoints: prev.techPoints + amount,
    }));
  };

  return {
    earnTechPoints,
    progress,
    purchaseUpgrade,
  };
}
