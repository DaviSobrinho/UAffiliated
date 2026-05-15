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

  // Se é um UUID, tenta buscar o nome e cor da casa
  try {
    const res = await fetch("/api/admin/houses");
    if (res.ok) {
      const data = await res.json();
      const house = data.houses?.find((h: any) => h.id === houseId);
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
    }
  } catch (err) {
    console.error("Error fetching house theme:", err);
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

function getSavedHouseAndTheme() {
  const saved = localStorage.getItem("selectedHouse");
  // If saved is a predefined theme ID, use it immediately
  if (saved && HOUSE_THEMES[saved]) {
    return { house: saved, theme: getHouseTheme(saved) };
  }

  return { house: "default", theme: getDefaultTheme() };
}

export function HouseProvider({ children }: { children: React.ReactNode }) {
  const { house: initialHouse, theme: initialTheme } = getSavedHouseAndTheme();
  const [selectedHouse, setSelectedHouse] = useState<string>(initialHouse);
  const [theme, setTheme] = useState<HouseTheme>(initialTheme);
  const [initialized, setInitialized] = useState(false);

  // Effect 1: Apply theme colors on mount
  useEffect(() => {
    applyThemeColors(initialTheme);
  }, []);

  // Effect 2: Load dynamic house theme if needed (for UUID houses)
  useEffect(() => {
    const saved = localStorage.getItem("selectedHouse");
    if (saved && !HOUSE_THEMES[saved]) {
      getThemeForHouse(saved).then((t) => {
        setTheme(t);
        applyThemeColors(t);
      });
    }
  }, []);

  // Effect 3: Auto-select first house if none is selected (only once on mount)
  useEffect(() => {
    if (initialized) return;

    if (initialHouse === "default") {
      const fetchAndSelectFirstHouse = async () => {
        try {
          const res = await fetch("/api/admin/houses");
          if (res.ok) {
            const data = await res.json();
            const firstHouse = data.houses?.[0];
            if (firstHouse) {
              setSelectedHouse(firstHouse.id);
              localStorage.setItem("selectedHouse", firstHouse.id);

              const newTheme = await getThemeForHouse(firstHouse.id);
              setTheme(newTheme);
              applyThemeColors(newTheme);
            }
          }
        } catch (err) {
          console.error("Error fetching houses for default selection:", err);
        } finally {
          setInitialized(true);
        }
      };

      fetchAndSelectFirstHouse();
    } else {
      setInitialized(true);
    }
  }, [initialized]);

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
