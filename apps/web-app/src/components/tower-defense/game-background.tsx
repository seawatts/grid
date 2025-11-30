import { useGameStore } from '~/lib/tower-defense/store/game-store';

export default function GameBackground() {
  const showGrid = useGameStore((state) => state.showGrid);

  return (
    <>
      {/* Background grid */}
      <div
        className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${showGrid ? 'opacity-100' : 'opacity-0'}`}
        style={{
          animation: showGrid ? 'grid-sweep 1.2s ease-out forwards' : 'none',
        }}
      >
        <svg aria-hidden="true" className="w-full h-full">
          <title>Background Grid</title>
          <defs>
            <pattern
              height="40"
              id="fullpage-grid"
              patternUnits="userSpaceOnUse"
              width="40"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(6, 182, 212, 0.15)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect
            className="animate-pulse"
            fill="url(#fullpage-grid)"
            height="100%"
            style={{ animationDuration: '3s' }}
            width="100%"
          />
        </svg>
      </div>

      {/* Corner decorations */}
      <div
        className={`absolute top-4 left-4 w-12 h-12 sm:w-16 sm:h-16 border-l-2 border-t-2 border-cyan-400/50 pointer-events-none transition-all duration-1000 ${showGrid ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
        style={{ transitionDelay: '200ms' }}
      />
      <div
        className={`absolute top-4 right-4 w-12 h-12 sm:w-16 sm:h-16 border-r-2 border-t-2 border-pink-400/50 pointer-events-none transition-all duration-1000 ${showGrid ? 'opacity-100 scale-100' : 'opacity-0 scale-40'}`}
        style={{ transitionDelay: '400ms' }}
      />
      <div
        className={`absolute bottom-4 left-4 w-12 h-12 sm:w-16 sm:h-16 border-l-2 border-b-2 border-purple-400/50 pointer-events-none transition-all duration-1000 ${showGrid ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{ transitionDelay: '600ms' }}
      />
      <div
        className={`absolute bottom-4 right-4 w-12 h-12 sm:w-16 sm:h-16 border-r-2 border-b-2 border-cyan-400/50 pointer-events-none transition-all duration-1000 ${showGrid ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
        style={{ transitionDelay: '800ms' }}
      />
    </>
  );
}
