"use client";

import StatCard from "@/components/cards/StatCard";
import { Users } from "lucide-react";
import { useHouse } from "@/context/HouseContext";

interface AdminStatsProps {
  totalUsers: number;
}

export default function AdminStats({ totalUsers }: AdminStatsProps) {
  const { theme } = useHouse();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Users size={20} style={{ color: theme.colors.primary }} />
        <h2 className="text-lg md:text-xl font-bold text-white">Visão Geral do Sistema</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <StatCard label="Total de Usuários" value={totalUsers} />
        <StatCard label="Usuários Ativos" value={0} />
        <StatCard label="Receita Total" value="R$ 0,00" accent={true} />
      </div>
    </div>
  );
}
