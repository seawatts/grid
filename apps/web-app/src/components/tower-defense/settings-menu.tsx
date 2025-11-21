'use client';

import { Button } from '@seawatts/ui/button';
import { Activity, LogOut, RotateCcw, X } from 'lucide-react';

export default function SettingsMenu({
  onRestart,
  onQuit,
  onClose,
  showPerformanceMonitor,
  onTogglePerformanceMonitor,
}: {
  onRestart: () => void;
  onQuit: () => void;
  onClose: () => void;
  showPerformanceMonitor: boolean;
  onTogglePerformanceMonitor: () => void;
}) {
  return (
    <button
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
      type="button"
    >
      <div
        className="relative bg-black border-2 border-cyan-400 rounded-lg p-6 max-w-sm w-full animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.5)' }}
        tabIndex={-1}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          onClick={onClose}
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        <h2
          className="text-2xl font-bold mb-6 text-center"
          style={{
            background:
              'linear-gradient(135deg, rgb(6, 182, 212), rgb(168, 85, 247))',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          SETTINGS
        </h2>

        <div className="space-y-3">
          <Button
            className={`w-full ${
              showPerformanceMonitor
                ? 'bg-green-500/30 hover:bg-green-500/40 text-green-400 border-2 border-green-400'
                : 'bg-gray-500/20 hover:bg-gray-500/40 text-gray-400 border-2 border-gray-400'
            } h-12 text-base font-bold active:scale-95 transition-all flex items-center justify-center gap-2`}
            onClick={onTogglePerformanceMonitor}
            style={{
              boxShadow: showPerformanceMonitor
                ? '0 0 15px rgba(34, 197, 94, 0.3)'
                : '0 0 15px rgba(156, 163, 175, 0.3)',
            }}
          >
            <Activity className="w-5 h-5" />
            {showPerformanceMonitor ? 'HIDE' : 'SHOW'} PERFORMANCE
          </Button>

          <Button
            className="w-full bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 border-2 border-purple-400 h-12 text-base font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
            onClick={() => {
              onRestart();
              onClose();
            }}
            style={{ boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)' }}
          >
            <RotateCcw className="w-5 h-5" />
            RESTART GAME
          </Button>

          <Button
            className="w-full bg-pink-500/20 hover:bg-pink-500/40 text-pink-400 border-2 border-pink-400 h-12 text-base font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
            onClick={() => {
              onQuit();
              onClose();
            }}
            style={{ boxShadow: '0 0 15px rgba(236, 72, 153, 0.3)' }}
          >
            <LogOut className="w-5 h-5" />
            QUIT TO MENU
          </Button>

          <Button
            className="w-full bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border-2 border-cyan-400 h-12 text-base font-bold active:scale-95 transition-all"
            onClick={onClose}
            style={{ boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)' }}
          >
            CANCEL
          </Button>
        </div>
      </div>
    </button>
  );
}
