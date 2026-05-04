"use client";

import { TrendingUp, CheckCircle } from "lucide-react";
import { useHouse } from "@/context/HouseContext";

export default function CommissionStructureInfo() {
  const { theme } = useHouse();

  return (
    <div
      className="rounded-lg p-6 border bg-zinc-900/50 transition-all duration-300 space-y-4"
      style={{
        borderColor: theme.colors.primary,
        boxShadow: `0 0 15px ${theme.colors.primary}20`,
      }}
    >
      <h3 className="text-white font-bold text-lg flex items-center gap-3">
        <TrendingUp size={20} style={{ color: theme.colors.primary }} />
        Como funciona a comissão em rede (até 3 níveis)
      </h3>

      <div className="space-y-3 text-sm text-zinc-300">
        <p>
          Você tem um CPA máximo (ex: R$100) e pode repassar um CPA menor para cada afiliado.
        </p>
        <p>
          A sua comissão é sempre a diferença (margem) entre um nível e o próximo.
        </p>

        <div className="bg-zinc-800/50 rounded-lg p-4 my-4">
          <p className="text-zinc-400 font-medium mb-3">Exemplo: 100 → 70 → 50</p>
          <div className="space-y-2 text-xs text-zinc-400">
            <p>
              • Quando o afiliado direto gera 1 QFTD:
              <br />
              Ele recebe R$70 e você fica com R$30 (100 − 70).
            </p>
            <p>
              • Quando o indicado dele (2º nível) gera 1 QFTD:
              <br />
              Ele recebe R$50, quem indicou ele fica com R$20 (70 − 50) e você continua com R$30 (100 − 70).
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-start">
          <CheckCircle size={16} style={{ color: theme.colors.primary }} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-medium">Ou seja:</span> cada nível ganha a própria margem, e o total sempre fecha no seu CPA máximo.
          </p>
        </div>
      </div>
    </div>
  );
}
