import StatCard from "@/components/cards/StatCard";

interface TotalPerformanceProps {
  registros: number;
  ftds: number;
  qftds: number;
  comissaoTotal: string;
}

export default function TotalPerformance({
  registros,
  ftds,
  qftds,
  comissaoTotal,
}: TotalPerformanceProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-white">
          Total
        </h2>
        <p className="text-zinc-500 text-xs md:text-sm">
          Soma de tudo que você gerou (próprio + equipe)
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Registros" value={registros} />
        <StatCard label="FTDs" value={ftds} />
        <StatCard label="QFTDs" value={qftds} />
        <StatCard label="Comissão Total" value={comissaoTotal} accent />
      </div>
    </div>
  );
}
