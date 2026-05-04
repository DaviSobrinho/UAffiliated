import StatCard from "@/components/cards/StatCard";

interface MinhaPerformanceProps {
  registros: number;
  ftds: number;
  qftds: number;
  cpa: string;
  reu: string;
  totalPaguito: string;
}

export default function MinhaPerformance({
  registros,
  ftds,
  qftds,
  cpa,
  reu,
  totalPaguito,
}: MinhaPerformanceProps) {
  return (
    <div>

      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
        <StatCard label="Meus Registros" value={registros} />
        <StatCard label="Meus FTDs" value={ftds} />
        <StatCard label="Meus QFTDs" value={qftds} />
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatCard label="Meu CPA" value={cpa} accent />
        <StatCard label="Meu Rev" value={reu} />
        <StatCard label="Total Próprio" value={totalPaguito} />
      </div>
    </div>
  );
}
