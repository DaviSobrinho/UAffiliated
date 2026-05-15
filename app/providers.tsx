"use client";

import { HouseProvider } from "@/context/HouseContext";
import { LogoProvider } from "@/context/LogoContext";
import { BalanceProvider } from "@/context/BalanceContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HouseProvider>
      <LogoProvider>
        <BalanceProvider>{children}</BalanceProvider>
      </LogoProvider>
    </HouseProvider>
  );
}
