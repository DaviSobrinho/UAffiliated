"use client";

import { useHouse } from "@/context/HouseContext";

interface BalanceCardProps {
  title: string;
  amount: string;
  subtitle: string;
  variant?: "primary" | "secondary";
}

export default function BalanceCard({
  title,
  amount,
  subtitle,
  variant = "primary",
}: BalanceCardProps) {
  const { theme } = useHouse();

  return (
    <div
      className="rounded-xl md:rounded-2xl p-6 md:p-8 bg-zinc-900 text-white border transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl"
      style={{
        borderColor: theme.colors.primary,
        borderWidth: "2px",
        boxShadow: `0 8px 32px ${theme.colors.primary}35, 0 0 20px ${theme.colors.primary}25`,
        transformOrigin: "center",
      }}
    >
      <p className="text-zinc-400 text-xs md:text-sm mb-2">{title}</p>
      <h2 className="text-2xl md:text-4xl font-bold mb-1">{amount}</h2>
      <p className="text-zinc-400 text-xs md:text-sm">{subtitle}</p>
    </div>
  );
}
