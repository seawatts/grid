'use client';

import { Activity, Eye, Target, Zap } from 'lucide-react';
import { useMemo } from 'react';
import type { WavePowerUp } from '~/lib/tower-defense/game-types';
import { useGameStore } from '~/lib/tower-defense/store/game-store';
import { aggregateWavePowerUpEffects } from '~/lib/tower-defense/utils/calculations';

type ImpactEntity = 'tower' | 'trap' | 'powerNode';

interface PowerUpImpactListProps {
  entity: ImpactEntity;
  className?: string;
  title?: string;
}

const ENTITY_LABELS: Record<ImpactEntity, string> = {
  powerNode: 'Node',
  tower: 'tower',
  trap: 'trap',
};

const ENTITY_EFFECTS: Record<ImpactEntity, WavePowerUp['effect']['type'][]> = {
  powerNode: [],
  tower: ['damageMult', 'fireRateMult', 'towerRangeMult', 'towerRangeAdd'],
  trap: ['damageMult'],
};

const EFFECT_METADATA: Record<
  WavePowerUp['effect']['type'],
  {
    label: string;
    icon: typeof Zap;
    format: (value: number) => string;
  }
> = {
  addLives: {
    format: (value) => `+${value}`,
    icon: Eye,
    label: 'Bonus Lives',
  },
  addMoney: {
    format: (value) => `+${value}`,
    icon: Eye,
    label: 'Bonus Credits',
  },
  damageMult: {
    format: (value) => `+${Math.round(value * 100)}%`,
    icon: Zap,
    label: 'Damage Output',
  },
  fireRateMult: {
    format: (value) => `+${Math.round(value * 100)}%`,
    icon: Activity,
    label: 'Fire Rate',
  },
  penetrationAdd: {
    format: (value) => `+${value}`,
    icon: Target,
    label: 'Penetration',
  },
  penetrationMult: {
    format: (value) => `+${Math.round(value * 100)}%`,
    icon: Target,
    label: 'Penetration Multiplier',
  },
  rewardMult: {
    format: (value) => `+${Math.round(value * 100)}%`,
    icon: Eye,
    label: 'Kill Rewards',
  },
  towerRangeAdd: {
    format: (value) =>
      value % 1 === 0 ? `+${value}` : `+${value.toFixed(1)} tiles`,
    icon: Target,
    label: 'Range Bonus',
  },
  towerRangeMult: {
    format: (value) => `+${Math.round(value * 100)}%`,
    icon: Target,
    label: 'Range Multiplier',
  },
};

function formatDuration(powerUp: WavePowerUp): string {
  if (powerUp.duration === 'permanent') {
    return 'Permanent';
  }
  if (powerUp.wavesRemaining !== undefined) {
    if (powerUp.wavesRemaining <= 0) return 'Expiring';
    return `${powerUp.wavesRemaining} wave${
      powerUp.wavesRemaining === 1 ? '' : 's'
    } left`;
  }
  if (typeof powerUp.duration === 'number') {
    return `${powerUp.duration} wave${powerUp.duration === 1 ? '' : 's'}`;
  }
  return '';
}

export default function PowerUpImpactList({
  entity,
  className,
  title = 'Wave Power-Up Effects',
}: PowerUpImpactListProps) {
  const { activeWavePowerUps } = useGameStore();

  const effectTypes = ENTITY_EFFECTS[entity] ?? [];

  const groupedEffects = useMemo(() => {
    return effectTypes
      .map((effectType) => {
        const relevant = activeWavePowerUps.filter(
          (powerUp) => powerUp.effect.type === effectType,
        );
        if (relevant.length === 0) return null;

        const total = aggregateWavePowerUpEffects(relevant, effectType);
        return {
          effectType,
          powerUps: relevant,
          total,
        };
      })
      .filter((group): group is NonNullable<typeof group> => !!group);
  }, [activeWavePowerUps, effectTypes]);

  const hasEffects = groupedEffects.length > 0;
  const entityLabel = ENTITY_LABELS[entity];

  return (
    <div
      className={`rounded-lg border border-cyan-500/30 bg-black/40 p-3 sm:p-4 mt-4 ${className ?? ''}`}
      style={{ boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] font-bold text-cyan-400 tracking-[0.2em]">
            {title.toUpperCase()}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Global power-ups currently affecting this {entityLabel}.
          </p>
        </div>
      </div>

      {effectTypes.length === 0 && (
        <div className="text-xs text-gray-500">
          No wave power-ups directly interact with this unit type.
        </div>
      )}

      {effectTypes.length > 0 && !hasEffects && (
        <div className="text-xs text-gray-500">
          No active power-ups are modifying this {entityLabel}.
        </div>
      )}

      {groupedEffects.length > 0 && (
        <div className="space-y-3">
          {groupedEffects.map(({ effectType, total, powerUps }) => {
            const meta = EFFECT_METADATA[effectType];
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <div
                className="rounded border border-gray-800 bg-gray-900/40 p-3"
                key={effectType}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-white">
                      {meta.label}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-cyan-400">
                    {meta.format(total)}
                  </span>
                </div>
                <div className="space-y-1">
                  {powerUps.map((powerUp, index) => (
                    <div
                      className="flex items-center justify-between text-[11px] text-gray-300 bg-gray-900/60 border border-gray-800 rounded px-2 py-1"
                      key={`${effectType}-${powerUp.id}-${powerUp.wavesRemaining ?? 'perm'}-${index}`}
                    >
                      <span className="font-semibold text-white">
                        {powerUp.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-300">
                          {meta.format(powerUp.effect.value)}
                        </span>
                        <span className="text-gray-500">
                          {formatDuration(powerUp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
