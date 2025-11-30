'use client';

import { Button } from '@seawatts/ui/button';
import type {
  DamageNumber,
  Enemy,
  Particle,
  PlaceableItem,
  Position,
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
  placeables?: PlaceableItem[];
  debugPaths: Position[][];
  animatedPathLengths: number[];
  touchFeedback: Position | null;
  cellSize: number;
  isMobile: boolean;
  gameStatus: 'playing' | 'won' | 'lost';
  startPositions: Position[];
  goalPositions: Position[];
  selectedTower: Tower | null;
  showDamageNumbers: boolean;
  maxWaves: number;
  onCellClick: (x: number, y: number) => void;
}

export default function GameBoard({
  grid,
  towers,
  enemies,
  projectiles,
  particles,
  damageNumbers,
  placeables = [],
  debugPaths,
  animatedPathLengths,
  touchFeedback,
  cellSize,
  isMobile,
  gameStatus,
  selectedTower,
  showDamageNumbers,
  maxWaves,
  onCellClick,
}: GameBoardProps) {
  // Calculate grid dimensions from the grid array
  const gridHeight = grid.length;
  const gridWidth = grid[0]?.length || 0;
  const boardWidth = gridWidth * cellSize;
  const boardHeight = gridHeight * cellSize;

  return (
    <div
      className="relative bg-black select-none"
      style={{
        border: '2px solid',
        borderImage:
          'linear-gradient(135deg, rgb(6, 182, 212), rgb(168, 85, 247), rgb(236, 72, 153)) 1',
        boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)',
        flexShrink: 0,
        height: boardHeight,
        width: boardWidth,
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
          // Find placeables at this cell
          const cellPlaceables = placeables.filter((item) =>
            item.positions.some((pos) => pos.x === x && pos.y === y),
          );

          const hasTower = towers.some(
            (t) => t.position.x === x && t.position.y === y,
          );
          const cellId = `${cell}-${y * gridWidth + x}`;

          return (
            <GridCell
              animatedPathLengths={animatedPathLengths}
              cell={cell}
              cellSize={cellSize}
              debugPaths={debugPaths}
              hasTower={hasTower}
              key={cellId}
              onClick={onCellClick}
              placeables={cellPlaceables}
              touchFeedback={touchFeedback}
              x={x}
              y={y}
            />
          );
        }),
      )}

      {gameStatus === 'playing' && (
        <>
          {towers.map((tower) => {
            const isSelected =
              selectedTower?.position.x === tower.position.x &&
              selectedTower?.position.y === tower.position.y;
            const foundPowerup = placeables.find(
              (p) =>
                p.category === 'powerup' &&
                p.positions.some(
                  (pos) =>
                    pos.x === tower.position.x && pos.y === tower.position.y,
                ),
            );
            const powerup =
              foundPowerup && foundPowerup.category === 'powerup'
                ? foundPowerup
                : undefined;

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
            height={boardHeight}
            particles={particles}
            width={boardWidth}
          />
          {showDamageNumbers && (
            <DamageNumbers cellSize={cellSize} damageNumbers={damageNumbers} />
          )}
        </>
      )}

      {gameStatus !== 'playing' && (
        <div
          className="absolute inset-0 flex items-center justify-center p-4 z-50"
          style={{
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.98)',
          }}
        >
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
                ? `${maxWaves} WAVES COMPLETED`
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
