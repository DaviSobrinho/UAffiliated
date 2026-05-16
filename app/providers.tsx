"use client";

import { HousesProvider } from "@/context/HousesContext";
import { HouseProvider } from "@/context/HouseContext";
import { LogoProvider } from "@/context/LogoContext";
import { BalanceProvider } from "@/context/BalanceContext";
import FaviconUpdater from "@/components/FaviconUpdater";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HousesProvider>
      <HouseProvider>
        <LogoProvider>
          <BalanceProvider>
            <FaviconUpdater />
            {children}
          </BalanceProvider>
        </LogoProvider>
      </HouseProvider>
    </HousesProvider>
  );
}
