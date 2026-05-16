"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface House {
  id: string;
  name: string;
  color: string;
  logoUrl?: string;
}

interface HousesContextType {
  houses: House[];
  loading: boolean;
}

const HousesContext = createContext<HousesContextType | undefined>(undefined);

export function HousesProvider({ children }: { children: ReactNode }) {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHouses = async () => {
    try {
      const res = await fetch("/api/admin/houses");
      if (res.ok) {
        const data = await res.json();
        setHouses(data.houses || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouses();
    const interval = setInterval(fetchHouses, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <HousesContext.Provider value={{ houses, loading }}>
      {children}
    </HousesContext.Provider>
  );
}

export function useHouses() {
  const context = useContext(HousesContext);
  if (context === undefined) {
    throw new Error("useHouses must be used within HousesProvider");
  }
  return context;
}
