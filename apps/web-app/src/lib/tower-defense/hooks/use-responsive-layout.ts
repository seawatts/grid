import { useEffect } from 'react';
import { MAX_CELL_SIZE, MIN_CELL_SIZE } from '../constants/visuals';
import { useGameStore } from '../store/game-store';

export function useResponsiveLayout() {
  const grid = useGameStore((state) => state.grid);
  const gridWidth = useGameStore((state) => state.gridWidth);
  const gridHeight = useGameStore((state) => state.gridHeight);
  const setCellSize = useGameStore((state) => state.setCellSize);
  const setIsMobile = useGameStore((state) => state.setIsMobile);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 640;
      setIsMobile(isMobile);

      const headerHeight = isMobile ? 100 : 120;
      const footerHeight = isMobile ? 140 : 160;
      const padding = isMobile ? 16 : 32; // Less padding on mobile

      const availableHeight = height - headerHeight - footerHeight - padding;
      const availableWidth = Math.min(width - padding, 896);

      // Calculate cell size based on grid dimensions
      // Prioritize height to maximize vertical space usage and fill available height
      const maxCellSizeHeight = availableHeight / gridHeight;
      const maxCellSizeWidth = availableWidth / gridWidth;

      // On mobile, prioritize height to fill vertical space
      // On desktop, use the smaller of the two to ensure grid fits
      let newCellSize: number;
      if (isMobile) {
        // On mobile, prioritize height and allow grid to fill available space
        // Use height-based sizing, but ensure it doesn't exceed width constraints
        newCellSize = Math.min(maxCellSizeHeight, maxCellSizeWidth);
      } else {
        // On desktop, use the smaller to ensure grid fits both dimensions
        newCellSize = Math.min(maxCellSizeHeight, maxCellSizeWidth);
      }

      // Apply min/max constraints
      newCellSize = Math.max(newCellSize, MIN_CELL_SIZE);
      newCellSize = Math.min(newCellSize, MAX_CELL_SIZE);

      setCellSize(Math.floor(newCellSize));
    };

    if (grid.length > 0 && gridWidth > 0 && gridHeight > 0) {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [grid, gridWidth, gridHeight, setCellSize, setIsMobile]);
}
