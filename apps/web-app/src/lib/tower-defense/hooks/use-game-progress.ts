import { useEffect, useState } from 'react';
import { DEFAULT_PROGRESS, withProgressDefaults } from '../constants/progress';
import { UPGRADES } from '../constants/upgrades';
import type { PlayerProgress, UpgradeType } from '../game-types';
import { updateEnergy } from '../utils/energy';

const STORAGE_KEY = 'grid_defense_progress';

export function useGameProgress() {
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    // Always start with default - load from localStorage in useEffect (client-side only)
    return withProgressDefaults(DEFAULT_PROGRESS);
  });

  // Load progress from localStorage on mount and update energy (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const normalized = withProgressDefaults(parsed);
        const updated = updateEnergy(normalized);
        setProgress(updated);
      } catch (e) {
        console.error('Failed to load progress', e);
      }
    }
  }, []);

  // Update energy periodically (every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => updateEnergy(prev));
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  // Save progress to localStorage whenever it changes (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
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

  const recordMapRating = (mapId: string, stars: 1 | 2 | 3) => {
    setProgress((prev) => {
      const currentRating = prev.mapRatings[mapId] ?? 0;
      // Only update if the new rating is better than the current one
      if (stars > currentRating) {
        return {
          ...prev,
          mapRatings: {
            ...prev.mapRatings,
            [mapId]: stars,
          },
        };
      }
      return prev;
    });
  };

  const addEnergy = (amount: number) => {
    setProgress((prev) => {
      const updated = updateEnergy(prev);
      const maxEnergy = updated.maxEnergy;
      return {
        ...updated,
        energy: Math.min(updated.energy + amount, maxEnergy),
      };
    });
  };

  const spendEnergy = (amount: number): boolean => {
    let success = false;
    setProgress((prev) => {
      const updated = updateEnergy(prev);
      if (updated.energy >= amount) {
        success = true;
        return {
          ...updated,
          energy: updated.energy - amount,
        };
      }
      return updated;
    });
    return success;
  };

  return {
    addEnergy,
    earnTechPoints,
    progress,
    purchaseUpgrade,
    recordMapRating,
    spendEnergy,
  };
}
