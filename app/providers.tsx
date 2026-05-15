"use client";

console.log("[PROVIDERS] 🔌 Providers carregando...");

import { HouseProvider } from "@/context/HouseContext";
import { LogoProvider } from "@/context/LogoContext";

console.log("[PROVIDERS] ✓ HouseProvider importado");

export function Providers({ children }: { children: React.ReactNode }) {
  console.log("[PROVIDERS] 🎬 Providers renderizando...");
  return (
    <HouseProvider>
      <LogoProvider>{children}</LogoProvider>
    </HouseProvider>
  );
}
