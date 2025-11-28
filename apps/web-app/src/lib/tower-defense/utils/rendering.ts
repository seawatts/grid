import { ENEMY_STATS } from '../game-constants';
import type {
  EnemyType,
  PlaceableItem,
  TowerType,
  TrapType,
} from '../game-types';
import { isPowerupItem, isTrapItem } from '../game-types';

export interface TowerColors {
  background: string;
  border: string;
  boxShadow: string;
}

export function getTowerColors(type: TowerType): TowerColors {
  const colorMap: Record<TowerType, TowerColors> = {
    basic: {
      background: 'rgba(6, 182, 212, 0.3)',
      border: 'rgb(6, 182, 212)',
      boxShadow: 'rgba(6, 182, 212, 0.5)',
    },
    bomb: {
      background: 'rgba(236, 72, 153, 0.3)',
      border: 'rgb(236, 72, 153)',
      boxShadow: 'rgba(236, 72, 153, 0.5)',
    },
    slow: {
      background: 'rgba(168, 85, 247, 0.3)',
      border: 'rgb(168, 85, 247)',
      boxShadow: 'rgba(168, 85, 247, 0.5)',
    },
    sniper: {
      background: 'rgba(34, 197, 94, 0.3)',
      border: 'rgb(34, 197, 94)',
      boxShadow: 'rgba(34, 197, 94, 0.5)',
    },
  };

  return colorMap[type];
}

export function getProjectileColor(type: TowerType): string {
  const colorMap: Record<TowerType, string> = {
    basic: 'rgb(6, 182, 212)',
    bomb: 'rgb(236, 72, 153)',
    slow: 'rgb(168, 85, 247)',
    sniper: 'rgb(34, 197, 94)',
  };

  return colorMap[type];
}

export function getDamageNumberColor(
  type: TowerType | TrapType | 'landmine',
): string {
  if (type === 'landmine') {
    return 'rgb(239, 68, 68)';
  }

  // Trap colors
  const trapColors: Record<TrapType, string> = {
    gridBug: 'rgb(6, 182, 212)', // Cyan for Tron theme
    landmine: 'rgb(239, 68, 68)',
    stream: 'rgb(168, 85, 247)', // Purple for Tron theme
  };

  if (trapColors[type as TrapType]) {
    return trapColors[type as TrapType];
  }

  // Tower colors
  const colorMap: Record<TowerType, string> = {
    basic: 'rgb(6, 182, 212)',
    bomb: 'rgb(236, 72, 153)',
    slow: 'rgb(168, 85, 247)',
    sniper: 'rgb(34, 197, 94)',
  };

  return colorMap[type as TowerType] ?? 'rgb(255, 255, 255)';
}

export function getEnemyColor(type: EnemyType): string {
  return ENEMY_STATS[type].color;
}

export function getEnemySize(type: EnemyType): number {
  return ENEMY_STATS[type].size;
}

export function getTowerInsetSize(level: number): number {
  if (level === 1) return 0;
  if (level === 2) return 25;
  return 12.5;
}

export interface TierInfo {
  tier: number;
  color: string;
  glowColor: string;
  icon: string;
}

export function getPowerupTier(boost: number): TierInfo {
  if (boost > 2.0) {
    return {
      color: 'rgb(236, 72, 153)',
      glowColor: 'rgba(236, 72, 153, 0.6)',
      icon: '⚡⚡',
      tier: 3,
    };
  }
  if (boost > 1.5) {
    return {
      color: 'rgb(250, 204, 21)',
      glowColor: 'rgba(250, 204, 21, 0.6)',
      icon: '⚡',
      tier: 2,
    };
  }
  return {
    color: 'rgb(250, 204, 21)',
    glowColor: 'rgba(250, 204, 21, 0.6)',
    icon: '⚡',
    tier: 1,
  };
}

export function getLandmineTier(damage: number): TierInfo {
  if (damage > 300) {
    return {
      color: 'rgb(168, 85, 247)',
      glowColor: 'rgba(168, 85, 247, 0.6)',
      icon: '💣',
      tier: 3,
    };
  }
  if (damage > 100) {
    return {
      color: 'rgb(239, 68, 68)',
      glowColor: 'rgba(239, 68, 68, 0.6)',
      icon: '💣',
      tier: 2,
    };
  }
  return {
    color: 'rgb(239, 68, 68)',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    icon: '💣',
    tier: 1,
  };
}

export function getGridBugTier(damage: number): TierInfo {
  // Tron-themed Grid Bug visuals
  if (damage > 100) {
    return {
      color: 'rgb(6, 182, 212)', // Cyan
      glowColor: 'rgba(6, 182, 212, 0.8)',
      icon: '◉', // Grid pattern icon
      tier: 3,
    };
  }
  if (damage > 50) {
    return {
      color: 'rgb(34, 211, 238)', // Light cyan
      glowColor: 'rgba(34, 211, 238, 0.6)',
      icon: '◉',
      tier: 2,
    };
  }
  return {
    color: 'rgb(6, 182, 212)',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    icon: '◉',
    tier: 1,
  };
}

export function getStreamTier(): TierInfo {
  // Tron-themed Stream visuals
  return {
    color: 'rgb(168, 85, 247)', // Purple
    glowColor: 'rgba(168, 85, 247, 0.6)',
    icon: '━', // Stream/line icon
    tier: 1,
  };
}

/**
 * Get tier information for a placeable item
 */
export function getPlaceableTier(item: PlaceableItem): TierInfo | null {
  if (isTrapItem(item)) {
    switch (item.type) {
      case 'landmine':
        return getLandmineTier(item.damage);
      case 'gridBug':
        return getGridBugTier(item.damage);
      case 'stream':
        return getStreamTier();
      default:
        return null;
    }
  }

  if (isPowerupItem(item)) {
    switch (item.type) {
      case 'powerNode':
        return getPowerupTier(item.boost);
      default:
        return null;
    }
  }

  return null;
}
