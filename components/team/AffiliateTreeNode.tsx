"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronRight, Loader2, Lock } from "lucide-react";
import { useHouse } from "@/context/HouseContext";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  commission: string;
  linkedDate: string;
  cpa: number | null;
  cpaEditedOnce: boolean;
  hasChildren?: boolean;
}

interface AffiliateTreeNodeProps {
  affiliate: Affiliate;
  depth: number;
  houseId: string;
  parentCpa: number | null;
  onSetCpa: (affiliate: Affiliate, parentCpa: number | null) => void;
  searchTerm?: string;
}

export default function AffiliateTreeNode({
  affiliate,
  depth,
  houseId,
  parentCpa,
  onSetCpa,
  searchTerm = "",
}: AffiliateTreeNodeProps) {
  const { theme } = useHouse();
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<Affiliate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasChildren, setHasChildren] = useState<boolean>(affiliate.hasChildren ?? false);

  // Auto-expand when search term matches children
  const matchesSearch = !searchTerm ||
    affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    affiliate.email.toLowerCase().includes(searchTerm.toLowerCase());

  const childrenMatchSearch = children?.some(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadChildren = useCallback(async () => {
    if (children !== null) {
      return children;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/me/team/${affiliate.id}/children?houseId=${houseId}`);
      if (res.ok) {
        const data = await res.json();
        const fetched = data.affiliates ?? [];
        setChildren(fetched);
        setHasChildren(fetched.length > 0);
        return fetched;
      } else {
        setChildren([]);
        setHasChildren(false);
        return [];
      }
    } catch (err) {
      console.error("Error fetching children:", err);
      setChildren([]);
      setHasChildren(false);
      return [];
    } finally {
      setLoading(false);
    }
  }, [children, affiliate.id, houseId]);

  const handleToggle = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    const childrenList = await loadChildren();
    setIsExpanded(childrenList.length > 0);
  };

  useEffect(() => {
    if (searchTerm) {
      loadChildren();
    }
  }, [searchTerm, loadChildren]);

  useEffect(() => {
    const shouldAutoExpand = searchTerm && children !== null && childrenMatchSearch && !isExpanded;
    if (shouldAutoExpand) {
      setIsExpanded(true);
    }
  }, [searchTerm, children, childrenMatchSearch, isExpanded]);

  // Show this row if it matches search or if we should show it (parent of match)
  const shouldShow = matchesSearch || (searchTerm && children?.some(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <tr className="border-b hover:bg-zinc-800/50 transition" style={{ borderColor: theme.colors.primary }}>
        <td className="px-4 py-3 text-sm text-white font-medium">
          <div style={{ marginLeft: depth * 20 }} className="flex items-center gap-2">
            {loading ? (
              <Loader2 size={16} className="animate-spin" style={{ color: theme.colors.primary }} />
            ) : hasChildren ? (
              <button
                onClick={handleToggle}
                className="transition"
                style={{ color: theme.colors.primary }}
              >
                <ChevronRight
                  size={18}
                  className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                />
              </button>
            ) : (
              <div style={{ width: 18 }} />
            )}
            {affiliate.name}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-zinc-300">{affiliate.email}</td>
        <td className="px-4 py-3 text-sm text-zinc-400">{affiliate.linkedDate}</td>
        <td className="px-4 py-3 text-sm">
          {affiliate.cpa ? (
            <span className="text-white font-medium">
              R$ {affiliate.cpa.toFixed(2).replace(".", ",")}
            </span>
          ) : (
            <span className="text-zinc-500">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          {affiliate.cpaEditedOnce ? (
            <div className="flex items-center justify-center gap-1" title="CPA já definido e bloqueado">
              <Lock size={14} style={{ color: theme.colors.primary }} />
              <span className="text-xs text-zinc-400">Bloqueado</span>
            </div>
          ) : depth > 0 ? (
            <div className="flex items-center justify-center gap-1" title="Apenas o indicador direto pode definir CPA">
              <Lock size={14} style={{ color: theme.colors.primary }} />
              <span className="text-xs text-zinc-400">Bloqueado</span>
            </div>
          ) : (
            <button
              onClick={() => onSetCpa(affiliate, parentCpa)}
              className="px-3 py-1.5 rounded text-white text-xs font-medium transition hover:opacity-80 cursor-pointer"
              style={{
                backgroundColor: `${theme.colors.primary}20`,
                color: theme.colors.primary,
                border: `1px solid ${theme.colors.primary}40`,
              }}
            >
              Definir CPA
            </button>
          )}
        </td>
      </tr>
      {isExpanded && children && children.length > 0 && (
        <>
          {children.map((child) => (
            <AffiliateTreeNode
              key={child.id}
              affiliate={child}
              depth={depth + 1}
              houseId={houseId}
              parentCpa={affiliate.cpa}
              onSetCpa={onSetCpa}
              searchTerm={searchTerm}
            />
          ))}
        </>
      )}
    </>
  );
}
