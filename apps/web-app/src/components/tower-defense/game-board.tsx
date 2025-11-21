'use client';

import { Button } from '@seawatts/ui/button';
import { GRID_SIZE, MAX_WAVES } from '~/lib/tower-defense/constants/balance';
import type {
  DamageNumber,
  Enemy,
  Landmine,
  Particle,
  Position,
  PowerUp,
  Projectile,
  Tower,
} from '~/lib/tower-defense/game-types';
import DamageNumbers from './damage-numbers';
import ParticleSystem from './particle-system';
import EnemyRenderer from './renderers/enemy-renderer';
import GridCell from './renderers/grid-cell';
import ProjectileRenderer from './renderers/projectile-renderer';
import TowerRenderer from './renderers/tower-renderer';

interface GameBoardProps {
  grid: string[][];
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  damageNumbers: DamageNumber[];
  powerups: PowerUp[];
  landmines: Landmine[];
  debugPaths: Position[][];
  animatedPathLengths: number[];
  touchFeedback: Position | null;
  cellSize: number;
  isMobile: boolean;
  gameStatus: 'playing' | 'won' | 'lost';
  startPositions: Position[];
  goalPositions: Position[];
  selectedTower: Tower | null;
  onCellClick: (x: number, y: number) => void;
}

export default function GameBoard({
  grid,
  towers,
  enemies,
  projectiles,
  particles,
  damageNumbers,
  powerups,
  landmines,
  debugPaths,
  animatedPathLengths,
  touchFeedback,
  cellSize,
  isMobile,
  gameStatus,
  selectedTower,
  onCellClick,
}: GameBoardProps) {
  return (
    <div
      className="relative bg-black select-none"
      style={{
        border: '2px solid',
        borderImage:
          'linear-gradient(135deg, rgb(6, 182, 212), rgb(168, 85, 247), rgb(236, 72, 153)) 1',
        boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)',
        height: GRID_SIZE * cellSize,
        maxHeight: '100vh',
        maxWidth: '100vw',
        width: GRID_SIZE * cellSize,
      }}
    >
      {/* Grid pattern */}
      <svg
        aria-label="Grid pattern background"
        className="absolute inset-0 pointer-events-none"
        role="img"
        style={{ height: '100%', width: '100%' }}
      >
        <defs>
          <pattern
            height={cellSize}
            id="grid"
            patternUnits="userSpaceOnUse"
            width={cellSize}
          >
            <path
              d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
              fill="none"
              stroke="rgba(6, 182, 212, 0.35)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect
          className="animate-pulse"
          fill="url(#grid)"
          height="100%"
          style={{ animationDuration: '3s' }}
          width="100%"
        />
      </svg>

      {/* Grid cells */}
      {grid.flatMap((row, y) =>
        row.map((cell, x) => {
          const powerup = powerups.find(
            (p) => p.position.x === x && p.position.y === y,
          );
          const landmine = landmines.find(
            (m) => m.position.x === x && m.position.y === y,
          );
          const hasTower = towers.some(
            (t) => t.position.x === x && t.position.y === y,
          );
          const cellId = `${cell}-${y * grid.length + x}`;

          return (
            <GridCell
              animatedPathLengths={animatedPathLengths}
              cell={cell}
              cellSize={cellSize}
              debugPaths={debugPaths}
              hasTower={hasTower}
              key={cellId}
              landmine={landmine}
              onClick={onCellClick}
              powerup={powerup}
              touchFeedback={touchFeedback}
              x={x}
              y={y}
            />
          );
        }),
      )}

      {towers.map((tower) => {
        const isSelected =
          selectedTower?.position.x === tower.position.x &&
          selectedTower?.position.y === tower.position.y;
        const powerup = powerups.find(
          (p) =>
            p.position.x === tower.position.x &&
            p.position.y === tower.position.y,
        );

        return (
          <TowerRenderer
            cellSize={cellSize}
            isMobile={isMobile}
            isSelected={isSelected}
            key={tower.id}
            powerup={powerup}
            tower={tower}
          />
        );
      })}

      {enemies.map((enemy) => (
        <EnemyRenderer
          cellSize={cellSize}
          enemy={enemy}
          isMobile={isMobile}
          key={enemy.id}
        />
      ))}

      {projectiles.map((projectile) => (
        <ProjectileRenderer
          cellSize={cellSize}
          isMobile={isMobile}
          key={projectile.id}
          projectile={projectile}
        />
      ))}

      <ParticleSystem
        cellSize={cellSize}
        height={GRID_SIZE * cellSize}
        particles={particles}
        width={GRID_SIZE * cellSize}
      />
      <DamageNumbers cellSize={cellSize} damageNumbers={damageNumbers} />

      {gameStatus !== 'playing' && (
        <div className="absolute inset-0 bg-black/95 flex items-center justify-center p-4">
          <div className="text-center">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 animate-pulse"
              style={{
                background:
                  gameStatus === 'won'
                    ? 'linear-gradient(135deg, rgb(34, 197, 94), rgb(6, 182, 212))'
                    : 'linear-gradient(135deg, rgb(239, 68, 68), rgb(236, 72, 153))',
                backgroundClip: 'text',
                filter: `drop-shadow(0 0 20px ${gameStatus === 'won' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {gameStatus === 'won' ? 'GRID DOMINATED!' : 'GRID FAILURE'}
            </h2>
            <p className="text-cyan-400 mb-4 sm:mb-6 text-sm sm:text-base font-mono">
              {gameStatus === 'won'
                ? `${MAX_WAVES} WAVES COMPLETED`
                : 'DEFENSES COMPROMISED'}
            </p>
            <Button
              className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border-2 border-cyan-400 h-12 px-8 text-base font-bold active:scale-95 transition-all"
              onClick={() => window.location.reload()}
              style={{ boxShadow: '0 0 25px rgba(6, 182, 212, 0.5)' }}
            >
              RESTART GRID
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
