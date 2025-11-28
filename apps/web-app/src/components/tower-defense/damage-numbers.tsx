'use client';

import type { DamageNumber } from '~/lib/tower-defense/game-types';

interface DamageNumbersProps {
  damageNumbers: DamageNumber[];
  cellSize: number;
  offsetX?: number;
  offsetY?: number;
}

export default function DamageNumbers({
  damageNumbers,
  cellSize,
  offsetX = 0,
  offsetY = 0,
}: DamageNumbersProps) {
  if (!damageNumbers || !Array.isArray(damageNumbers)) {
    return null;
  }

  return (
    <>
      {damageNumbers.map((dmg) => {
        const opacity = dmg.life / 60;
        const yOffset = (60 - dmg.life) * 0.5; // Float upward

        return (
          <div
            className="absolute pointer-events-none font-bold text-xs"
            key={dmg.id}
            style={{
              color: dmg.color,
              left: offsetX + dmg.position.x * cellSize,
              opacity,
              textShadow: `0 0 8px ${dmg.color}`,
              top: offsetY + dmg.position.y * cellSize - yOffset,
            }}
          >
            -{dmg.value}
          </div>
        );
      })}
    </>
  );
}
