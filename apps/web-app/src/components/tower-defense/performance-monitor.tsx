'use client';

import { useEffect, useRef, useState } from 'react';

interface PerformanceMonitorProps {
  particleCount: number;
  isEnabled?: boolean;
}

export default function PerformanceMonitor({
  particleCount,
  isEnabled = true,
}: PerformanceMonitorProps) {
  const [fps, setFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!isEnabled) return;

    const updateFps = () => {
      frameCountRef.current++;
      const now = Date.now();
      const elapsed = now - lastTimeRef.current;

      // Update FPS every 500ms
      if (elapsed >= 500) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFps);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(updateFps);
    };

    updateFps();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isEnabled]);

  if (!isEnabled) return null;

  const fpsColor =
    fps >= 55
      ? 'text-green-400'
      : fps >= 30
        ? 'text-yellow-400'
        : 'text-red-400';

  const particleColor =
    particleCount >= 5000
      ? 'text-purple-400'
      : particleCount >= 1000
        ? 'text-cyan-400'
        : 'text-gray-400';

  return (
    <div className="fixed top-2 right-2 z-50 bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-3 font-mono text-sm">
      <div className="grid gap-1">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-semibold">FPS:</span>
          <span className={`${fpsColor} font-bold tabular-nums`}>{fps}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-semibold">Particles:</span>
          <span className={`${particleColor} font-bold tabular-nums`}>
            {particleCount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
