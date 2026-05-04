"use client";

import { useEffect, useState } from "react";
import { useHouse } from "@/context/HouseContext";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  level: number;
  cpa: number;
  registros: number;
  ftds: number;
  qftds: number;
}

interface TeamAffiliatesTableProps {
  selectedUserId?: string;
}

export default function TeamAffiliatesTable({ selectedUserId }: TeamAffiliatesTableProps) {
  const { selectedHouse } = useHouse();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedHouse || !selectedUserId) {
      setAffiliates([]);
      return;
    }

    fetchAffiliates();
  }, [selectedHouse, selectedUserId]);

  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/users/view-as/${selectedUserId}/affiliates?houseId=${selectedHouse}`
      );
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

  if (!selectedUserId) return null;

  return (
    <div className="mt-8">
      <p className="text-zinc-500 text-xs md:text-sm mb-4">
        Afiliados diretos e sua estrutura
      </p>

      {loading ? (
        <div className="text-center text-zinc-400 py-4">Carregando...</div>
      ) : affiliates.length === 0 ? (
        <div className="text-center text-zinc-400 py-4">
          Nenhum afiliado encontrado
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left px-4 py-3 text-zinc-400">Nome</th>
                <th className="text-left px-4 py-3 text-zinc-400">Email</th>
                <th className="text-center px-4 py-3 text-zinc-400">Nível</th>
                <th className="text-right px-4 py-3 text-zinc-400">CPA</th>
                <th className="text-right px-4 py-3 text-zinc-400">Registros</th>
                <th className="text-right px-4 py-3 text-zinc-400">FTDs</th>
                <th className="text-right px-4 py-3 text-zinc-400">QFTDs</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((aff) => (
                <tr key={aff.id} className="border-b border-zinc-800 hover:bg-zinc-900/50">
                  <td className="px-4 py-3 text-white font-medium">{aff.name}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{aff.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                      N{aff.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-white">R$ {aff.cpa.toFixed(0)}</td>
                  <td className="px-4 py-3 text-right text-white">{aff.registros}</td>
                  <td className="px-4 py-3 text-right text-white">{aff.ftds}</td>
                  <td className="px-4 py-3 text-right text-white font-semibold">{aff.qftds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
