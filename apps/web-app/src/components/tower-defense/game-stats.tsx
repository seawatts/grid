'use client';

import { Crown, DollarSign, Flame, Heart, Trophy, Zap } from 'lucide-react';

export default function GameStats({
  money,
  lives,
  wave,
  maxWaves,
  score,
  combo,
  onWaveClick,
}: {
  money: number;
  lives: number;
  wave: number;
  maxWaves: number;
  score?: number;
  combo?: number;
  onWaveClick?: () => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      <div
        className="flex items-center gap-1 px-2 py-1.5 rounded border border-cyan-400/30 bg-cyan-500/10"
        style={{ boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)' }}
      >
        <DollarSign className="w-4 h-4 text-cyan-400" />
        <span className="text-white font-bold text-sm">{money}</span>
      </div>
      <div
        className="flex items-center gap-1 px-2 py-1.5 rounded border border-pink-400/30 bg-pink-500/10"
        style={{ boxShadow: '0 0 10px rgba(236, 72, 153, 0.2)' }}
      >
        <Heart className="w-4 h-4 text-pink-400" />
        <span className="text-white font-bold text-sm">{lives}</span>
      </div>
      <button
        className={`flex items-center gap-1 px-2 py-1.5 rounded border transition-all ${
          wave > 0 && wave % 10 === 0
            ? 'border-yellow-400/50 bg-yellow-500/20 animate-pulse'
            : 'border-purple-400/30 bg-purple-500/10 hover:bg-purple-500/20'
        } ${onWaveClick ? 'cursor-pointer active:scale-95' : ''}`}
        onClick={onWaveClick}
        style={{
          boxShadow:
            wave > 0 && wave % 10 === 0
              ? '0 0 15px rgba(250, 204, 21, 0.4)'
              : '0 0 10px rgba(168, 85, 247, 0.2)',
        }}
        type="button"
      >
        {wave > 0 && wave % 10 === 0 ? (
          <Crown className="w-4 h-4 text-yellow-400" />
        ) : (
          <Zap className="w-4 h-4 text-purple-400" />
        )}
        <span className="text-white font-bold text-sm">
          {wave}/{maxWaves}
          {wave > 0 && wave % 10 === 0 && (
            <span className="ml-1 text-yellow-400 text-xs">BOSS</span>
          )}
        </span>
      </button>
      {typeof score === 'number' && (
        <div
          className="flex items-center gap-1 px-2 py-1.5 rounded border border-yellow-400/30 bg-yellow-500/10"
          style={{ boxShadow: '0 0 10px rgba(250, 204, 21, 0.2)' }}
        >
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-bold text-sm">{score}</span>
        </div>
      )}
      {typeof combo === 'number' && combo > 1 && (
        <div
          className="flex items-center gap-1 px-2 py-1.5 rounded border border-orange-400/30 bg-orange-500/10 animate-pulse"
          style={{ boxShadow: '0 0 15px rgba(251, 146, 60, 0.4)' }}
        >
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-white font-bold text-sm">x{combo}</span>
        </div>
      )}
    </div>
  );
}
