"use client";

import { useState, useEffect } from "react";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useHouse } from "@/context/HouseContext";

interface House {
  id: string;
  name: string;
  color: string;
  logoUrl?: string;
}

export default function HousesManagement() {
  const { theme } = useHouse();
  const [houses, setHouses] = useState<House[]>([]);
  const [housesLoading, setHousesLoading] = useState(true);
  const [newHouseName, setNewHouseName] = useState("");
  const [newHouseColor, setNewHouseColor] = useState("#3b82f6");
  const [creatingHouse, setCreatingHouse] = useState(false);
  const [houseMessage, setHouseMessage] = useState("");
  const [uploadingHouseLogo, setUploadingHouseLogo] = useState(false);
  const [editingColor, setEditingColor] = useState<Record<string, string>>({});
  const [savingColor, setSavingColor] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    try {
      setHousesLoading(true);
      const res = await fetch("/api/admin/houses");
      if (res.ok) {
        const data = await res.json();
        setHouses(data.houses);
      }
    } catch (err) {
      console.error("Error fetching houses:", err);
    } finally {
      setHousesLoading(false);
    }
  };

  const handleCreateHouse = async () => {
    if (!newHouseName.trim()) {
      setHouseMessage("❌ Nome da casa é obrigatório");
      return;
    }

    setCreatingHouse(true);
    setHouseMessage("");

    try {
      const res = await fetch("/api/admin/houses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newHouseName, color: newHouseColor }),
      });

      const data = await res.json();

      if (res.ok) {
        setNewHouseName("");
        setNewHouseColor("#3b82f6");
        setHouseMessage("✅ Casa de aposta criada com sucesso!");
        fetchHouses();
        setTimeout(() => setHouseMessage(""), 3000);
      } else {
        setHouseMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error("Error creating house:", err);
      setHouseMessage("❌ Erro ao criar casa de aposta");
    } finally {
      setCreatingHouse(false);
    }
  };

  const handleDeleteHouse = async (houseId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta casa?")) return;

    try {
      const res = await fetch(`/api/admin/houses/${houseId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setHouseMessage("✅ Casa deletada com sucesso!");
        fetchHouses();
        setTimeout(() => setHouseMessage(""), 3000);
      } else {
        const data = await res.json();
        setHouseMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error("Error deleting house:", err);
      setHouseMessage("❌ Erro ao deletar casa");
    }
  };

  const handleHouseLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, houseId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHouseLogo(true);
    setHouseMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/admin/houses/${houseId}/upload-logo`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setHouseMessage("✅ Logo da casa atualizada com sucesso!");
        fetchHouses();
        setTimeout(() => setHouseMessage(""), 3000);
      } else {
        const data = await res.json();
        setHouseMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error("Error uploading house logo:", err);
      setHouseMessage("❌ Erro ao fazer upload da logo");
    } finally {
      setUploadingHouseLogo(false);
      e.target.value = "";
    }
  };

  const handleSaveHouseColor = async (houseId: string, newColor: string) => {
    setSavingColor(true);
    setHouseMessage("");

    try {
      const res = await fetch(`/api/admin/houses/${houseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color: newColor }),
      });

      if (res.ok) {
        setHouseMessage("✅ Cor da casa atualizada com sucesso!");
        setEditingColor({});
        fetchHouses();
        setTimeout(() => setHouseMessage(""), 3000);
      } else {
        const data = await res.json();
        setHouseMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error("Error updating house color:", err);
      setHouseMessage("❌ Erro ao atualizar cor da casa");
    } finally {
      setSavingColor(false);
    }
  };

  const moveHouse = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === houses.length - 1) return;

    const newHouses = [...houses];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newHouses[index], newHouses[targetIndex]] = [
      newHouses[targetIndex],
      newHouses[index],
    ];

    setReordering(true);
    setHouseMessage("");

    try {
      const res = await fetch("/api/admin/houses/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ houseIds: newHouses.map((h) => h.id) }),
      });

      if (res.ok) {
        setHouses(newHouses);
        setHouseMessage("✅ Ordem das casas atualizada!");
        setTimeout(() => setHouseMessage(""), 3000);
      } else {
        const data = await res.json();
        setHouseMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error("Error reordering houses:", err);
      setHouseMessage("❌ Erro ao reordenar casas");
    } finally {
      setReordering(false);
    }
  };

  return (
    <>
      <div className="space-y-6 md:space-y-8">
        {/* Create New House */}
        <div className="bg-zinc-800/50 rounded-lg p-4 mb-6 border border-zinc-700">
          <h3 className="text-white font-semibold mb-4">Criar Nova Casa</h3>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="flex-1 min-w-0">
                <label htmlFor="houseName" className="text-zinc-300 text-xs font-medium block mb-1">Nome</label>
                <input
                  id="houseName"
                  type="text"
                  placeholder="Nome da casa de aposta..."
                  value={newHouseName}
                  onChange={(e) => setNewHouseName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateHouse()}
                  disabled={creatingHouse}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    "--tw-ring-color": theme.colors.primary,
                  } as React.CSSProperties}
                />
              </div>

              <div className="w-full sm:w-24">
                <label htmlFor="houseColor" className="text-zinc-300 text-xs font-medium block mb-1">Cor</label>
                <div className="flex gap-2 items-center">
                  <input
                    id="houseColor"
                    type="color"
                    value={newHouseColor}
                    onChange={(e) => setNewHouseColor(e.target.value)}
                    disabled={creatingHouse}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-zinc-400 text-xs">{newHouseColor}</span>
                </div>
              </div>

              <button
                onClick={handleCreateHouse}
                disabled={creatingHouse}
                className="w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
                style={{
                  backgroundColor: theme.colors.primary,
                }}
              >
                {creatingHouse ? "..." : "+ Criar"}
              </button>
            </div>

            {houseMessage && (
              <div className={`text-sm rounded-lg p-3 ${
                houseMessage.startsWith("✅")
                  ? "bg-green-500/10 text-green-300 border border-green-500/30"
                  : "bg-red-500/10 text-red-300 border border-red-500/30"
              }`}>
                {houseMessage}
              </div>
            )}
          </div>
        </div>

        {/* Houses List */}
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <h3 className="text-white font-semibold mb-4">Casas Cadastradas</h3>

          {housesLoading ? (
            <div className="text-center py-4 text-zinc-400">Carregando casas...</div>
          ) : houses.length === 0 ? (
            <div className="text-center py-4 text-zinc-400">
              <p>Nenhuma casa de aposta criada ainda</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {houses.map((house) => (
                <div
                  key={house.id}
                  className="p-3 bg-zinc-800 border rounded-lg"
                  style={{
                    borderColor: house.color,
                    borderLeftWidth: "4px",
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition" title="Clique para editar cor">
                        <input
                          type="color"
                          value={editingColor[house.id] || house.color}
                          onChange={(e) => setEditingColor({ ...editingColor, [house.id]: e.target.value })}
                          onBlur={(e) => {
                            if (editingColor[house.id] && editingColor[house.id] !== house.color) {
                              handleSaveHouseColor(house.id, editingColor[house.id]);
                            }
                          }}
                          disabled={savingColor}
                          className="w-6 h-6 rounded cursor-pointer border border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </label>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate text-sm">{house.name}</p>
                        <p className="text-zinc-400 text-xs">{editingColor[house.id] || house.color}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => moveHouse(houses.indexOf(house), "up")}
                        disabled={reordering || houses.indexOf(house) === 0}
                        className="p-1 hover:bg-blue-500/20 rounded transition text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Mover para cima"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => moveHouse(houses.indexOf(house), "down")}
                        disabled={reordering || houses.indexOf(house) === houses.length - 1}
                        className="p-1 hover:bg-blue-500/20 rounded transition text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Mover para baixo"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteHouse(house.id)}
                        className="p-1 hover:bg-red-500/20 rounded transition text-red-400 hover:text-red-300"
                        title="Deletar casa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Logo Upload for House */}
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-700">
                    <div className="w-10 h-10 bg-zinc-700 rounded flex items-center justify-center overflow-hidden shrink-0">
                      {house.logoUrl ? (
                        <img
                          src={house.logoUrl}
                          alt={house.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-zinc-500 text-xs">Logo</span>
                      )}
                    </div>
                    <label className="flex-1">
                      <span className="text-zinc-300 text-xs font-medium block mb-1">Upload Logo</span>
                      <p className="text-zinc-500 text-xs mb-2">Recomendado: máx 2MB, proporção 21:9 (ex: 2100x900 ou 1050x450)</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleHouseLogoUpload(e, house.id)}
                        disabled={uploadingHouseLogo}
                        className="block w-full text-xs text-zinc-400
                          file:mr-2 file:py-1 file:px-2
                          file:rounded file:border-0
                          file:text-xs file:font-semibold
                          file:bg-zinc-700 file:text-white
                          hover:file:bg-zinc-600
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
