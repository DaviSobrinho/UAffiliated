"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, BarChart3, Zap, DollarSign } from "lucide-react";
import ChartCard from "./ChartCard";
import { useHouse } from "@/context/HouseContext";

const COLORS = ["#3b82f6", "#f59e0b", "#10b981"];

interface CommissionChartProps {
  data: { date: string; value: number }[];
}

export function CommissionChart({ data }: CommissionChartProps) {
  const { theme } = useHouse();

  const formatDate = (dateStr: string): string => {
    const [, month, day] = dateStr.split("-");
    return `${day}/${month}`;
  };

  const formattedData = data.map((d) => ({
    ...d,
    date: formatDate(d.date),
  }));

  return (
    <ChartCard title="Evolução de Comissões">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign size={20} style={{ color: theme.colors.primary }} />
        <span className="text-xs text-zinc-400">Comissões em R$</span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: "11px" }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: "11px" }} width={40} label={{ value: "R$", angle: -90, position: "insideLeft" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1f2937", border: `1px solid ${theme.colors.primary}`, borderRadius: "6px" }}
            labelStyle={{ color: "#fff" }}
            formatter={(value: any) => `R$ ${value.toLocaleString("pt-BR")}`}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={theme.colors.primary}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface ComparativeChartProps {
  current: number;
  previous: number;
}

export function ComparativeChart({ current, previous }: ComparativeChartProps) {
  const { theme } = useHouse();

  const monthlyData = [
    { period: "Período Anterior", value: previous },
    { period: "Período Atual", value: current },
  ];

  return (
    <ChartCard title="Comparativo Mensal">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={20} style={{ color: theme.colors.primary }} />
        <span className="text-xs text-zinc-400">Comparação de períodos</span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="period" stroke="#9ca3af" style={{ fontSize: "11px" }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: "11px" }} width={40} label={{ value: "R$", angle: -90, position: "insideLeft" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1f2937", border: `1px solid ${theme.colors.primary}`, borderRadius: "6px" }}
            labelStyle={{ color: "#fff" }}
            formatter={(value: any) => `R$ ${value.toLocaleString("pt-BR")}`}
          />
          <Bar dataKey="value" fill={theme.colors.primary} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface FunnelChartProps {
  registros: number;
  ftds: number;
  qftds: number;
}

export function FunnelChart({ registros, ftds, qftds }: FunnelChartProps) {
  const { theme } = useHouse();

  const funnelData = [
    { name: "Cadastros", value: registros },
    { name: "FTDs", value: ftds },
    { name: "QFTDs", value: qftds },
  ];

  return (
    <ChartCard title="Funil de Conversão">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={20} style={{ color: theme.colors.primary }} />
        <span className="text-xs text-zinc-400">Taxa de conversão</span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={funnelData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            fill={theme.colors.primary}
            dataKey="value"
          >
            {funnelData.map((entry) => {
              const colorIndex = funnelData.indexOf(entry);
              return (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={[theme.colors.primary, theme.colors.primaryLight, theme.colors.primaryDark][colorIndex]}
                />
              );
            })}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: "#1f2937", border: `1px solid ${theme.colors.primary}`, borderRadius: "6px" }}
            labelStyle={{ color: "#fff" }}
            formatter={(value: any) => `${value}`}
            labelFormatter={(label: any) => `${label}`}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-4">
        {funnelData.map((item) => {
          const colorIndex = funnelData.indexOf(item);
          return (
            <div key={`funnel-${item.name}`} className="text-center">
              <div
                className="w-2.5 h-2.5 rounded-full mx-auto mb-1"
                style={{
                  backgroundColor: [theme.colors.primary, theme.colors.primaryLight, theme.colors.primaryDark][
                    colorIndex
                  ],
                }}
              />
              <p className="text-xs text-zinc-400">{item.name}</p>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
