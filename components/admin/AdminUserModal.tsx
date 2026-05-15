"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus } from "lucide-react";
import { useHouse } from "@/context/HouseContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import StatelessHouseSelector from "@/components/StatelessHouseSelector";
import AdminEditSnapshotModal from "./AdminEditSnapshotModal";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface DailySnapshot {
  id: string;
  userId: string;
  houseId: string;
  date: string;
  registros: number;
  ftds: number;
  qftds: number;
  revenue: string;
}

interface AdminUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const PERIODS = [
  { value: "7d", label: "Últimos 7 dias", days: 7 },
  { value: "30d", label: "Últimos 30 dias", days: 30 },
  { value: "3m", label: "Últimos 3 meses", days: 90 },
  { value: "6m", label: "Últimos 6 meses", days: 180 },
  { value: "1y", label: "Último ano", days: 365 },
];

const getCurrentMonth = () => new Date().getMonth() + 1;
const getCurrentYear = () => new Date().getFullYear();

export default function AdminUserModal({
  user,
  isOpen,
  onClose,
  onUpdated,
}: AdminUserModalProps) {
  const { theme, selectedHouse: globalSelectedHouse, setSelectedHouse: setGlobalSelectedHouse } = useHouse();
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedHouse, setSelectedHouse] = useState(globalSelectedHouse);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDate, setEditDate] = useState<string | undefined>();
  const [editData, setEditData] = useState<any>();
  const [affiliateLink, setAffiliateLink] = useState("");
  const [savingLink, setSavingLink] = useState(false);
  const [linkMessage, setLinkMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [balance, setBalance] = useState<string>("");
  const [savingBalance, setSavingBalance] = useState(false);
  const [balanceMessage, setBalanceMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isChildLoading, setIsChildLoading] = useState(false);
  const previousHouseRef = useRef<string>(globalSelectedHouse);

  const handleHouseChange = (newHouseId: string) => {
    setSelectedHouse(newHouseId);
    setGlobalSelectedHouse(newHouseId);
  };

  const fetchAffiliateLink = async (houseId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/house-data?houseId=${houseId}`);
      if (response.ok) {
        const data = await response.json();
        setAffiliateLink(data.userHouseData?.affiliateLink || "");
        setBalance(String(data.userHouseData?.balance || "0"));
      } else {
        setAffiliateLink("");
        setBalance("0");
      }
    } catch (err) {
      console.error("[AFFILIATE] Erro ao buscar link:", err);
      setAffiliateLink("");
      setBalance("0");
    }
  };

  const saveAffiliateLink = async () => {
    try {
      setSavingLink(true);
      setLinkMessage(null);

      const response = await fetch(`/api/admin/users/${user.id}/house-data`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          houseId: selectedHouse,
          affiliateLink,
        }),
      });

      if (response.ok) {
        console.log("[AFFILIATE] Link salvo com sucesso");
        setLinkMessage({ type: "success", text: "Link de afiliado salvo com sucesso!" });
        setTimeout(() => setLinkMessage(null), 3000);
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error || "Erro ao salvar link";
        console.error("[AFFILIATE] Erro ao salvar link:", response.status, errorMsg);
        setLinkMessage({ type: "error", text: errorMsg });
      }
    } catch (err) {
      console.error("[AFFILIATE] Erro ao salvar link:", err);
      setLinkMessage({ type: "error", text: "Erro ao salvar link de afiliado" });
    } finally {
      setSavingLink(false);
    }
  };

  const saveBalance = async () => {
    try {
      setSavingBalance(true);
      setBalanceMessage(null);

      const response = await fetch(`/api/admin/users/${user.id}/house-data`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          houseId: selectedHouse,
          balance: parseFloat(balance),
        }),
      });

      if (response.ok) {
        console.log("[BALANCE] Saldo salvo com sucesso");
        setBalanceMessage({ type: "success", text: "Saldo atualizado com sucesso!" });
        setTimeout(() => setBalanceMessage(null), 3000);
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error || "Erro ao salvar saldo";
        console.error("[BALANCE] Erro ao salvar saldo:", response.status, errorMsg);
        setBalanceMessage({ type: "error", text: errorMsg });
      }
    } catch (err) {
      console.error("[BALANCE] Erro ao salvar saldo:", err);
      setBalanceMessage({ type: "error", text: "Erro ao salvar saldo" });
    } finally {
      setSavingBalance(false);
    }
  };

  const fetchSnapshots = async (houseId: string, timeframe: string = "30d") => {
    try {
      setLoading(true);
      const url = `/api/admin/users/${user.id}/snapshots?houseId=${houseId}&timeframe=${timeframe}`;
      const startTime = performance.now();
      console.log(`[GRAPH] Iniciando fetch de snapshots (${timeframe})...`);
      const response = await fetch(url);
      const endTime = performance.now();
      console.log(`[GRAPH] ✓ Snapshots fetched em ${(endTime - startTime).toFixed(0)}ms`);
      if (response.ok) {
        const data = await response.json();
        console.log(`[GRAPH] ✓ ${data.snapshots.length} registros carregados, atualizando gráfico...`);
        setSnapshots(data.snapshots || []);
      } else {
        console.error("[GRAPH] Erro ao buscar:", response.status);
        setSnapshots([]);
      }
    } catch (err) {
      console.error("[GRAPH] Erro ao buscar snapshots:", err);
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedHouse(globalSelectedHouse);
      fetchSnapshots(globalSelectedHouse, selectedPeriod);
      fetchAffiliateLink(globalSelectedHouse);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedHouse !== previousHouseRef.current) {
      previousHouseRef.current = selectedHouse;
      fetchSnapshots(selectedHouse, selectedPeriod);
      fetchAffiliateLink(selectedHouse);
    }
  }, [selectedHouse, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchSnapshots(selectedHouse, selectedPeriod);
    }
  }, [selectedPeriod, isOpen]);

  const handleChartClick = (data: any) => {
    const snapshot = snapshots.find(s => {
      const sDate = new Date(s.date).toISOString().split('T')[0];
      const chartDate = data.date.toISOString().split('T')[0];
      return sDate === chartDate;
    });

    if (snapshot) {
      setEditDate(snapshot.date);
      setEditData({
        registros: snapshot.registros,
        ftds: snapshot.ftds,
        qftds: snapshot.qftds,
      });
      setEditModalOpen(true);
    }
  };

  const handleSnapshotClick = (snapshot: DailySnapshot) => {
    setEditDate(snapshot.date);
    setEditData({
      registros: snapshot.registros,
      ftds: snapshot.ftds,
      qftds: snapshot.qftds,
    });
    setEditModalOpen(true);
  };

  const handleNewLançamento = () => {
    setEditDate(undefined);
    setEditData(undefined);
    setEditModalOpen(true);
  };

  const getPeriodDays = () => {
    const period = PERIODS.find(p => p.value === selectedPeriod);
    return period?.days || 30;
  };

  const filterSnapshotsByPeriod = () => {
    const now = new Date();
    const days = getPeriodDays();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return snapshots.filter(s => {
      const sDate = new Date(s.date);
      return sDate >= startDate && sDate <= now;
    });
  };

  const chartData = filterSnapshotsByPeriod()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(s => {
      const sDate = new Date(s.date);
      // Extrair a data em UTC e criar uma data em timezone local com o mesmo dia/mês/ano
      const year = sDate.getUTCFullYear();
      const month = sDate.getUTCMonth();
      const day = sDate.getUTCDate();
      const localDate = new Date(year, month, day);
      return {
        date: localDate,
        registros: s.registros,
        ftds: s.ftds,
        qftds: s.qftds,
      };
    });

  console.log(`[GRAPH] chartData atualizado com ${chartData.length} pontos, snapshots totais: ${snapshots.length}`);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
        <div
          className="bg-zinc-900 rounded-lg border w-full max-w-5xl max-h-[90vh] flex flex-col"
          style={{ borderColor: theme.colors.primary }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b shrink-0" style={{ borderColor: theme.colors.primary }}>
            <div>
              <h2 className="text-lg font-bold text-white">{user.name}</h2>
              <p className="text-sm text-zinc-400">{user.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Seletor de Casa */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">Casa de Aposta</label>
              <StatelessHouseSelector
                value={selectedHouse}
                onChange={handleHouseChange}
                primaryColor={theme.colors.primary}
                disabled={isChildLoading || loading}
              />
            </div>

            {/* Link de Afiliado */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">Link de Afiliado</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={affiliateLink}
                  onChange={(e) => setAffiliateLink(e.target.value)}
                  placeholder="https://exemplo.com/ref/usuario"
                  className="flex-1 px-4 py-2 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition text-sm"
                  style={{
                    borderColor: theme.colors.primary,
                    "--tw-ring-color": theme.colors.primary,
                  } as React.CSSProperties}
                />
                <button
                  onClick={saveAffiliateLink}
                  disabled={savingLink}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg text-white font-medium transition border hover:bg-zinc-800/50 disabled:opacity-50 whitespace-nowrap"
                  style={{
                    borderColor: theme.colors.primary,
                    boxShadow: `0 0 12px ${theme.colors.primary}30`,
                  }}
                >
                  {savingLink ? "Salvando..." : "Salvar"}
                </button>
              </div>
              {linkMessage && (
                <div
                  className={`mt-2 px-3 py-2 rounded text-sm font-medium transition ${
                    linkMessage.type === "success"
                      ? "bg-green-500/10 text-green-300 border border-green-500/30"
                      : "bg-red-500/10 text-red-300 border border-red-500/30"
                  }`}
                >
                  {linkMessage.type === "success" ? "✓ " : "✕ "}
                  {linkMessage.text}
                </div>
              )}
            </div>

            {/* Saldo Atual */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">Saldo Atual</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-4 py-2 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition text-sm"
                  style={{
                    borderColor: theme.colors.primary,
                    "--tw-ring-color": theme.colors.primary,
                  } as React.CSSProperties}
                />
                <button
                  onClick={saveBalance}
                  disabled={savingBalance}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg text-white font-medium transition border hover:bg-zinc-800/50 disabled:opacity-50 whitespace-nowrap"
                  style={{
                    borderColor: theme.colors.primary,
                    boxShadow: `0 0 12px ${theme.colors.primary}30`,
                  }}
                >
                  {savingBalance ? "Salvando..." : "Salvar"}
                </button>
              </div>
              {balanceMessage && (
                <div
                  className={`mt-2 px-3 py-2 rounded text-sm font-medium transition ${
                    balanceMessage.type === "success"
                      ? "bg-green-500/10 text-green-300 border border-green-500/30"
                      : "bg-red-500/10 text-red-300 border border-red-500/30"
                  }`}
                >
                  {balanceMessage.type === "success" ? "✓ " : "✕ "}
                  {balanceMessage.text}
                </div>
              )}
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex-1">
                <label className="block text-sm text-zinc-400 mb-2 font-medium">Período</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  disabled={isChildLoading || loading}
                  className="w-full px-4 py-2 bg-zinc-800 border rounded-lg text-white focus:outline-none focus:ring-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: theme.colors.primary,
                    "--tw-ring-color": theme.colors.primary,
                  } as React.CSSProperties}
                >
                  {PERIODS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleNewLançamento}
                disabled={isChildLoading || loading}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-white font-medium transition border flex items-center justify-center sm:justify-start gap-2 hover:bg-zinc-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: theme.colors.primary,
                  boxShadow: isChildLoading || loading ? "none" : `0 0 12px ${theme.colors.primary}30`,
                }}
              >
                <Plus size={18} />
                <span className="whitespace-nowrap">Novo Lançamento</span>
              </button>
            </div>

            {/* Gráfico - sempre mostrando */}
            <div className="bg-zinc-800/50 rounded-lg p-4 border space-y-4 relative" style={{ borderColor: theme.colors.primary }}>
              <h3 className="text-sm font-semibold text-zinc-300">Histórico de Lançamentos</h3>
              {loading && (
                <div className="absolute inset-0 bg-zinc-800/50 rounded-lg flex items-center justify-center z-10">
                  <div className="text-zinc-400 text-sm">Atualizando...</div>
                </div>
              )}
              {loading && !snapshots.length ? (
                <div className="h-64 flex items-center justify-center text-zinc-400">
                  Carregando...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData} onClick={(state) => {
                    if (state && typeof state.activeTooltipIndex === 'number' && chartData[state.activeTooltipIndex]) {
                      handleChartClick(chartData[state.activeTooltipIndex]);
                    }
                  }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.primary + "30"} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                      stroke={theme.colors.primary}
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis
                      stroke={theme.colors.primary}
                      style={{ fontSize: "12px" }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: `1px solid ${theme.colors.primary}` }}
                      labelStyle={{ color: "#fff" }}
                      labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                    />
                    <Line
                      type="monotone"
                      dataKey="registros"
                      stroke={theme.colors.primary}
                      dot={{ fill: theme.colors.primary, r: 4 }}
                      activeDot={{ r: 6 }}
                      cursor="pointer"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tabela de Snapshots */}
            {chartData.length > 0 && (
              <div className="bg-zinc-800/50 rounded-lg p-4 border" style={{ borderColor: theme.colors.primary }}>
                <h4 className="text-sm font-semibold text-zinc-300 mb-3">Lançamentos ({chartData.length})</h4>
                <div
                  className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar"
                  style={{
                    scrollbarColor: `${theme.colors.primary}99 #27272a`,
                    scrollbarWidth: 'thin',
                  }}
                >
                  {filterSnapshotsByPeriod()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(snapshot => {
                      const sDate = new Date(snapshot.date);
                      return (
                        <button
                          key={snapshot.id}
                          onClick={() => handleSnapshotClick(snapshot)}
                          className="w-full text-left px-3 py-2 rounded text-xs bg-zinc-900 hover:bg-zinc-800 transition"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-white">
                              {sDate.toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-zinc-400">
                              {snapshot.registros} reg • {snapshot.ftds} FTDs • {snapshot.qftds} QFTDs
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modal para Editar/Criar */}
      <AdminEditSnapshotModal
        userId={user.id}
        houseId={selectedHouse}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSaved={() => {
          fetchSnapshots(selectedHouse, selectedPeriod);
          onUpdated();
        }}
        editDate={editDate}
        editData={editData}
        onLoadingChange={setIsChildLoading}
      />
    </>
  );
}
