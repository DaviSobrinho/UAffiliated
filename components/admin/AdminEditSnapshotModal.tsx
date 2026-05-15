"use client";

import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { useHouse } from "@/context/HouseContext";
import StatelessHouseSelector from "@/components/StatelessHouseSelector";
import ConfirmDialog from "@/components/ConfirmDialog";

interface AdminEditSnapshotModalProps {
  userId: string;
  houseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editDate?: string;
  editData?: {
    registros: number;
    ftds: number;
    qftds: number;
  };
  onLoadingChange?: (loading: boolean) => void;
  onRefreshComplete?: () => void;
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
const getCurrentDay = () => new Date().getDate();

export default function AdminEditSnapshotModal({
  userId,
  houseId,
  isOpen,
  onClose,
  onSaved,
  editDate,
  editData,
  onLoadingChange,
  onRefreshComplete,
}: AdminEditSnapshotModalProps) {
  const { theme } = useHouse();
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [registros, setRegistros] = useState<number | "">("");
  const [ftds, setFtds] = useState<number | "">("");
  const [qftds, setQftds] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [waitingForRefresh, setWaitingForRefresh] = useState(false);

  const checkAndLoadSnapshot = async (day: number, month: number, year: number) => {
    try {
      const snapshotDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const response = await fetch(
        `/api/admin/users/${userId}/snapshot?houseId=${houseId}&month=${month}&year=${year}`
      );

      if (response.ok) {
        const data = await response.json();
        const snapshot = data.snapshots?.find(
          (s: any) => new Date(s.date).toISOString().split("T")[0] === snapshotDate
        );

        if (snapshot) {
          setRegistros(snapshot.registros);
          setFtds(snapshot.ftds);
          setQftds(snapshot.qftds);
          setIsEditing(true);
        } else {
          setRegistros("");
          setFtds("");
          setQftds("");
          setIsEditing(false);
        }
      }
    } catch (err) {
      console.error("Erro ao verificar snapshot:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (editDate && editData) {
        const date = new Date(editDate);
        setSelectedDay(date.getDate());
        setSelectedMonth(date.getMonth() + 1);
        setSelectedYear(date.getFullYear());
        setRegistros(editData.registros);
        setFtds(editData.ftds);
        setQftds(editData.qftds);
        setIsEditing(true);
      } else {
        setSelectedDay(getCurrentDay());
        setSelectedMonth(getCurrentMonth());
        setSelectedYear(getCurrentYear());
        setRegistros("");
        setFtds("");
        setQftds("");
        setIsEditing(false);
      }
      setError("");
      setSuccess("");
    }
  }, [isOpen, editDate, editData]);

  useEffect(() => {
    if (isOpen && !editDate) {
      checkAndLoadSnapshot(selectedDay, selectedMonth, selectedYear);
    }
  }, [selectedDay, selectedMonth, selectedYear, isOpen]);

  useEffect(() => {
    if (waitingForRefresh) {
      const timer = setTimeout(() => {
        setToast(null);
        setTimeout(() => {
          onClose();
          onLoadingChange?.(false);
          setWaitingForRefresh(false);
          setLoading(false);
        }, 300);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [waitingForRefresh, onClose, onLoadingChange]);

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      onLoadingChange?.(true);

      const snapshotDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

      const res = await fetch(`/api/admin/users/${userId}/snapshot`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          houseId,
          date: snapshotDate,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setToast({ message: errorData.error || "Erro ao remover lançamento", type: "error" });
        setShowDeleteConfirm(false);
        onLoadingChange?.(false);
        setDeleting(false);
        return;
      }

      console.log("[MODAL] Lançamento removido com sucesso!");
      setToast({ message: "Lançamento removido com sucesso!", type: "success" });
      setShowDeleteConfirm(false);
      setWaitingForRefresh(true);
      console.log("[MODAL] Disparando onSaved() para refrescar dados...");
      onSaved();
    } catch (err) {
      console.error(err);
      setToast({ message: "Erro ao remover lançamento", type: "error" });
      setShowDeleteConfirm(false);
      onLoadingChange?.(false);
      setDeleting(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    onLoadingChange?.(true);

    try {
      const snapshotDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

      const res = await fetch(`/api/admin/users/${userId}/snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          houseId,
          date: snapshotDate,
          registros: registros ? parseInt(registros as any) : 0,
          ftds: ftds ? parseInt(ftds as any) : 0,
          qftds: qftds ? parseInt(qftds as any) : 0,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setToast({ message: errorData.error || "Erro ao salvar", type: "error" });
        onLoadingChange?.(false);
        setLoading(false);
        return;
      }

      const message = isEditing
        ? "Lançamento editado com sucesso!"
        : "Lançamento criado com sucesso!";
      console.log("[MODAL] " + message);
      setToast({ message, type: "success" });
      setWaitingForRefresh(true);
      console.log("[MODAL] Disparando onSaved() para refrescar dados...");
      onSaved();
    } catch (err) {
      console.error(err);
      setToast({ message: "Erro ao salvar lançamento", type: "error" });
      onLoadingChange?.(false);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-zinc-900 rounded-lg border w-full max-w-md"
        style={{ borderColor: theme.colors.primary }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: theme.colors.primary }}>
          <h2 className="text-lg font-bold text-white">
            {editDate ? "Editar Lançamento" : "Novo Lançamento"}
          </h2>
          <button
            onClick={onClose}
            disabled={loading || deleting || waitingForRefresh}
            className="text-zinc-400 hover:text-white transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toast in Modal */}
        {toast && (
          <div
            className={`px-6 py-3 border-b flex items-center gap-3 animate-in fade-in ${
              toast.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            {toast.type === "success" ? "✓" : "✕"} {toast.message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 relative">
          {(loading || waitingForRefresh) && (
            <div className="absolute inset-0 bg-zinc-900/50 rounded-b-lg flex items-center justify-center z-10">
              <div className="text-sm text-white font-medium">
                {waitingForRefresh ? "Finalizando..." : "Salvando..."}
              </div>
            </div>
          )}

          {/* Data */}
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

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">Registros</label>
              <input
                type="number"
                min="0"
                value={registros}
                onChange={(e) => setRegistros(e.target.value ? parseInt(e.target.value) : "")}
                className="w-full px-4 py-2 bg-zinc-800 border rounded-lg text-white focus:outline-none focus:ring-2 transition"
                style={{
                  borderColor: theme.colors.primary,
                  "--tw-ring-color": theme.colors.primary,
                } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">FTDs</label>
              <input
                type="number"
                min="0"
                value={ftds}
                onChange={(e) => setFtds(e.target.value ? parseInt(e.target.value) : "")}
                className="w-full px-4 py-2 bg-zinc-800 border rounded-lg text-white focus:outline-none focus:ring-2 transition"
                style={{
                  borderColor: theme.colors.primary,
                  "--tw-ring-color": theme.colors.primary,
                } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">QFTDs</label>
              <input
                type="number"
                min="0"
                value={qftds}
                onChange={(e) => setQftds(e.target.value ? parseInt(e.target.value) : "")}
                className="w-full px-4 py-2 bg-zinc-800 border rounded-lg text-white focus:outline-none focus:ring-2 transition"
                style={{
                  borderColor: theme.colors.primary,
                  "--tw-ring-color": theme.colors.primary,
                } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t" style={{ borderColor: theme.colors.primary }}>
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
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg text-red-300 font-medium transition border border-red-500/50 hover:bg-red-500/10 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                {deleting ? "Removendo..." : "Remover"}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Remover Lançamento"
        message="Tem certeza que deseja remover este lançamento? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        primaryColor={theme.colors.primary}
      />
    </div>
  );
}
