'use client';

interface AnimatedLineProps {
  direction: 'horizontal' | 'vertical';
  color: 'cyan' | 'pink' | 'purple';
  position: string | number;
  delay?: number;
  animate?: boolean;
  className?: string;
}

const COLOR_CONFIG = {
  cyan: {
    gradient:
      'from-cyan-400/0 from-[2%] via-cyan-400 via-[50%] to-cyan-400 to-[98%] to-cyan-400/0',
    shadow: '0 0 20px rgba(6, 182, 212, 0.8)',
  },
  pink: {
    gradient:
      'from-pink-400/0 from-[2%] via-pink-400 via-[50%] to-pink-400 to-[98%] to-pink-400/0',
    shadow: '0 0 20px rgba(236, 72, 153, 0.8)',
  },
  purple: {
    gradient:
      'from-purple-400/0 from-[2%] via-purple-400 via-[50%] to-purple-400 to-[98%] to-purple-400/0',
    shadow: '0 0 20px rgba(168, 85, 247, 0.8)',
  },
};

export default function AnimatedLine({
  direction,
  color,
  position,
  delay = 0,
  animate = true,
  className = '',
}: AnimatedLineProps) {
  const colorConfig = COLOR_CONFIG[color];

  const positionStyle =
    typeof position === 'number' ? `${position}px` : position;

  const baseStyle =
    direction === 'horizontal'
      ? {
          boxShadow: colorConfig.shadow,
          height: '1px',
          left: 0,
          top: positionStyle,
          transitionDelay: `${delay}ms`,
        }
      : {
          boxShadow: colorConfig.shadow,
          left: positionStyle,
          top: 0,
          transitionDelay: `${delay}ms`,
          width: '1px',
        };

  const gradientClass =
    direction === 'horizontal'
      ? `bg-gradient-to-r ${colorConfig.gradient}`
      : `bg-gradient-to-b ${colorConfig.gradient}`;

  const sizeClass =
    direction === 'horizontal'
      ? animate
        ? 'w-full'
        : 'w-0'
      : animate
        ? 'h-full'
        : 'h-0';

  return (
    <div
      className={`absolute ${gradientClass} transition-all duration-2000 ${sizeClass} ${className}`}
      style={baseStyle}
    />
  );
}
