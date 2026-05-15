"use client";

import { useState, useMemo } from "react";
import { Search, Users } from "lucide-react";
import { useHouse } from "@/context/HouseContext";
import AffiliateTreeNode from "./AffiliateTreeNode";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  commission: string;
  linkedDate: string;
  cpa: number | null;
  cpaEditedOnce: boolean;
}

interface AffiliateListProps {
  affiliates: Affiliate[];
  houseId: string;
  parentCpa?: number | null;
  onSetCpa?: (affiliate: Affiliate, parentCpa: number | null) => void;
}

type SortField = "name" | "email" | "linkedDate" | "cpa";
type SortOrder = "asc" | "desc";

export default function AffiliateList({ affiliates, houseId, parentCpa, onSetCpa }: AffiliateListProps) {
  const { theme } = useHouse();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("linkedDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const sortedAffiliates = useMemo(() => {
    let sorted = [...affiliates];

    sorted.sort((a, b) => {
      let aVal: string | number = a[sortField as keyof Affiliate] as string | number || "";
      let bVal: string | number = b[sortField as keyof Affiliate] as string | number || "";

      if (sortField === "cpa") {
        aVal = a.cpa ?? 0;
        bVal = b.cpa ?? 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [affiliates, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-zinc-600">↕</span>;
    return <span style={{ color: theme.colors.primary }}>{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-white">
            Meus Afiliados ({affiliates.length})
          </h3>
          {searchTerm && (
            <p className="text-sm text-zinc-400 mt-1">
              Pesquisando por "{searchTerm}"
            </p>
          )}
        </div>
      </div>

      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <input
          type="text"
          placeholder="Busca por nome, e-mail ou username…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-zinc-900 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition"
          style={{
            borderColor: theme.colors.primary,
            "--tw-ring-color": theme.colors.primary,
          } as React.CSSProperties}
        />
      </div>

      {/* Table or Empty State */}
      {affiliates.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <Users size={48} className="mx-auto text-zinc-700 mb-4" />
          <p className="text-zinc-400 text-lg font-medium">
            Nenhum afiliado na sua equipe ainda.
          </p>
          <p className="text-zinc-500 text-sm mt-2">
            Compartilhe seu link de indicação para convidar novos afiliados.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border"
          style={{ borderColor: theme.colors.primary }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: theme.colors.primary }}>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort("name")}
                    className="flex items-center gap-2 text-white font-medium text-sm hover:opacity-80 transition"
                  >
                    Nome
                    <SortIndicator field="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort("email")}
                    className="flex items-center gap-2 text-white font-medium text-sm hover:opacity-80 transition"
                  >
                    E-mail
                    <SortIndicator field="email" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort("linkedDate")}
                    className="flex items-center gap-2 text-white font-medium text-sm hover:opacity-80 transition"
                  >
                    Data de Vinculação
                    <SortIndicator field="linkedDate" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort("cpa")}
                    className="flex items-center gap-2 text-white font-medium text-sm hover:opacity-80 transition"
                  >
                    CPA
                    <SortIndicator field="cpa" />
                  </button>
                </th>
                {onSetCpa && (
                  <th className="px-4 py-3 text-center">
                    <span className="text-white font-medium text-sm">Ação</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedAffiliates.map((affiliate) => (
                <AffiliateTreeNode
                  key={affiliate.id}
                  affiliate={affiliate}
                  depth={0}
                  houseId={houseId}
                  parentCpa={parentCpa || null}
                  onSetCpa={onSetCpa || (() => {})}
                  searchTerm={searchTerm}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
