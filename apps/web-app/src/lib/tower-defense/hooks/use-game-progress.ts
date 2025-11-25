import { useEffect, useState } from 'react';
import { DEFAULT_PROGRESS, withProgressDefaults } from '../constants/progress';
import { UPGRADES } from '../constants/upgrades';
import type { PlayerProgress, UpgradeType } from '../game-types';

const STORAGE_KEY = 'grid_defense_progress';

export function useGameProgress() {
  const [progress, setProgress] = useState<PlayerProgress>(
    withProgressDefaults(DEFAULT_PROGRESS),
  );

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const normalized = withProgressDefaults(parsed);
        setProgress(normalized);
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
