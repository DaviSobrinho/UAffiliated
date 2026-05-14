import StatCard from "@/components/cards/StatCard";

interface PerformanceEquipeProps {
  registros: number;
  ftds: number;
  qftds: number;
  comissaoEquipe: string;
  userName: string;
}

export default function PerformanceEquipe({
  registros,
  ftds,
  qftds,
  comissaoEquipe,
  userName,
}: PerformanceEquipeProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-white">
          Performance da Equipe de {userName}
        </h2>
        <p className="text-zinc-500 text-xs md:text-sm">
          Resultados dos afiliados abaixo de você
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Registros" value={registros} />
        <StatCard label="FTDs" value={ftds} />
        <StatCard label="QFTDs" value={qftds} />
        <StatCard label="Comissão" value={comissaoEquipe} accent />
      </div>
    </div>
  );
}
