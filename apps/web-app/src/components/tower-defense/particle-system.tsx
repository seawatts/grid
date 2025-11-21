'use client';

import { useEffect, useRef } from 'react';
import type { Particle } from '~/lib/tower-defense/game-types';

interface ParticleSystemProps {
  particles: Particle[];
  cellSize: number;
  width: number;
  height: number;
}

export default function ParticleSystem({
  particles,
  cellSize,
  width,
  height,
}: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      if (!particles || particles.length === 0) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Batch particles by color for optimal rendering
      const batches = new Map<string, typeof particles>();

      for (const particle of particles) {
        const color = particle.color;
        if (!batches.has(color)) {
          batches.set(color, []);
        }
        batches.get(color)?.push(particle);
      }

      // Render each color batch together
      for (const [color, batch] of batches) {
        ctx.fillStyle = color;

        for (const particle of batch) {
          const opacity = particle.life / particle.maxLife;
          const size = 3 + (1 - opacity) * 2; // Particles grow as they fade
          const x = particle.position.x * cellSize;
          const y = particle.position.y * cellSize;

          // Set alpha per particle
          ctx.globalAlpha = opacity;

          // Draw particle as a circle (most performant shape)
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Reset alpha
      ctx.globalAlpha = 1;

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particles, cellSize, width, height]);

  return (
    <canvas
      className="absolute inset-0 pointer-events-none"
      ref={canvasRef}
      style={{ height, width }}
    />
  );
}
