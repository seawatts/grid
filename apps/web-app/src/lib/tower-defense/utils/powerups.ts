import { UPGRADES } from '../constants/upgrades';
import type { PlayerProgress, PowerUp, Tower } from '../game-types';

export function getPowerupLifetime(progress: PlayerProgress): number {
  const level = progress.upgrades.powerNodePersistence ?? 0;
  const upgrade = UPGRADES.powerNodePersistence;
  if (!upgrade) {
    return 3; // Default lifetime
  }
  const effects = upgrade.effects;
  return effects[level] ?? effects[0] ?? 3;
}

export function hasTowerOnPowerup(powerup: PowerUp, towers: Tower[]): boolean {
  return towers.some(
    (tower) =>
      tower.position.x === powerup.position.x &&
      tower.position.y === powerup.position.y,
  );
}

export function ensurePowerupFields(
  powerup: PowerUp,
  lifetime: number,
): PowerUp {
  return {
    ...powerup,
    isTowerBound: powerup.isTowerBound ?? false,
    remainingWaves:
      powerup.remainingWaves !== undefined
        ? powerup.remainingWaves
        : Math.max(1, lifetime),
  };
}
