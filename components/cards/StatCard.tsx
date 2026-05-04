"use client";

import { useHouse } from "@/context/HouseContext";

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

export default function StatCard({ label, value, accent = false }: StatCardProps) {
  const { theme } = useHouse();

  return (
    <div
      className="bg-zinc-900 border rounded-lg p-3 md:p-4 text-center transition-all duration-300 ease-out hover:scale-105"
      style={{
        borderColor: theme.colors.primary,
        boxShadow: `0 0 15px ${theme.colors.primary}${accent ? "40" : "20"}`,
        transformOrigin: "center",
      }}
    >
      <p className="text-zinc-400 text-xs md:text-sm mb-2">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
