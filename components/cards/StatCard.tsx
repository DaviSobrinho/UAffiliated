"use client";

import { useHouse } from "@/context/HouseContext";

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: boolean;
  hoverScale?: "up" | "down" | "none" | "small";
}

export default function StatCard({ label, value, accent = false, hoverScale = "up" }: StatCardProps) {
  const { theme } = useHouse();
  const hoverClass =
    hoverScale === "down" ? "hover:scale-95" :
    hoverScale === "none" ? "" :
    hoverScale === "small" ? "hover:scale-102" :
    "hover:scale-105";

  return (
    <div
      className={`bg-zinc-900 border rounded-lg p-3 md:p-4 text-center transition-all duration-300 ease-out ${hoverClass}`}
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
