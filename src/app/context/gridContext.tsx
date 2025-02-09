// context/gridContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import { ModelID } from "../../types/types"; // Adjust path if needed

// Define the grid type
type Grid = (ModelID | null)[][];

interface GridContextProps {
  grid: Grid;
  setGrid: React.Dispatch<React.SetStateAction<Grid>>;
}

const GridContext = createContext<GridContextProps | undefined>(undefined);

export const GridProvider = ({ children }: { children: ReactNode }) => {
  const initialGrid: Grid = Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => null)
  );

  const [grid, setGrid] = useState<Grid>(initialGrid);

  return (
    <GridContext.Provider value={{ grid, setGrid }}>
      {children}
    </GridContext.Provider>
  );
};

export const useGrid = () => {
  const context = useContext(GridContext);
  if (!context) throw new Error("useGrid must be used within a GridProvider");
  return context;
};
