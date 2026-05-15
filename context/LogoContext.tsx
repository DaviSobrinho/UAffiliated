"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface LogoContextType {
  logoUrl: string | null;
  logoLoading: boolean;
  refreshLogo: () => Promise<void>;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export function LogoProvider({ children }: { children: React.ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);

  const refreshLogo = useCallback(async () => {
    try {
      setLogoLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.logoUrl);
      }
    } catch (err) {
      console.error("Error fetching logo:", err);
    } finally {
      setLogoLoading(false);
    }
  }, []);

  return (
    <LogoContext.Provider value={{ logoUrl, logoLoading, refreshLogo }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  const context = useContext(LogoContext);
  if (context === undefined) {
    throw new Error("useLogo must be used within LogoProvider");
  }
  return context;
}
