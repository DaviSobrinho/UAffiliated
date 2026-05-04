"use client";

import { useHouse } from "@/context/HouseContext";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
  const { theme } = useHouse();

  return (
    <div
      className="bg-zinc-900 border rounded-xl p-4 md:p-6"
      style={{
        borderColor: theme.colors.primary,
        boxShadow: `0 8px 32px ${theme.colors.primary}30, 0 0 20px ${theme.colors.primary}20`,
      }}
    >
      <h3 className="text-white font-semibold mb-4 text-base md:text-lg">{title}</h3>
      {children}
    </div>
  );
}
