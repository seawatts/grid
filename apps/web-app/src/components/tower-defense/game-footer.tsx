'use client';

import { useGameStore } from '~/lib/tower-defense/store/game-store';
import TowerSelector from './tower-selector';

export default function GameFooter() {
  // Zustand selectors
  const gameStatus = useGameStore((state) => state.gameStatus);
  const isMobile = useGameStore((state) => state.isMobile);
  const money = useGameStore((state) => state.money);
  const selectedTowerType = useGameStore((state) => state.selectedTowerType);
  const selectedTower = useGameStore((state) => state.selectedTower);
  const selectedItem = useGameStore((state) => state.selectedItem);
  const showUI = useGameStore((state) => state.showUI);
  const setSelectedTowerType = useGameStore(
    (state) => state.setSelectedTowerType,
  );
  const setSelectedTower = useGameStore((state) => state.setSelectedTower);
  const setSelectedItem = useGameStore((state) => state.setSelectedItem);

  const hasDetailSelection = Boolean(selectedTower || selectedItem);

  const handleSelectTower = (type: typeof selectedTowerType) => {
    if (selectedTowerType === type) {
      setSelectedTowerType(null);
    } else {
      setSelectedTowerType(type);
    }
    setSelectedTower(null);
    setSelectedItem(null);
  };

  return (
    <>
      <div
        className={`transition-all duration-700 mb-2 ${showUI ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionDelay: '500ms' }}
      >
        <div
          className={hasDetailSelection ? 'invisible pointer-events-none' : ''}
        >
          <TowerSelector
            gameStatus={gameStatus}
            isMobile={isMobile}
            money={money}
            onSelectTower={handleSelectTower}
            selectedTowerType={selectedTowerType}
          />
        </div>
      </div>

      <div
        className={`text-center text-[9px] sm:text-xs pb-safe transition-all duration-700 ${showUI ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionDelay: '700ms' }}
      >
        {isMobile
          ? 'TAP TOWER • TAP GRID • BUILD THE MAZE'
          : 'SELECT TOWER • CLICK GRID • CONTROL THE PATH'}
      </div>
    </>
  );
}
