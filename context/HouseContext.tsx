"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { HouseTheme, HOUSE_THEMES } from "@/lib/houseThemes";
import { useHouses } from "@/context/HousesContext";

interface House {
  id: string;
  name: string;
  color: string;
}

interface HouseContextType {
  selectedHouse: string;
  theme: HouseTheme;
  setSelectedHouse: (houseId: string) => void;
}

const HouseContext = createContext<HouseContextType | undefined>(undefined);

// Helper para obter tema baseado em ID (UUID do banco) ou nome da casa
const getThemeForHouse = (houseId: string, houses: House[] = []): HouseTheme => {
  // Se é um ID simples (betano, stake, etc), retorna direto
  if (HOUSE_THEMES[houseId]) {
    return HOUSE_THEMES[houseId];
  }

  // Se é um UUID, procura na lista de casas
  const house = houses.find((h) => h.id === houseId);
  if (house) {
    // Tenta encontrar um tema pré-definido por nome
    const theme = Object.values(HOUSE_THEMES).find(
      (t) => t.name.toLowerCase() === house.name.toLowerCase()
    );
    if (theme) return theme;

    // Se não encontrar tema pré-definido, cria um tema dinâmico com a cor do banco
    if (house.color) {
      return {
        id: houseId,
        name: house.name,
        logo: "",
        colors: {
          primary: house.color,
          primaryLight: house.color + "dd",
          primaryDark: house.color + "99",
          secondary: "#FFFFFF",
          accent: house.color + "cc",
          background: "#0f172a",
        },
      };
    }
  }

  return HOUSE_THEMES.betano;
};

function getDefaultTheme() {
  return {
    id: "default",
    name: "Padrão",
    logo: "",
    colors: {
      primary: "#FFFFFF",
      primaryLight: "#F5F5F5",
      primaryDark: "#E0E0E0",
      secondary: "#FFFFFF",
      accent: "#F0F0F0",
      background: "#0f172a",
    },
  };
}

export function HouseProvider({ children }: { children: React.ReactNode }) {
  const [selectedHouse, setSelectedHouse] = useState<string>("default");
  const [theme, setTheme] = useState<HouseTheme>(getDefaultTheme());
  const [initialized, setInitialized] = useState(false);
  const { houses, loading: housesLoading } = useHouses();

  // Effect 1: Load saved house and apply theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("selectedHouse");

    if (saved) {
      // Set house immediately (whether predefined or UUID)
      setSelectedHouse(saved);

      if (HOUSE_THEMES[saved]) {
        // If it's a predefined theme, use it immediately
        const savedTheme = HOUSE_THEMES[saved];
        setTheme(savedTheme);
        applyThemeColors(savedTheme);
      }
      // If it's a UUID, the Effect 2 will load the theme from houses list
    } else {
      // Apply default theme if nothing saved
      applyThemeColors(getDefaultTheme());
    }
  }, []);

  // Effect 2: Load dynamic house theme if needed (for UUID houses)
  useEffect(() => {
    const saved = localStorage.getItem("selectedHouse");
    if (saved && !HOUSE_THEMES[saved] && houses.length > 0) {
      const theme = getThemeForHouse(saved, houses);
      setTheme(theme);
      applyThemeColors(theme);
    }
  }, [houses]);

  // Effect 3: Auto-select first house if none is selected (only once on mount)
  useEffect(() => {
    if (initialized || housesLoading || houses.length === 0) return;

    if (selectedHouse === "default") {
      const firstHouse = houses[0];
      if (firstHouse) {
        setSelectedHouse(firstHouse.id);
        localStorage.setItem("selectedHouse", firstHouse.id);

        const newTheme = getThemeForHouse(firstHouse.id, houses);
        setTheme(newTheme);
        applyThemeColors(newTheme);
      }
      setInitialized(true);
    } else {
      setInitialized(true);
    }
  }, [housesLoading, houses, initialized, selectedHouse]);

  const applyThemeColors = (themeToApply: HouseTheme) => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", themeToApply.colors.primary);
    root.style.setProperty("--color-primary-light", themeToApply.colors.primaryLight);
    root.style.setProperty("--color-primary-dark", themeToApply.colors.primaryDark);
    root.style.setProperty("--color-accent", themeToApply.colors.accent);
  };

  const handleSetSelectedHouse = (houseId: string) => {
    setSelectedHouse(houseId);
    localStorage.setItem("selectedHouse", houseId);

    const newTheme = getThemeForHouse(houseId, houses);
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
