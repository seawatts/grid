import { ENEMY_STATS } from '../game-constants';
import type { EnemyType, TowerType } from '../game-types';

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

export function getDamageNumberColor(type: TowerType | 'landmine'): string {
  if (type === 'landmine') {
    return 'rgb(239, 68, 68)';
  }

  const colorMap: Record<TowerType, string> = {
    basic: 'rgb(6, 182, 212)',
    bomb: 'rgb(236, 72, 153)',
    slow: 'rgb(168, 85, 247)',
    sniper: 'rgb(34, 197, 94)',
  };

  return colorMap[type];
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
