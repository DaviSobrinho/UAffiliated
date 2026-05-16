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
  currentUserName?: string;
}

export default function AffiliateFilter({ houseId, value, onChange, currentUserName = "Você" }: AffiliateFilterProps) {
  const { theme } = useHouse();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

    if (houseId && houseId !== "default") {
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

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const selectedAffiliateLabel = value === "all"
    ? currentUserName
    : affiliates.find(a => a.id === value)?.name || "Selecionar...";

  const filteredAffiliates = affiliates.filter(affiliate =>
    affiliate.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAffiliate = (affiliateId: string) => {
    onChange(affiliateId);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-64">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="w-full px-4 py-2.5 bg-zinc-900 border rounded-lg text-white text-sm text-left flex items-center justify-between hover:bg-zinc-800 transition disabled:opacity-50"
        style={{
          borderColor: theme.colors.primary,
          boxShadow: `0 0 12px ${theme.colors.primary}20`,
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
          className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border rounded-lg z-50 max-h-96 overflow-hidden flex flex-col"
          style={{
            borderColor: theme.colors.primary,
            boxShadow: `0 8px 32px ${theme.colors.primary}35`,
          }}
        >
          {/* Search input */}
          <div className="p-2 border-b sticky top-0 bg-zinc-900" style={{ borderColor: theme.colors.primary }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar afiliado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border rounded text-white text-sm placeholder-zinc-500 focus:outline-none"
              style={{ borderColor: theme.colors.primary }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Dropdown content */}
          <div className="overflow-y-auto">
            {/* Todos os afiliados option */}
            <button
              onClick={() => handleSelectAffiliate("all")}
              className="w-full px-4 py-3 text-left hover:bg-zinc-800/50 transition border-b border-l-4 text-white font-medium"
              style={{
                borderColor: theme.colors.primary,
                borderLeftColor: value === "all" ? theme.colors.primary : "transparent",
                boxShadow: value === "all" ? `inset 0 0 15px ${theme.colors.primary}30` : undefined,
              }}
            >
              {currentUserName} (Você)
            </button>

            {/* Loading state */}
            {loading && (
              <div className="px-4 py-3 text-zinc-400 text-sm text-center">
                Carregando...
              </div>
            )}

            {/* Affiliates list */}
            {!loading && filteredAffiliates.length > 0 ? (
              filteredAffiliates.map((affiliate) => (
                <button
                  key={affiliate.id}
                  onClick={() => handleSelectAffiliate(affiliate.id)}
                  className="w-full px-4 py-3 text-left hover:bg-zinc-800/50 transition border-b last:border-b-0 border-l-4 flex items-center justify-between"
                  style={{
                    borderColor: theme.colors.primary,
                    borderLeftColor: value === affiliate.id ? theme.colors.primary : "transparent",
                    paddingLeft: `${12 + (affiliate.level - 1) * 16}px`,
                    boxShadow: value === affiliate.id ? `inset 0 0 15px ${theme.colors.primary}30` : undefined,
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
            ) : !loading && searchQuery && (
              <div className="px-4 py-3 text-zinc-400 text-sm text-center">
                Nenhum afiliado encontrado com "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
