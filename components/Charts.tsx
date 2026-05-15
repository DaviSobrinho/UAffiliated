"use client";

import { useRef, useEffect, useState } from "react";
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
import { TrendingUp, BarChart3, Zap, DollarSign, ChevronDown } from "lucide-react";
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
            formatter={(value: unknown) => typeof value === "number" ? `R$ ${value.toLocaleString("pt-BR")}` : ""}
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
  metric?: "registros" | "ftds" | "qftds" | "receita";
  onMetricChange?: (metric: "registros" | "ftds" | "qftds" | "receita") => void;
}

export function ComparativeChart({ current, previous, metric = "receita", onMetricChange }: ComparativeChartProps) {
  const { theme } = useHouse();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getMetricLabel = (m: string) => {
    const labels: Record<string, string> = {
      receita: "Receita",
      registros: "Registros",
      ftds: "FTDs",
      qftds: "QFTDs",
    };
    return labels[m] || "Receita";
  };

  const getYAxisLabel = (m: string) => {
    return m === "receita" ? "R$" : "Qty";
  };

  const formatter = (value: unknown, m: string) => {
    if (typeof value !== "number") return "";
    return m === "receita" ? `R$ ${value.toLocaleString("pt-BR")}` : `${value}`;
  };

  const getMonthName = (monthOffset: number) => {
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                   "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const monthlyData = [
    { period: getMonthName(1), value: previous },
    { period: getMonthName(0), value: current },
  ];

  const percentChange = previous > 0 ? ((current - previous) / previous * 100).toFixed(1) : "0";
  const isPositive = parseFloat(percentChange) >= 0;

  const metrics = [
    { value: "receita", label: "Receita" },
    { value: "registros", label: "Registros" },
    { value: "ftds", label: "FTDs" },
    { value: "qftds", label: "QFTDs" },
  ];

  return (
    <ChartCard title="Comparativo Mensal">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <BarChart3 size={20} style={{ color: theme.colors.primary }} />
          <div ref={containerRef} className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="px-4 py-2.5 bg-zinc-900 border rounded-lg text-sm text-white text-left flex items-center gap-2 hover:bg-zinc-800 transition"
              style={{
                borderColor: theme.colors.primary,
                boxShadow: `0 0 12px ${theme.colors.primary}20`,
              }}
            >
              <span>{getMetricLabel(metric)}</span>
              <ChevronDown
                size={16}
                style={{ color: theme.colors.primary }}
                className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div
                className="absolute top-full left-0 mt-2 bg-zinc-900 border rounded-lg z-50 min-w-40"
                style={{
                  borderColor: theme.colors.primary,
                  boxShadow: `0 8px 32px ${theme.colors.primary}35`,
                }}
              >
                {metrics.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => {
                      onMetricChange?.(m.value as any);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-zinc-800/50 transition border-b last:border-b-0 border-l-4 text-white"
                    style={{
                      borderColor: theme.colors.primary,
                      borderLeftColor: metric === m.value ? theme.colors.primary : "transparent",
                      boxShadow: metric === m.value ? `inset 0 0 15px ${theme.colors.primary}30` : undefined,
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className={`text-sm font-semibold whitespace-nowrap ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {isPositive ? "+" : ""}{percentChange}%
        </div>
      </div>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="period" stroke="#9ca3af" style={{ fontSize: "11px" }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: "11px" }} width={55} label={{ value: getYAxisLabel(metric), angle: -90, position: "insideLeft", offset: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1f2937", border: `1px solid ${theme.colors.primary}`, borderRadius: "6px" }}
            labelStyle={{ color: "#fff" }}
            formatter={(value: unknown) => formatter(value, metric)}
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

  const total = registros + ftds + qftds;
  const getPercentage = (value: number) => total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  const getConversionRate = (current: number, previous: number) =>
    previous > 0 ? ((current / previous) * 100).toFixed(1) : "0";

  return (
    <ChartCard title="Funil de Conversão">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={20} style={{ color: theme.colors.primary }} />
        <span className="text-xs text-zinc-400">Distribuição e taxas de conversão</span>
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
            label={({ name, value }) => `${name}: ${value}`}
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
            formatter={(value: unknown, _name: string, props: any) => {
              if (typeof value !== "number") return "";
              const percentage = getPercentage(value);
              return [`${value} (${percentage}%)`, props.name];
            }}
            labelFormatter={(label: unknown) => `${label}`}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 flex justify-center w-full">
        <div className="flex gap-3 w-full">
          <div className="flex-1 text-center p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/40 hover:bg-zinc-800/80 transition">
            <div
              className="w-3 h-3 rounded-full mx-auto mb-2"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <p className="text-sm text-zinc-400 mb-2 font-medium">Cadastros</p>
            <p className="text-lg font-bold text-white">{registros}</p>
            <p className="text-sm text-zinc-500 mt-1">{getPercentage(registros)}%</p>
          </div>
          <div className="flex-1 text-center p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/40 hover:bg-zinc-800/80 transition">
            <div
              className="w-3 h-3 rounded-full mx-auto mb-2"
              style={{ backgroundColor: theme.colors.primaryLight }}
            />
            <p className="text-sm text-zinc-400 mb-2 font-medium">FTDs</p>
            <p className="text-lg font-bold text-white">{ftds}</p>
            <p className="text-sm text-zinc-500 mt-1">{getPercentage(ftds)}%</p>
            {registros > 0 && (
              <p className="text-sm text-orange-400 mt-2 font-semibold">↓ {getConversionRate(ftds, registros)}%</p>
            )}
          </div>
          <div className="flex-1 text-center p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/40 hover:bg-zinc-800/80 transition">
            <div
              className="w-3 h-3 rounded-full mx-auto mb-2"
              style={{ backgroundColor: theme.colors.primaryDark }}
            />
            <p className="text-sm text-zinc-400 mb-2 font-medium">QFTDs</p>
            <p className="text-lg font-bold text-white">{qftds}</p>
            <p className="text-sm text-zinc-500 mt-1">{getPercentage(qftds)}%</p>
            {ftds > 0 && (
              <p className="text-sm text-orange-400 mt-2 font-semibold">↓ {getConversionRate(qftds, ftds)}%</p>
            )}
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
