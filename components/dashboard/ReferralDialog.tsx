"use client";

import { useState, useEffect } from "react";
import { useHouse } from "@/context/HouseContext";
import { Link2, Check, X } from "lucide-react";

interface ReferralDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type DialogState = "input" | "success";

export default function ReferralDialog({
  isOpen,
  onClose,
  onSuccess,
}: ReferralDialogProps) {
  const { theme } = useHouse();
  const [state, setState] = useState<DialogState>("input");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!referralCode.trim()) {
      setError("Digite o código de indicação");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/users/me/referral", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: referralCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao vincular indicação");
        setLoading(false);
        return;
      }

      setLoading(false);
      setState("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError("Erro ao vincular indicação");
      console.error(err);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div
        className="bg-zinc-900 rounded-2xl p-8 max-w-sm w-full border shadow-2xl"
        style={{
          borderColor: theme.colors.primary,
          boxShadow: `0 0 30px ${theme.colors.primary}30`,
        }}
      >
        {state === "input" ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Link2 size={24} style={{ color: theme.colors.primary }} />
                <h2 className="text-xl font-bold text-white">Vincular Indicador</h2>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-zinc-400 mb-6">
              Cole o código ou link de indicação para se vincular à árvore de afiliados. Você só pode fazer isso uma vez.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Cole o código ou link de indicação"
                className="w-full px-4 py-3 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition text-sm"
                style={{
                  borderColor: theme.colors.primary,
                  "--tw-ring-color": theme.colors.primary,
                } as React.CSSProperties}
                disabled={loading}
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 bg-zinc-800 rounded-lg text-white font-medium hover:bg-zinc-700 transition border border-zinc-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !referralCode.trim()}
                  className="flex-1 py-2 rounded-lg text-white font-medium transition border disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-zinc-800/50"
                  style={{
                    borderColor: theme.colors.primary,
                    boxShadow: `0 0 12px ${theme.colors.primary}30`,
                  }}
                >
                  {loading ? "Vinculando..." : "Vincular"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${theme.colors.primary}20`,
                  borderColor: theme.colors.primary,
                }}
              >
                <Check size={32} style={{ color: theme.colors.primary }} />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Vinculado com sucesso!
              </h2>
              <p className="text-sm text-zinc-400">
                Você agora está vinculado à árvore de afiliados.
              </p>
            </div>

            <p className="text-xs text-zinc-500 pt-2">
              Redirecionando em breve...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
