"use client";

import { useState } from "react";
import { Copy, Check, Link2 } from "lucide-react";
import { useHouse } from "@/context/HouseContext";

interface AffiliateLinksSectionProps {
  affiliateLink?: string;
}

export default function AffiliateLinksSection({ affiliateLink }: AffiliateLinksSectionProps) {
  const { theme } = useHouse();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (affiliateLink) {
      navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
          <Link2 size={20} style={{ color: theme.colors.primary }} />
          Link de afiliado
        </h3>
        <p className="text-zinc-400 text-sm">
          Link exclusivo para divulgar e atrair novos jogadores para essa casa de apostas
        </p>
      </div>
      <div
        className="flex gap-3 items-center bg-zinc-900 border rounded-lg p-4 transition-all duration-300"
        style={{
          borderColor: theme.colors.primary,
          boxShadow: `0 0 15px ${theme.colors.primary}20`,
        }}
      >
      <Link2 size={18} style={{ color: theme.colors.primary }} className="shrink-0" />

      {affiliateLink ? (
        <>
          <input
            type="text"
            value={affiliateLink}
            readOnly
            className="flex-1 px-3 py-2 bg-zinc-800 border rounded text-white text-sm"
            style={{
              borderColor: theme.colors.primary,
            }}
          />
          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded text-white text-sm font-medium transition-all duration-200 flex items-center gap-1 shrink-0 hover:scale-105"
            style={{
              backgroundColor: theme.colors.primary,
              boxShadow: `0 0 12px ${theme.colors.primary}50`,
            }}
          >
            {copied ? (
              <>
                <Check size={16} />
                <span className="hidden sm:inline">Copiado</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span className="hidden sm:inline">Copiar</span>
              </>
            )}
          </button>
        </>
      ) : (
        <div className="flex-1">
          <p className="text-sm text-zinc-400">Você ainda não tem link de afiliado configurado.</p>
          <p className="text-xs text-zinc-500 mt-1">Entre em contato com o administrador para obter seu link.</p>
        </div>
      )}
      </div>
    </div>
  );
}
