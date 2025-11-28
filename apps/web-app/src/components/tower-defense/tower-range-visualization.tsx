'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import DamageNumbers from '~/components/tower-defense/damage-numbers';
import TowerRenderer from '~/components/tower-defense/renderers/tower-renderer';
import type {
  DamageNumber,
  PowerUp,
  Tower,
} from '~/lib/tower-defense/game-types';
import { getProjectileColor } from '~/lib/tower-defense/utils/rendering';

interface TowerRangeVisualizationProps {
  range: number;
  fireRateMs: number;
  tower: Tower;
  accentColor: string;
  tilePowerup?: PowerUp;
  damage: number; // Effective damage value to display
}

const GRID_SIZE = 5;
const CENTER = Math.floor(GRID_SIZE / 2);
const CELL_SIZE = 44;
const CELL_GAP = 2;
const BOARD_PADDING = 8;
const BOARD_SIZE =
  GRID_SIZE * CELL_SIZE + BOARD_PADDING * 2 + CELL_GAP * (GRID_SIZE - 1);

type BulletState = {
  targetIdx: number;
  progress: number;
};

type HitIndicator = {
  x: number;
  y: number;
  value: number;
  id: number;
};

function TowerRangeVisualization({
  range,
  fireRateMs,
  tower,
  accentColor: _accentColor,
  tilePowerup,
  damage,
}: TowerRangeVisualizationProps) {
  const [bulletState, setBulletState] = useState<BulletState>({
    progress: 0,
    targetIdx: 0,
  });
  const [_hitIndicator, setHitIndicator] = useState<HitIndicator | null>(null);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const damageNumberIdRef = useRef(0);
  const hitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const projectileColor = getProjectileColor(tower.type);
  const colorWithAlpha = (alpha: number) =>
    projectileColor.replace('rgb', 'rgba').replace(')', `, ${alpha})`);

  const cells = useMemo(() => {
    return Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
      const x = index % GRID_SIZE;
      const y = Math.floor(index / GRID_SIZE);
      const dx = x - CENTER;
      const dy = y - CENTER;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const isInRange = distance <= range + 0.2;
      const isCenter = x === CENTER && y === CENTER;
      const left = BOARD_PADDING + x * (CELL_SIZE + CELL_GAP);
      const top = BOARD_PADDING + y * (CELL_SIZE + CELL_GAP);
      const centerX = left + CELL_SIZE / 2;
      const centerY = top + CELL_SIZE / 2;
      return { centerX, centerY, isCenter, isInRange, left, top, x, y };
    });
  }, [range]);

  const targetCells = useMemo(
    () => cells.filter((cell) => cell.isInRange && !cell.isCenter),
    [cells],
  );

  useEffect(() => {
    return () => {
      if (hitTimeoutRef.current) {
        clearTimeout(hitTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (damageNumbers.length === 0) return undefined;

    const interval = setInterval(() => {
      setDamageNumbers((prev) =>
        prev
          .map((dmg) => ({ ...dmg, life: dmg.life - 1 }))
          .filter((dmg) => dmg.life > 0),
      );
    }, 16);

    return () => clearInterval(interval);
  }, [damageNumbers.length]);

  useEffect(() => {
    setBulletState({ progress: 0, targetIdx: 0 });
  }, []);

  useEffect(() => {
    if (targetCells.length === 0 || fireRateMs <= 0) return undefined;

    let frame: number;
    let lastTimestamp: number | null = null;
    let prevProgress = 0;

    const animate = (timestamp: number) => {
      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
      }

      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      setBulletState((prev) => {
        let progress = prev.progress + delta / fireRateMs;
        let targetIdx = prev.targetIdx;

        // Check if bullet just reached target (crossed from < 1 to >= 1)
        if (progress >= 1 && prevProgress < 1) {
          const target = targetCells[targetIdx];
          if (target) {
            setHitIndicator({
              id: Date.now(),
              value: Math.round(damage),
              x: target.x,
              y: target.y,
            });
            setDamageNumbers((prev) => [
              ...prev,
              {
                color: projectileColor,
                id: damageNumberIdRef.current++,
                life: 60,
                position: { x: target.x + 0.5, y: target.y + 0.5 },
                value: Math.round(damage),
              },
            ]);
            if (hitTimeoutRef.current) clearTimeout(hitTimeoutRef.current);
            hitTimeoutRef.current = setTimeout(
              () => setHitIndicator(null),
              600,
            );
          }
        }

        prevProgress = progress;

        if (progress >= 1) {
          progress = 0;
          targetIdx = (targetIdx + 1) % targetCells.length;
          prevProgress = 0;
        }

        return { progress, targetIdx };
      });

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [targetCells, fireRateMs, damage, projectileColor]);

  const displayTower = useMemo(
    () => ({
      ...tower,
      position: { x: 0, y: 0 }, // Position relative to the cell
    }),
    [tower],
  );

  const centerCell = cells.find((c) => c.x === CENTER && c.y === CENTER);
  const centerPixel = centerCell
    ? {
        x: centerCell.centerX,
        y: centerCell.centerY,
      }
    : { x: 0, y: 0 };

  const currentTarget = targetCells[bulletState.targetIdx];
  const bulletPosition = currentTarget
    ? {
        x:
          centerPixel.x +
          (currentTarget.centerX - centerPixel.x) * bulletState.progress,
        y:
          centerPixel.y +
          (currentTarget.centerY - centerPixel.y) * bulletState.progress,
      }
    : centerPixel;

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-cyan-500/40 bg-black/80 flex-shrink-0"
      style={{ height: BOARD_SIZE, width: BOARD_SIZE }}
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            'linear-gradient(0deg, rgba(6,182,212,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.14) 1px, transparent 1px)',
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
        }}
      />

      <div
        className="grid grid-cols-5 grid-rows-5 w-full h-full"
        style={{ gap: `${CELL_GAP}px`, padding: `${BOARD_PADDING}px` }}
      >
        {cells.map((cell) => {
          const isCurrentTarget =
            currentTarget &&
            currentTarget.x === cell.x &&
            currentTarget.y === cell.y;
          const isInRange = cell.isInRange && !cell.isCenter;

          return (
            <div
              className={`relative rounded-sm flex items-center justify-center transition-all duration-150 ${
                cell.isCenter ? 'bg-transparent' : 'bg-black/40'
              }`}
              key={`${cell.x}-${cell.y}`}
              style={{
                backgroundColor: isCurrentTarget
                  ? colorWithAlpha(0.25)
                  : isInRange
                    ? 'rgba(6,182,212,0.15)'
                    : 'rgba(0,0,0,0.4)',
                border:
                  cell.isCenter || !isInRange
                    ? '1px solid rgba(6,182,212,0.15)'
                    : '1px solid rgba(6,182,212,0.3)',
                boxShadow: isCurrentTarget
                  ? `0 0 15px ${colorWithAlpha(0.7)}`
                  : 'none',
              }}
            >
              {cell.isCenter && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <TowerRenderer
                    cellSize={CELL_SIZE}
                    isMobile={false}
                    isSelected={false}
                    powerup={tilePowerup}
                    tower={displayTower}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {targetCells.length > 0 && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            backgroundColor: projectileColor,
            boxShadow: `0 0 12px ${colorWithAlpha(0.9)}`,
            height: CELL_SIZE * 0.3,
            left: bulletPosition.x - (CELL_SIZE * 0.3) / 2,
            top: bulletPosition.y - (CELL_SIZE * 0.3) / 2,
            width: CELL_SIZE * 0.3,
          }}
        />
      )}

      <DamageNumbers
        cellSize={CELL_SIZE + CELL_GAP}
        damageNumbers={damageNumbers}
        offsetX={BOARD_PADDING - CELL_GAP / 2}
        offsetY={BOARD_PADDING - CELL_GAP / 2}
      />
    </div>
  );
}

export default memo(TowerRangeVisualization);
