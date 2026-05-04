"use client";

import { useHouse } from "@/context/HouseContext";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
}

export default function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const { theme } = useHouse();

  return (
    <div
      className="bg-zinc-950 border-b px-4 md:px-6 lg:px-8 py-4 md:py-6 mt-14 xl:mt-0"
      style={{ borderBottomColor: theme.colors.primary }}
    >
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{title}</h1>
      <p className="text-sm md:text-base text-zinc-400">{subtitle}</p>
    </div>
  );
}
