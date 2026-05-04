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
  isDirectChild?: boolean;
}

interface TeamAffiliatesTableProps {
  selectedUserId?: string;
}

export default function TeamAffiliatesTable({ selectedUserId }: TeamAffiliatesTableProps) {
  const { selectedHouse, theme } = useHouse();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCpa, setEditingCpa] = useState<string>("");

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
        // Mark direct children
        const affiliatesWithDirectFlag = data.affiliates.map((aff: Affiliate) => ({
          ...aff,
          isDirectChild: aff.level === (data.affiliates[0]?.level || 2) - 1,
        }));
        setAffiliates(affiliatesWithDirectFlag);
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

  const handleEditCpa = (affiliate: Affiliate) => {
    if (!affiliate.isDirectChild) return;
    setEditingId(affiliate.id);
    setEditingCpa(affiliate.cpa.toString());
  };

  const handleSaveCpa = async (affiliateId: string) => {
    if (!editingCpa || isNaN(parseFloat(editingCpa))) {
      alert("CPA deve ser um número válido");
      return;
    }

    if (parseFloat(editingCpa) < 5) {
      alert("CPA mínimo é R$ 5,00");
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${affiliateId}/house-data`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          houseId: selectedHouse,
          cpa: parseFloat(editingCpa),
        }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditingCpa("");
        fetchAffiliates();
      } else {
        alert("Erro ao atualizar CPA");
      }
    } catch (err) {
      console.error("Error saving CPA:", err);
      alert("Erro ao salvar");
    }
  };

  if (!selectedUserId) return null;

  return (
    <div className="mt-8">
      <p className="text-zinc-500 text-xs md:text-sm mb-4">
        Afiliados diretos e sua estrutura (edite apenas afiliados diretos)
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
                <tr
                  key={aff.id}
                  className={`border-b border-zinc-800 ${
                    aff.isDirectChild ? "hover:bg-zinc-900/50" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-white font-medium">{aff.name}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{aff.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                      N{aff.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === aff.id && aff.isDirectChild ? (
                      <div className="flex items-center gap-2 justify-end">
                        <input
                          type="number"
                          step="0.01"
                          value={editingCpa}
                          onChange={(e) => setEditingCpa(e.target.value)}
                          className="w-20 px-2 py-1 bg-zinc-800 border rounded text-white text-right"
                          style={{ borderColor: theme.colors.primary }}
                        />
                        <button
                          onClick={() => handleSaveCpa(aff.id)}
                          className="px-2 py-1 text-xs rounded transition"
                          style={{ backgroundColor: theme.colors.primary, color: "#000" }}
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditingCpa("");
                          }}
                          className="px-2 py-1 text-xs bg-zinc-700 text-white rounded hover:bg-zinc-600 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`text-white cursor-pointer ${
                          aff.isDirectChild ? "hover:opacity-70" : ""
                        }`}
                        onClick={() => aff.isDirectChild && handleEditCpa(aff)}
                        title={aff.isDirectChild ? "Clique para editar" : "Apenas afiliados diretos podem ser editados"}
                      >
                        R$ {aff.cpa.toFixed(0)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400">{aff.registros}</td>
                  <td className="px-4 py-3 text-right text-zinc-400">{aff.ftds}</td>
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
