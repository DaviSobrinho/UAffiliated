import StatCard from "@/components/cards/StatCard";

interface PerformanceEquipeProps {
  registros: number;
  ftds: number;
  qftds: number;
  comissao: string;
}

export default function PerformanceEquipe({
  registros,
  ftds,
  qftds,
  comissao,
}: PerformanceEquipeProps) {
  return (
    <div>
      <p className="text-zinc-500 text-xs md:text-sm mb-4">
        Resultados dos meus afiliados e subafiliados
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Registros Equipe" value={registros} />
        <StatCard label="FTDs Equipe" value={ftds} />
        <StatCard label="QFTDs Equipe" value={qftds} />
        <StatCard label="Comissão Equipe" value={comissao} accent />
      </div>
    </div>
  );
}
