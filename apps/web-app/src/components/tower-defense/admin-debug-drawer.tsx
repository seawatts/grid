'use client';

import { Button } from '@seawatts/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@seawatts/ui/drawer';
import { Input } from '@seawatts/ui/input';
import { Label } from '@seawatts/ui/label';
import { X } from 'lucide-react';
import { useState } from 'react';
import { WAVE_POWERUP_POOL } from '~/lib/tower-defense/constants/wave-powerups';
import type {
  PlayerProgress,
  WavePowerUp,
} from '~/lib/tower-defense/game-types';
import { useGameStore } from '~/lib/tower-defense/store/game-store';
import { getMaxEnergy, updateEnergy } from '~/lib/tower-defense/utils/energy';

interface AdminDebugDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: PlayerProgress;
  onAddEnergy: (amount: number) => void;
  isGameActive?: boolean;
}

export default function AdminDebugDrawer({
  open,
  onOpenChange,
  progress,
  onAddEnergy,
  isGameActive = true,
}: AdminDebugDrawerProps) {
  const {
    money,
    lives,
    score,
    wave,
    isPaused,
    gameSpeed,
    autoAdvance,
    activeWavePowerUps,
    setMoney,
    setLives,
    setScore,
    setWave,
    setIsPaused,
    setGameSpeed,
    setAutoAdvance,
    addWavePowerUp,
    removeWavePowerUp,
  } = useGameStore();

  const [energyInput, setEnergyInput] = useState('');
  const [moneyInput, setMoneyInput] = useState('');
  const [livesInput, setLivesInput] = useState('');
  const [scoreInput, setScoreInput] = useState('');
  const [waveInput, setWaveInput] = useState('');

  const updatedProgress = updateEnergy(progress);
  const maxEnergy = getMaxEnergy(updatedProgress);
  const currentEnergy = Math.floor(updatedProgress.energy);

  const handleAddEnergy = () => {
    const amount = Number.parseInt(energyInput, 10);
    if (!Number.isNaN(amount) && amount > 0) {
      onAddEnergy(amount);
      setEnergyInput('');
    }
  };

  const handleSetMoney = () => {
    const amount = Number.parseInt(moneyInput, 10);
    if (!Number.isNaN(amount) && amount >= 0) {
      setMoney(amount);
      setMoneyInput('');
    }
  };

  const handleSetLives = () => {
    const amount = Number.parseInt(livesInput, 10);
    if (!Number.isNaN(amount) && amount >= 0) {
      setLives(amount);
      setLivesInput('');
    }
  };

  const handleSetScore = () => {
    const amount = Number.parseInt(scoreInput, 10);
    if (!Number.isNaN(amount) && amount >= 0) {
      setScore(amount);
      setScoreInput('');
    }
  };

  const handleSetWave = () => {
    const amount = Number.parseInt(waveInput, 10);
    if (!Number.isNaN(amount) && amount >= 0) {
      setWave(amount);
      setWaveInput('');
    }
  };

  const handleAddPowerUp = (powerUp: WavePowerUp) => {
    addWavePowerUp(powerUp);
  };

  const handleRemovePowerUp = (powerUpId: string) => {
    removeWavePowerUp(powerUpId);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'maxMoney':
        setMoney(999999);
        break;
      case 'maxEnergy':
        onAddEnergy(maxEnergy - currentEnergy);
        break;
      case 'maxLives':
        setLives(999);
        break;
      case 'nextWave':
        setWave(wave + 1);
        break;
      default:
        break;
    }
  };

  return (
    <Drawer direction="bottom" onOpenChange={onOpenChange} open={open}>
      <DrawerContent className="border-t border-cyan-500/30 bg-black/95 text-white shadow-[0_0_45px_rgba(34,211,238,0.35)] backdrop-blur-lg [&>div:first-child]:hidden max-h-[90vh]">
        <div className="mx-auto w-full max-w-2xl overflow-y-auto">
          <DrawerHeader className="border-b border-cyan-500/30 px-4 py-4">
            <div className="flex justify-between items-center w-full">
              <DrawerTitle className="text-lg font-bold uppercase m-0 text-cyan-400">
                ADMIN DEBUG PANEL
              </DrawerTitle>
              <DrawerClose asChild>
                <Button
                  className="text-gray-400 hover:text-white hover:bg-white/10 h-8 w-8"
                  size="icon"
                  variant="ghost"
                >
                  <X className="w-4 h-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="px-4 py-6 space-y-6">
            {/* Energy Controls */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase text-cyan-400">
                Energy Controls
              </h3>
              <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                <div className="text-xs text-gray-500 mb-2">
                  Current: {currentEnergy} / {maxEnergy}
                </div>
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    min="1"
                    onChange={(e) => setEnergyInput(e.target.value)}
                    placeholder="Amount to add"
                    type="number"
                    value={energyInput}
                  />
                  <Button
                    className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-400"
                    onClick={handleAddEnergy}
                  >
                    Add Energy
                  </Button>
                </div>
              </div>
            </div>

            {/* Game Stats - Only show when game is active */}
            {isGameActive && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase text-cyan-400">
                  Game Stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                    <Label className="text-xs text-gray-500 mb-2 block">
                      Money: ${money.toLocaleString()}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        className="flex-1"
                        min="0"
                        onChange={(e) => setMoneyInput(e.target.value)}
                        placeholder="Set amount"
                        type="number"
                        value={moneyInput}
                      />
                      <Button
                        className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-400"
                        onClick={handleSetMoney}
                        size="sm"
                      >
                        Set
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                    <Label className="text-xs text-gray-500 mb-2 block">
                      Lives: {lives}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        className="flex-1"
                        min="0"
                        onChange={(e) => setLivesInput(e.target.value)}
                        placeholder="Set amount"
                        type="number"
                        value={livesInput}
                      />
                      <Button
                        className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-400"
                        onClick={handleSetLives}
                        size="sm"
                      >
                        Set
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                    <Label className="text-xs text-gray-500 mb-2 block">
                      Score: {score.toLocaleString()}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        className="flex-1"
                        min="0"
                        onChange={(e) => setScoreInput(e.target.value)}
                        placeholder="Set amount"
                        type="number"
                        value={scoreInput}
                      />
                      <Button
                        className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-400"
                        onClick={handleSetScore}
                        size="sm"
                      >
                        Set
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                    <Label className="text-xs text-gray-500 mb-2 block">
                      Wave: {wave}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        className="flex-1"
                        min="0"
                        onChange={(e) => setWaveInput(e.target.value)}
                        placeholder="Set wave"
                        type="number"
                        value={waveInput}
                      />
                      <Button
                        className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-400"
                        onClick={handleSetWave}
                        size="sm"
                      >
                        Set
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Power Ups - Only show when game is active */}
            {isGameActive && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase text-cyan-400">
                  Active Power Ups ({activeWavePowerUps.length})
                </h3>
                {activeWavePowerUps.length > 0 ? (
                  <div className="space-y-2">
                    {activeWavePowerUps.map((powerUp) => (
                      <div
                        className="bg-gray-900/50 p-3 rounded border border-gray-800 flex items-center justify-between"
                        key={powerUp.id}
                      >
                        <div className="flex-1">
                          <div className="font-bold text-white text-sm">
                            {powerUp.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {powerUp.description}
                          </div>
                          <div className="text-xs text-cyan-300 mt-1">
                            {powerUp.duration === 'permanent'
                              ? 'Permanent'
                              : powerUp.wavesRemaining !== undefined
                                ? `${powerUp.wavesRemaining} waves remaining`
                                : `${powerUp.duration} waves`}
                          </div>
                        </div>
                        <Button
                          className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-400"
                          onClick={() => handleRemovePowerUp(powerUp.id)}
                          size="sm"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-900/50 p-3 rounded border border-gray-800 text-center text-gray-500 text-sm">
                    No active power ups
                  </div>
                )}

                <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                  <Label className="text-xs text-gray-500 mb-2 block">
                    Add Power Up
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {WAVE_POWERUP_POOL.map((powerUp) => (
                      <Button
                        className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-400 text-xs justify-start h-auto py-2"
                        key={powerUp.id}
                        onClick={() => handleAddPowerUp(powerUp)}
                      >
                        <div className="text-left">
                          <div className="font-bold">{powerUp.name}</div>
                          <div className="text-[10px] opacity-75">
                            {powerUp.description}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Game State - Only show when game is active */}
            {isGameActive && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase text-cyan-400">
                  Game State
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className={`${
                      isPaused
                        ? 'bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 border-yellow-400'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border-cyan-400'
                    } border`}
                    onClick={() => setIsPaused(!isPaused)}
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-400"
                    onClick={() =>
                      setGameSpeed(
                        gameSpeed === 1 ? 2 : gameSpeed === 2 ? 4 : 1,
                      )
                    }
                  >
                    Speed: {gameSpeed}x
                  </Button>
                  <Button
                    className={`${
                      autoAdvance
                        ? 'bg-cyan-500/40 hover:bg-cyan-500/60 text-cyan-300 border-cyan-300'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border-cyan-400'
                    } border col-span-2`}
                    onClick={() => setAutoAdvance(!autoAdvance)}
                  >
                    Auto Advance: {autoAdvance ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase text-cyan-400">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {isGameActive && (
                  <Button
                    className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 border border-purple-400"
                    onClick={() => handleQuickAction('maxMoney')}
                  >
                    Max Money
                  </Button>
                )}
                <Button
                  className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 border border-purple-400"
                  onClick={() => handleQuickAction('maxEnergy')}
                >
                  Max Energy
                </Button>
                {isGameActive && (
                  <>
                    <Button
                      className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 border border-purple-400"
                      onClick={() => handleQuickAction('maxLives')}
                    >
                      Max Lives
                    </Button>
                    <Button
                      className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 border border-purple-400"
                      onClick={() => handleQuickAction('nextWave')}
                    >
                      Next Wave
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
