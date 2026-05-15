"use client";

import { useState } from "react";
import { useHouse } from "@/context/HouseContext";
import { getHouseTheme } from "@/lib/houseThemes";
import { Lock, X } from "lucide-react";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  cpa: number | null;
  cpaEditedOnce: boolean;
}

interface SubAffiliateCpaModalProps {
  affiliate: Affiliate | null;
  parentCpa: number | null;
  houseId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function SubAffiliateCpaModal({
  affiliate,
  parentCpa,
  houseId,
  onClose,
  onUpdated,
}: SubAffiliateCpaModalProps) {
  const { theme } = useHouse();
  const [cpa, setCpa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!affiliate) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const cpaNum = Number.parseFloat(cpa);

    if (Number.isNaN(cpaNum) || cpaNum < 5) {
      setError("CPA mínimo é R$ 5,00");
      return;
    }

    if (parentCpa !== null && cpaNum > parentCpa) {
      setError(
        `CPA não pode exceder seu CPA de R$ ${parentCpa.toFixed(2).replace(".", ",")}`
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/users/me/team/${affiliate.id}/house-data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cpa: cpaNum,
            houseId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao definir CPA");
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccess(`CPA de R$ ${cpaNum.toFixed(2).replace(".", ",")} definido com sucesso!`);
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 1500);
    } catch (err) {
      setError("Erro ao definir CPA");
      console.error(err);
      setLoading(false);
    }
  };

  const formatCPA = (value: number | string | null): string => {
    if (!value) return "—";
    const num = typeof value === "string" ? Number.parseFloat(value) : value;
    return `R$ ${num.toFixed(2).replace(".", ",")}`;
  };

  const isLocked = affiliate.cpaEditedOnce;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div
        className="bg-zinc-900 rounded-lg border w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
        style={{
          borderColor: theme.colors.primary,
          boxShadow: `0 0 30px ${theme.colors.primary}20`,
        }}
      >
        {/* Header */}
        <div className="p-6 border-b flex-shrink-0 flex justify-between items-center" style={{ borderColor: theme.colors.primary }}>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{affiliate.name}</h2>
            <p className="text-sm text-zinc-400">{affiliate.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition ml-4"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg text-sm mb-4">
              {success}
            </div>
          )}

          {isLocked ? (
            // Locked mode - read-only
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
                <Lock size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-300 font-medium">CPA já definido</p>
                  <p className="text-xs text-blue-300/70 mt-1">
                    Este CPA não pode ser alterado. Para modificá-lo, entre em contato com o administrador.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  CPA Definido
                </label>
                <div
                  className="px-4 py-3 bg-zinc-800 border rounded-lg text-white text-sm font-mono cursor-default flex items-center justify-between"
                  style={{
                    borderColor: theme.colors.primary,
                  }}
                >
                  <span>{affiliate.cpa ? formatCPA(affiliate.cpa) : "—"}</span>
                  <Lock size={16} className="text-blue-400" />
                </div>
              </div>
            </div>
          ) : (
            // Editable mode
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  CPA para esta casa
                </label>
                <p className="text-xs text-zinc-400 mb-3">
                  {parentCpa !== null
                    ? `Máximo: ${formatCPA(parentCpa)}`
                    : "Seu CPA não está definido nesta casa"}
                </p>
                <input
                  type="number"
                  step="0.01"
                  min="5"
                  max={parentCpa || undefined}
                  value={cpa}
                  onChange={(e) => setCpa(e.target.value)}
                  placeholder="Digite o CPA"
                  className="w-full px-4 py-3 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition text-sm"
                  style={{
                    borderColor: theme.colors.primary,
                    "--tw-ring-color": theme.colors.primary,
                  } as React.CSSProperties}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-zinc-800 rounded-lg text-white font-medium hover:bg-zinc-700 transition border border-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !cpa.trim()}
                  className="flex-1 py-2.5 rounded-lg text-white font-medium transition border disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    borderColor: theme.colors.primary,
                    backgroundColor: loading ? `${theme.colors.primary}40` : theme.colors.primary,
                    boxShadow: `0 0 12px ${theme.colors.primary}30`,
                  }}
                >
                  {loading ? "Definindo..." : "Definir CPA"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
