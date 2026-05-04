"use client";

import { HouseProvider } from "@/context/HouseContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <HouseProvider>{children}</HouseProvider>;
}
