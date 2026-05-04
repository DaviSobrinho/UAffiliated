"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { HouseTheme, getHouseTheme } from "@/lib/houseThemes";

interface HouseContextType {
  selectedHouse: string;
  theme: HouseTheme;
  setSelectedHouse: (houseId: string) => void;
}

const HouseContext = createContext<HouseContextType | undefined>(undefined);

export function HouseProvider({ children }: { children: React.ReactNode }) {
  const [selectedHouse, setSelectedHouse] = useState<string>("betano");
  const [theme, setTheme] = useState<HouseTheme>(getHouseTheme("betano"));

  useEffect(() => {
    const saved = localStorage.getItem("selectedHouse");
    if (saved) {
      setSelectedHouse(saved);
      setTheme(getHouseTheme(saved));
    }
  }, []);

  const handleSetSelectedHouse = (houseId: string) => {
    setSelectedHouse(houseId);
    setTheme(getHouseTheme(houseId));
    localStorage.setItem("selectedHouse", houseId);

    const root = document.documentElement;
    const colors = getHouseTheme(houseId).colors;
    root.style.setProperty("--color-primary", colors.primary);
    root.style.setProperty("--color-primary-light", colors.primaryLight);
    root.style.setProperty("--color-primary-dark", colors.primaryDark);
    root.style.setProperty("--color-accent", colors.accent);
  };

  return (
    <HouseContext.Provider value={{ selectedHouse, theme, setSelectedHouse: handleSetSelectedHouse }}>
      {children}
    </HouseContext.Provider>
  );
}

export function useHouse() {
  const context = useContext(HouseContext);
  if (context === undefined) {
    throw new Error("useHouse must be used within HouseProvider");
  }
  return context;
}
