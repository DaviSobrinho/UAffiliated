"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useHouse } from "@/context/HouseContext";

interface Affiliate {
  id: string;
  name: string;
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

  return (
    <div className="relative w-full sm:w-64">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full px-4 py-2.5 bg-zinc-900 border rounded-lg text-white text-sm appearance-none pr-10 focus:outline-none focus:ring-2 transition disabled:opacity-50"
        style={{
          borderColor: theme.colors.primary,
          "--tw-ring-color": theme.colors.primary,
        } as React.CSSProperties}
      >
        <option value="all">Todos os afiliados</option>
        {affiliates.map((affiliate) => (
          <option key={affiliate.id} value={affiliate.id}>
            {affiliate.name}
          </option>
        ))}
      </select>
      <ChevronDown
        size={18}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: theme.colors.primary }}
      />
    </div>
  );
}
