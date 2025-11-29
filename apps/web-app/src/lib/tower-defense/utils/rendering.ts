import { getRarityTierInfo } from '../constants/rarity';
import { ENEMY_STATS } from '../game-constants';
import type {
  EnemyType,
  PlaceableItem,
  PowerupRarity,
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
      background: 'var(--tower-basic-bg)',
      border: 'var(--tower-basic-border)',
      boxShadow: 'var(--tower-basic-shadow)',
    },
    bomb: {
      background: 'var(--tower-bomb-bg)',
      border: 'var(--tower-bomb-border)',
      boxShadow: 'var(--tower-bomb-shadow)',
    },
    slow: {
      background: 'var(--tower-slow-bg)',
      border: 'var(--tower-slow-border)',
      boxShadow: 'var(--tower-slow-shadow)',
    },
    sniper: {
      background: 'var(--tower-sniper-bg)',
      border: 'var(--tower-sniper-border)',
      boxShadow: 'var(--tower-sniper-shadow)',
    },
  };

  return colorMap[type];
}

export function getProjectileColor(type: TowerType): string {
  const colorMap: Record<TowerType, string> = {
    basic: 'var(--tower-basic-color)',
    bomb: 'var(--tower-bomb-color)',
    slow: 'var(--tower-slow-color)',
    sniper: 'var(--tower-sniper-color)',
  };

  return colorMap[type];
}

export function getDamageNumberColor(
  type: TowerType | TrapType | 'landmine',
): string {
  if (type === 'landmine') {
    return 'var(--trap-color)';
  }

  // Trap colors - all traps use red
  const trapColors: Record<TrapType, string> = {
    gridBug: 'var(--trap-color)',
    landmine: 'var(--trap-color)',
    stream: 'var(--trap-color)',
  };

  if (trapColors[type as TrapType]) {
    return trapColors[type as TrapType];
  }

  // Tower colors
  const colorMap: Record<TowerType, string> = {
    basic: 'var(--tower-basic-color)',
    bomb: 'var(--tower-bomb-color)',
    slow: 'var(--tower-slow-color)',
    sniper: 'var(--tower-sniper-color)',
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

/**
 * Get tier information for a powerup based on rarity (preferred) or boost value (fallback)
 */
export function getPowerupTier(
  boost: number,
  rarity?: PowerupRarity,
): TierInfo {
  // Use rarity if provided
  if (rarity) {
    const rarityTier = getRarityTierInfo(rarity);
    // Override colors to yellow for all powerups
    return {
      ...rarityTier,
      color: 'var(--powerup-color)',
      glowColor: 'var(--powerup-glow-color)',
    };
  }

  // Fallback to boost-based calculation for backward compatibility
  // All powerups use yellow color
  if (boost > 2.0) {
    return {
      color: 'var(--powerup-color)',
      glowColor: 'var(--powerup-glow-color)',
      icon: '⚡⚡',
      tier: 3,
    };
  }
  if (boost > 1.5) {
    return {
      color: 'var(--powerup-color)',
      glowColor: 'var(--powerup-glow-color)',
      icon: '⚡',
      tier: 2,
    };
  }
  return {
    color: 'var(--powerup-color)',
    glowColor: 'var(--powerup-glow-color)',
    icon: '⚡',
    tier: 1,
  };
}

export function getLandmineTier(damage: number): TierInfo {
  if (damage > 300) {
    return {
      color: 'var(--trap-color)',
      glowColor: 'var(--trap-glow-color)',
      icon: '💣',
      tier: 3,
    };
  }
  if (damage > 100) {
    return {
      color: 'var(--trap-color)',
      glowColor: 'var(--trap-glow-color)',
      icon: '💣',
      tier: 2,
    };
  }
  return {
    color: 'var(--trap-color)',
    glowColor: 'var(--trap-glow-color)',
    icon: '💣',
    tier: 1,
  };
}

export function getGridBugTier(damage: number): TierInfo {
  // All traps use red color
  if (damage > 100) {
    return {
      color: 'var(--trap-color)',
      glowColor: 'var(--trap-glow-color)',
      icon: '◉', // Grid pattern icon
      tier: 3,
    };
  }
  if (damage > 50) {
    return {
      color: 'var(--trap-color)',
      glowColor: 'var(--trap-glow-color)',
      icon: '◉',
      tier: 2,
    };
  }
  return {
    color: 'var(--trap-color)',
    glowColor: 'var(--trap-glow-color)',
    icon: '◉',
    tier: 1,
  };
}

export function getStreamTier(): TierInfo {
  // All traps use red color
  return {
    color: 'var(--trap-color)',
    glowColor: 'var(--trap-glow-color)',
    icon: '━', // Stream/line icon
    tier: 1,
  };
}

/**
 * Get tier information for a placeable item
 */
export function getPlaceableTier(item: PlaceableItem): TierInfo | null {
  let tierInfo: TierInfo | null = null;

  if (isTrapItem(item)) {
    switch (item.type) {
      case 'landmine':
        tierInfo = getLandmineTier(item.damage);
        break;
      case 'gridBug':
        tierInfo = getGridBugTier(item.damage);
        break;
      case 'stream':
        tierInfo = getStreamTier();
        break;
      default:
        return null;
    }
    // Override all trap colors to red
    if (tierInfo) {
      return {
        ...tierInfo,
        color: 'var(--trap-color)',
        glowColor: 'var(--trap-glow-color)',
      };
    }
  }

  if (isPowerupItem(item)) {
    switch (item.type) {
      case 'powerNode':
        tierInfo = getPowerupTier(item.boost, item.rarity);
        break;
      default:
        return null;
    }
    // Override all powerup colors to yellow
    if (tierInfo) {
      return {
        ...tierInfo,
        color: 'var(--powerup-color)',
        glowColor: 'var(--powerup-glow-color)',
      };
    }
  }

  return null;
}
