"use client";

import { useHouse } from "@/context/HouseContext";

interface TeamAgreementCardProps {
  cpa: string;
}

export default function TeamAgreementCard({ cpa }: TeamAgreementCardProps) {
  const { theme } = useHouse();

  return (
    <div
      className="rounded-lg p-6 border bg-gradient-to-br from-zinc-900 to-zinc-950 transition-all duration-300 hover:scale-102"
      style={{
        borderColor: theme.colors.primary,
        boxShadow: `0 0 20px ${theme.colors.primary}30`,
      }}
    >
      <p className="text-xs text-zinc-400 font-medium tracking-wide uppercase mb-2">
        Meu Acordo
      </p>
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{cpa}</h2>
      <p className="text-sm text-zinc-400 font-medium mb-3">CPA</p>
      <p className="text-xs text-zinc-500 leading-relaxed">
        Esse é o valor que você recebe por cada QFTD e o máximo que pode repassar aos seus afiliados diretos (N1).
      </p>
    </div>
  );
}
