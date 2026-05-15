"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useHouse } from "@/context/HouseContext";
import { getHouseTheme } from "@/lib/houseThemes";
import { SkeletonBox, SkeletonLine } from "@/components/Skeleton";
import StatelessHouseSelector from "@/components/StatelessHouseSelector";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface UserHouseData {
  id: string;
  houseId: string;
  houseName: string;
  cpa: number;
  affiliateLink: string;
  registros: number;
  ftds: number;
  qftds: number;
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

interface FormErrors {
  cpa?: string;
  affiliateLink?: string;
}

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const getCurrentYear = () => new Date().getFullYear();
const getCurrentMonth = () => new Date().getMonth() + 1;

export default function AdminUserModal({
  user,
  isOpen,
  onClose,
  onUpdated,
}: AdminUserModalProps) {
  const { theme, selectedHouse: globalSelectedHouse } = useHouse();
  const [selectedHouse, setSelectedHouse] = useState(globalSelectedHouse);
  const [houseData, setHouseData] = useState<UserHouseData | null>(null);
  const [formData, setFormData] = useState<Partial<UserHouseData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedDay, setSelectedDay] = useState(1);
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const previousHouseRef = useRef<string>(globalSelectedHouse);

  const fetchSnapshots = async (houseId: string, month: number, year: number) => {
    try {
      setSnapshotsLoading(true);
      const response = await fetch(
        `/api/admin/users/${user.id}/snapshot?houseId=${houseId}&month=${month}&year=${year}`
      );
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data.snapshots || []);
      }
    } catch (err) {
      console.error("Error fetching snapshots:", err);
      setSnapshots([]);
    } finally {
      setSnapshotsLoading(false);
    }
  };

  const fetchHouseData = async (houseId: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/users/${user.id}/house-data?houseId=${houseId}`
      );
      if (response.ok) {
        const data = await response.json();
        setHouseData(data.houseData);
        setFormData(data.houseData || {});
      } else if (response.status === 404) {
        setHouseData(null);
        setFormData({});
      }
    } catch (err) {
      console.error("Error fetching house data:", err);
      setError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Abre o modal: inicia com a casa global selecionada
  useEffect(() => {
    if (isOpen) {
      setSelectedHouse(globalSelectedHouse);
      previousHouseRef.current = globalSelectedHouse;
      fetchHouseData(globalSelectedHouse);
      fetchSnapshots(globalSelectedHouse, selectedMonth, selectedYear);
    } else {
      setHouseData(null);
      setFormData({});
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  // Monitora mudança de casa: só carrega quando muda diferente
  useEffect(() => {
    if (selectedHouse !== previousHouseRef.current) {
      previousHouseRef.current = selectedHouse;
      fetchHouseData(selectedHouse);
      fetchSnapshots(selectedHouse, selectedMonth, selectedYear);
    }
  }, [selectedHouse]);

  // Busca snapshots quando mês ou ano mudam
  useEffect(() => {
    if (selectedHouse) {
      fetchSnapshots(selectedHouse, selectedMonth, selectedYear);
    }
  }, [selectedMonth, selectedYear]);

  const handleChartClick = (data: any) => {
    const date = new Date(data.date);
    setSelectedDay(date.getDate());
    const snapshotData = snapshots.find(s => {
      const sDate = new Date(s.date);
      return sDate.getDate() === date.getDate();
    });
    if (snapshotData) {
      setFormData({
        ...formData,
        registros: snapshotData.registros,
        ftds: snapshotData.ftds,
        qftds: snapshotData.qftds,
      });
    }
  };

  const handleSnapshotClick = (snapshot: DailySnapshot) => {
    const date = new Date(snapshot.date);
    setSelectedDay(date.getDate());
    setFormData({
      ...formData,
      registros: snapshot.registros,
      ftds: snapshot.ftds,
      qftds: snapshot.qftds,
    });
  };

  const chartData = Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => {
    const day = i + 1;
    const snapshot = snapshots.find(s => {
      const sDate = new Date(s.date);
      return sDate.getDate() === day;
    });
    return {
      date: new Date(selectedYear, selectedMonth - 1, day),
      day,
      registros: snapshot?.registros || 0,
      ftds: snapshot?.ftds || 0,
      qftds: snapshot?.qftds || 0,
    };
  }).filter(item => item.registros > 0 || item.ftds > 0 || item.qftds > 0);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.cpa) {
      errors.cpa = "CPA é obrigatório";
    } else if (typeof formData.cpa === "number" && formData.cpa < 5) {
      errors.cpa = "O valor mínimo é R$ 5,00";
    }

    if (!formData.affiliateLink) {
      errors.affiliateLink = "Link de afiliado é obrigatório";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCpaOnBlur = (value: number | undefined) => {
    if (value !== undefined && value < 5) {
      setFormErrors({ ...formErrors, cpa: "O valor mínimo é R$ 5,00" });
    } else {
      setFormErrors({ ...formErrors, cpa: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/house-data`, {
        method: houseData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          houseId: selectedHouse,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao salvar");
        setLoading(false);
        return;
      }

      // If registros, ftds, or qftds are provided, also save a DailySnapshot
      if (formData.registros !== undefined || formData.ftds !== undefined || formData.qftds !== undefined) {
        const snapshotDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

        try {
          await fetch(`/api/admin/users/${user.id}/snapshot`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              houseId: selectedHouse,
              date: snapshotDate,
              registros: formData.registros || 0,
              ftds: formData.ftds || 0,
              qftds: formData.qftds || 0,
            }),
          });
        } catch (snapshotErr) {
          console.error("Erro ao salvar snapshot:", snapshotErr);
        }
      }

      setSuccess("Dados salvos com sucesso!");
      setLoading(false);

      setTimeout(() => {
        onUpdated();
        onClose();
      }, 800);
    } catch (err) {
      setError("Erro ao salvar dados");
      console.error(err);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-zinc-900 rounded-lg border w-full max-w-lg max-h-[90vh] flex flex-col"
        style={{ borderColor: theme.colors.primary }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: theme.colors.primary }}>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Gráfico Interativo */}
          {!loading && snapshots.length > 0 && (
            <div className="bg-zinc-800/50 rounded-lg p-4 border" style={{ borderColor: theme.colors.primary }}>
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Histórico de Lançamentos</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} onClick={(state) => {
                  if (state && state.activeTooltipIndex !== undefined && chartData[state.activeTooltipIndex]) {
                    handleChartClick(chartData[state.activeTooltipIndex]);
                  }
                }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.primary + "30"} />
                  <XAxis
                    dataKey="day"
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

              {/* Tabela de Snapshots */}
              {snapshots.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-zinc-400 mb-2">Clique em um dia para editar</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {snapshots.map((snapshot) => {
                      const sDate = new Date(snapshot.date);
                      const isSelected = selectedDay === sDate.getDate();
                      return (
                        <button
                          key={snapshot.id}
                          type="button"
                          onClick={() => handleSnapshotClick(snapshot)}
                          className={`w-full text-left px-3 py-2 rounded text-xs transition ${
                            isSelected
                              ? "bg-zinc-700"
                              : "bg-zinc-900 hover:bg-zinc-800"
                          }`}
                          style={isSelected ? { backgroundColor: theme.colors.primary + "20" } : {}}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              Dia {String(sDate.getDate()).padStart(2, "0")}
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
          )}

          {loading ? (
            <div className="space-y-4">
              <SkeletonLine width="30%" height="1rem" />
              <SkeletonBox height="2.5rem" />
              <SkeletonLine width="30%" height="1rem" />
              <div className="grid grid-cols-2 gap-3">
                <SkeletonBox height="2.5rem" />
                <SkeletonBox height="2.5rem" />
              </div>
              <SkeletonLine width="30%" height="1rem" />
              <SkeletonBox height="2.5rem" />
              <SkeletonLine width="30%" height="1rem" />
              <SkeletonBox height="2.5rem" />
              <SkeletonLine width="30%" height="1rem" />
              <div className="grid grid-cols-3 gap-3">
                <SkeletonBox height="3rem" />
                <SkeletonBox height="3rem" />
                <SkeletonBox height="3rem" />
              </div>
            </div>
          ) : (
            <>


              {/* Casa Selector - Simples sem gatilhos */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2 font-medium">Casa de Aposta</label>
                <StatelessHouseSelector
                  value={selectedHouse}
                  onChange={(newHouse) => {
                    if (newHouse !== previousHouseRef.current) {
                      setSelectedHouse(newHouse);
                    }
                  }}
                  primaryColor={theme.colors.primary}
                />
              </div>

              {/* Day, Month and Year Selectors */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2 font-medium">Dia</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-zinc-800 border rounded-lg text-white focus:outline-none focus:ring-2 transition cursor-pointer"
                    style={{
                      borderColor: theme.colors.primary,
                      "--tw-ring-color": theme.colors.primary,
                    } as React.CSSProperties}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {String(day).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2 font-medium">Mês</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-zinc-800 border rounded-lg text-white focus:outline-none focus:ring-2 transition cursor-pointer"
                    style={{
                      borderColor: theme.colors.primary,
                      "--tw-ring-color": theme.colors.primary,
                    } as React.CSSProperties}
                  >
                    {MONTHS.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2 font-medium">Ano</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-zinc-800 border rounded-lg text-white focus:outline-none focus:ring-2 transition cursor-pointer"
                    style={{
                      borderColor: theme.colors.primary,
                      "--tw-ring-color": theme.colors.primary,
                    } as React.CSSProperties}
                  >
                    {Array.from({ length: 5 }, (_, i) => getCurrentYear() - 2 + i).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CPA */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2 font-medium">CPA (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cpa || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, cpa: e.target.value ? parseFloat(e.target.value) : undefined });
                    setFormErrors({ ...formErrors, cpa: undefined });
                  }}
                  onBlur={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    validateCpaOnBlur(value);
                  }}
                  placeholder="5.00"
                  className={`w-full px-4 py-2 bg-zinc-800 border rounded-lg text-white focus:outline-none focus:ring-2 transition ${
                    formErrors.cpa ? "border-red-500" : ""
                  }`}
                  style={{
                    borderColor: formErrors.cpa ? "#ef4444" : theme.colors.primary,
                    "--tw-ring-color": theme.colors.primary,
                  } as React.CSSProperties}
                />
                <p className="text-xs text-zinc-500 mt-1">Valor mínimo: R$ 5,00</p>
                {formErrors.cpa && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.cpa}</p>
                )}
              </div>

              {/* Affiliate Link */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2 font-medium">Link de Afiliado</label>
                <input
                  type="text"
                  value={formData.affiliateLink || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, affiliateLink: e.target.value });
                    setFormErrors({ ...formErrors, affiliateLink: undefined });
                  }}
                  placeholder="https://casa.com/register?ref=ABC123"
                  className={`w-full px-4 py-2 bg-zinc-800 border rounded-lg text-white focus:outline-none focus:ring-2 transition text-sm ${
                    formErrors.affiliateLink ? "border-red-500" : ""
                  }`}
                  style={{
                    borderColor: formErrors.affiliateLink ? "#ef4444" : theme.colors.primary,
                    "--tw-ring-color": theme.colors.primary,
                  } as React.CSSProperties}
                />
                {formErrors.affiliateLink && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.affiliateLink}</p>
                )}
              </div>

              {/* Registros */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2 font-medium">Registros</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.registros || ""}
                    onChange={(e) => setFormData({ ...formData, registros: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-zinc-800 border rounded-lg text-white focus:outline-none focus:ring-2 transition"
                    style={{
                      borderColor: theme.colors.primary,
                      "--tw-ring-color": theme.colors.primary,
                    } as React.CSSProperties}
                  />
                </div>

                {/* FTDs */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2 font-medium">FTDs</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ftds || ""}
                    onChange={(e) => setFormData({ ...formData, ftds: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-zinc-800 border rounded-lg text-white focus:outline-none focus:ring-2 transition"
                    style={{
                      borderColor: theme.colors.primary,
                      "--tw-ring-color": theme.colors.primary,
                    } as React.CSSProperties}
                  />
                </div>

                {/* QFTDs */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2 font-medium">QFTDs</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.qftds || ""}
                    onChange={(e) => setFormData({ ...formData, qftds: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-zinc-800 border rounded-lg text-white focus:outline-none focus:ring-2 transition"
                    style={{
                      borderColor: theme.colors.primary,
                      "--tw-ring-color": theme.colors.primary,
                    } as React.CSSProperties}
                  />
                </div>
              </div>

            </>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: theme.colors.primary }}>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-white font-medium transition border hover:bg-zinc-800/50 disabled:opacity-50 cursor-pointer"
              style={{
                borderColor: theme.colors.primary,
                boxShadow: `0 0 12px ${theme.colors.primary}30`,
              }}
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-zinc-800 rounded-lg text-white font-medium hover:bg-zinc-700 transition border border-zinc-700 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
