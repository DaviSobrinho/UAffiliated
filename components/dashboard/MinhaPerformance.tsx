import StatCard from "@/components/cards/StatCard";

interface MinhaPerformanceProps {
  registros: number;
  ftds: number;
  qftds: number;
  cpa: string;
  reu: string;
}

export default function MinhaPerformance({
  registros,
  ftds,
  qftds,
  cpa,
  reu,
}: MinhaPerformanceProps) {
  return (
    <div>

      <div className="grid grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Registros" value={registros} />
        <StatCard label="FTDs" value={ftds} />
        <StatCard label="QFTDs" value={qftds} />
        <StatCard label="CPA" value={cpa} accent />
      </div>

      <div className="mt-4">
        <StatCard label="Comissão" value={reu} hoverScale="small" />
      </div>
    </div>
  );
}
