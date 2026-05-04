"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useHouse } from "@/context/HouseContext";

interface Affiliate {
  id: string;
  name: string;
  level: number;
}

interface AffiliateFilterProps {
  houseId: string;
  value: string;
  onChange: (affiliateId: string) => void;
}

export default function AffiliateFilter({ houseId, value, onChange }: AffiliateFilterProps) {
  const { theme } = useHouse();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/me/team?houseId=${houseId}`);
        if (res.ok) {
          const data = await res.json();
          setAffiliates(data.affiliates || []);
        } else {
          setAffiliates([]);
        }
      } catch (err) {
        console.error("Error fetching affiliates:", err);
        setAffiliates([]);
      } finally {
        setLoading(false);
      }
    };

    if (houseId) {
      fetchAffiliates();
    }
  }, [houseId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedAffiliateLabel = value === "all"
    ? "Todos os afiliados"
    : affiliates.find(a => a.id === value)?.name || "Selecionar...";

  const handleSelectAffiliate = (affiliateId: string) => {
    onChange(affiliateId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-64">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="w-full px-4 py-2.5 bg-zinc-900 border rounded-lg text-white text-sm text-left flex items-center justify-between hover:bg-zinc-800 transition disabled:opacity-50"
        style={{
          borderColor: theme.colors.primary,
        }}
      >
        <span>{selectedAffiliateLabel}</span>
        <ChevronDown
          size={18}
          style={{ color: theme.colors.primary }}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
          style={{ borderColor: theme.colors.primary }}
        >
          {/* Todos os afiliados option */}
          <button
            onClick={() => handleSelectAffiliate("all")}
            className="w-full px-4 py-3 text-left hover:bg-zinc-800/50 transition border-b first:rounded-t-lg text-white font-medium"
            style={{ borderColor: theme.colors.primary }}
          >
            Todos os afiliados
          </button>

          {/* Loading state */}
          {loading && (
            <div className="px-4 py-3 text-zinc-400 text-sm text-center">
              Carregando...
            </div>
          )}

          {/* Affiliates list */}
          {!loading && affiliates.length > 0 ? (
            affiliates.map((affiliate) => (
              <button
                key={affiliate.id}
                onClick={() => handleSelectAffiliate(affiliate.id)}
                className="w-full px-4 py-3 text-left hover:bg-zinc-800/50 transition border-b last:border-b-0 flex items-center justify-between"
                style={{
                  borderColor: theme.colors.primary,
                  paddingLeft: `${12 + (affiliate.level - 1) * 16}px`,
                }}
              >
                <span className="text-white">{affiliate.name}</span>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: "#000",
                  }}
                >
                  N{affiliate.level}
                </span>
              </button>
            ))
          ) : !loading && (
            <div className="px-4 py-3 text-zinc-400 text-sm text-center">
              Nenhum afiliado encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}
