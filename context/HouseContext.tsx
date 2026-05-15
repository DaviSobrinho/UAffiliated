"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { HouseTheme, getHouseTheme, HOUSE_THEMES } from "@/lib/houseThemes";

interface HouseContextType {
  selectedHouse: string;
  theme: HouseTheme;
  setSelectedHouse: (houseId: string) => void;
}

const HouseContext = createContext<HouseContextType | undefined>(undefined);

// Helper para obter tema baseado em ID (UUID do banco) ou nome da casa
const getThemeForHouse = async (houseId: string): Promise<HouseTheme> => {
  // Se é um ID simples (betano, stake, etc), retorna direto
  if (HOUSE_THEMES[houseId]) {
    return HOUSE_THEMES[houseId];
  }

  // Se é um UUID, tenta buscar o nome da casa
  try {
    const res = await fetch("/api/admin/houses");
    if (res.ok) {
      const data = await res.json();
      const house = data.houses?.find((h: any) => h.id === houseId);
      if (house) {
        const theme = Object.values(HOUSE_THEMES).find(
          (t) => t.name.toLowerCase() === house.name.toLowerCase()
        );
        if (theme) return theme;
      }
    }
  } catch (err) {
    console.error("Error fetching house theme:", err);
  }

  return HOUSE_THEMES.betano;
};

export function HouseProvider({ children }: { children: React.ReactNode }) {
  const [selectedHouse, setSelectedHouse] = useState<string>("betano");
  const [theme, setTheme] = useState<HouseTheme>(getHouseTheme("betano"));

  useEffect(() => {
    const saved = localStorage.getItem("selectedHouse");
    if (saved) {
      setSelectedHouse(saved);
      getThemeForHouse(saved).then((t) => {
        setTheme(t);
        applyThemeColors(t);
      });
    }
  }, []);

  const applyThemeColors = (themeToApply: HouseTheme) => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", themeToApply.colors.primary);
    root.style.setProperty("--color-primary-light", themeToApply.colors.primaryLight);
    root.style.setProperty("--color-primary-dark", themeToApply.colors.primaryDark);
    root.style.setProperty("--color-accent", themeToApply.colors.accent);
  };

  const handleSetSelectedHouse = async (houseId: string) => {
    setSelectedHouse(houseId);
    localStorage.setItem("selectedHouse", houseId);

    const newTheme = await getThemeForHouse(houseId);
    setTheme(newTheme);
    applyThemeColors(newTheme);
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
