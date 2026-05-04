"use client";

import StatCard from "@/components/cards/StatCard";

interface TeamPerformanceProps {
  registros: number;
  ftds: number;
  qftds: number;
  comissao: string;
}

export default function TeamPerformance({
  registros,
  ftds,
  qftds,
  comissao,
}: TeamPerformanceProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-white mb-4">
          Performance da Equipe
        </h2>
        <p className="text-sm text-zinc-400 -mt-3 mb-4">
          Resultados dos meus afiliados e subafiliados
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Registros Equipe" value={registros} />
        <StatCard label="FTDs Equipe" value={ftds} />
        <StatCard label="QFTDs Equipe" value={qftds} />
        <StatCard label="Comissão da Equipe" value={comissao} accent={true} />
      </div>
    </div>
  );
}
