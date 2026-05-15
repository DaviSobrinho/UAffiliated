"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { HOUSE_THEMES, HouseTheme } from "@/lib/houseThemes";
import { useHouse } from "@/context/HouseContext";

interface DynamicHouse {
  id: string;
  name: string;
  color: string;
  logoUrl?: string;
}

export default function HouseSelector() {
  const { selectedHouse, setSelectedHouse } = useHouse();
  const [isOpen, setIsOpen] = useState(false);
  const [dynamicHouses, setDynamicHouses] = useState<DynamicHouse[]>([]);
  const [loadingHouses, setLoadingHouses] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Delay the fetch to avoid startup bottleneck
    const timer = setTimeout(() => {
      const fetchHouses = async () => {
        try {
          console.log("[HouseSelector] 🏠 Iniciando fetch de casas (com delay de 500ms)...");
          const startTime = Date.now();

          const res = await fetch("/api/admin/houses");
          const fetchDuration = Date.now() - startTime;

          console.log(`[HouseSelector] 📡 Response status: ${res.status}, duração: ${fetchDuration}ms`);

          if (res.ok) {
            const data = await res.json();
            console.log(`[HouseSelector] ✅ Casas carregadas: ${data.houses?.length || 0} casas em ${Date.now() - startTime}ms`);
            setDynamicHouses(data.houses || []);
          } else {
            console.error(`[HouseSelector] ❌ Erro na resposta: ${res.status}`);
          }
        } catch (err) {
          console.error(`[HouseSelector] 💥 Erro ao buscar casas:`, err);
        } finally {
          setLoadingHouses(false);
        }
      };

      console.log("[HouseSelector] ⏰ Timer iniciado (fetch em 500ms)");
      fetchHouses();
    }, 500); // Delay by 500ms to avoid startup bottleneck

    return () => {
      clearTimeout(timer);
      console.log("[HouseSelector] 🔄 Cleanup do timer");
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getThemeByName = (houseName: string): HouseTheme | undefined => {
    return Object.values(HOUSE_THEMES).find(
      (theme) => theme.name.toLowerCase() === houseName.toLowerCase()
    );
  };

  const getDisplayName = (houseId: string) => {
    const house = dynamicHouses.find((h) => h.id === houseId);
    return house?.name || "Casa";
  };

  const getDisplayColor = (houseId: string) => {
    const house = dynamicHouses.find((h) => h.id === houseId);
    if (!house) return "#3b82f6";

    // Se a casa tem cor no banco, usa ela
    if (house.color && house.color !== "#3b82f6") return house.color;

    // Senão, tenta pegar do tema baseado no nome
    const theme = getThemeByName(house.name);
    return theme?.colors?.primary || house.color || "#3b82f6";
  };

  const getDisplayLogo = (houseId: string) => {
    const house = dynamicHouses.find((h) => h.id === houseId);
    if (!house) return undefined;

    // Se tem logo no R2, usa
    if (house.logoUrl) return house.logoUrl;

    // Senão, tenta usar logo do tema local
    const theme = getThemeByName(house.name);
    return theme?.logo;
  };

  const selectedColor = getDisplayColor(selectedHouse);
  const selectedLogo = getDisplayLogo(selectedHouse);
  const selectedName = getDisplayName(selectedHouse);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border transition"
        style={{
          borderColor: selectedColor,
          boxShadow: `0 0 12px ${selectedColor}20`,
        }}
      >
        <div className="flex-1 flex items-center gap-3 min-w-0">
          {selectedLogo && (
            <Image
              src={selectedLogo}
              alt={selectedName}
              width={120}
              height={32}
              className="h-6 w-auto object-contain"
              unoptimized
            />
          )}
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border rounded-lg z-50 overflow-hidden"
          style={{
            borderColor: selectedColor,
            boxShadow: `0 8px 32px ${selectedColor}35`,
          }}
        >
          <div className="max-h-96 overflow-y-auto">
            {loadingHouses ? (
              <div className="px-4 py-3 text-zinc-400 text-sm">Carregando...</div>
            ) : dynamicHouses.length === 0 ? (
              <div className="px-4 py-3 text-zinc-400 text-sm">Nenhuma casa disponível</div>
            ) : (
              dynamicHouses.map((house) => {
                const logoUrl = getDisplayLogo(house.id);
                const houseColor = getDisplayColor(house.id);

                return (
                  <button
                    key={house.id}
                    onClick={() => {
                      setSelectedHouse(house.id);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 transition bg-zinc-800 hover:bg-zinc-700 border-l-4"
                    style={{
                      borderLeftColor:
                        selectedHouse === house.id ? houseColor : "transparent",
                      boxShadow:
                        selectedHouse === house.id
                          ? `inset 0 0 15px ${houseColor}30`
                          : undefined,
                    }}
                  >
                    <div className="flex-1 flex items-center justify-center min-w-0">
                      {logoUrl && (
                        <Image
                          src={logoUrl}
                          alt={house.name}
                          width={140}
                          height={40}
                          className="h-8 w-auto object-contain"
                          unoptimized
                        />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
