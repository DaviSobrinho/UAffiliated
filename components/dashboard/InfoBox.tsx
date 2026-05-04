"use client";

import { TrendingUp } from "lucide-react";
import { useHouse } from "@/context/HouseContext";

interface InfoBoxProps {
  title: string;
  message: string;
}

export default function InfoBox({ title, message }: InfoBoxProps) {
  const { theme } = useHouse();

  return (
    <div
      className="bg-zinc-900 border rounded-lg md:rounded-xl p-4 flex items-start gap-3"
      style={{
        borderColor: theme.colors.primary,
        boxShadow: `0 8px 32px ${theme.colors.primary}30, 0 0 20px ${theme.colors.primary}15`,
      }}
    >
      <TrendingUp size={18} className="shrink-0 mt-0.5" style={{ color: theme.colors.primary }} />
      <div>
        <p className="text-white font-medium text-sm mb-1">{title}</p>
        <p className="text-zinc-400 text-xs md:text-sm">{message}</p>
      </div>
    </div>
  );
}
