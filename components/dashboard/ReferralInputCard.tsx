"use client";

import { useState } from "react";
import { useHouse } from "@/context/HouseContext";
import { Link2 } from "lucide-react";

interface ReferralInputCardProps {
  onSuccess: () => void;
}

export default function ReferralInputCard({ onSuccess }: ReferralInputCardProps) {
  const { theme } = useHouse();
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
      onSuccess();
    } catch (err) {
      setError("Erro ao vincular indicação");
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-lg border bg-zinc-900/50 p-6 space-y-4"
      style={{
        borderColor: theme.colors.primary,
        boxShadow: `0 0 15px ${theme.colors.primary}20`,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Link2 size={20} style={{ color: theme.colors.primary }} />
        <h2 className="text-lg md:text-xl font-bold text-white">Vincular Indicador</h2>
      </div>

      <p className="text-sm text-zinc-400">
        Você ainda não está vinculado a um indicador. Cole o código de indicação para se vincular à árvore de afiliados.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
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
          className="w-full px-4 py-2.5 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition text-sm"
          style={{
            borderColor: theme.colors.primary,
            "--tw-ring-color": theme.colors.primary,
          } as React.CSSProperties}
          disabled={loading}
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !referralCode.trim()}
            className="flex-1 py-2 rounded-lg text-white font-medium transition border hover:bg-zinc-800/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{
              borderColor: theme.colors.primary,
              boxShadow: `0 0 12px ${theme.colors.primary}30`,
            }}
          >
            {loading ? "Vinculando..." : "Vincular"}
          </button>
        </div>
      </form>

      <p className="text-xs text-zinc-500">
        💡 Você só pode vincular uma vez. Essa ação não pode ser desfeita.
      </p>
    </div>
  );
}
