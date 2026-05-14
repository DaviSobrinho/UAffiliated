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
    const fetchHouses = async () => {
      try {
        const res = await fetch("/api/admin/houses");
        if (res.ok) {
          const data = await res.json();
          setDynamicHouses(data.houses || []);
        }
      } catch (err) {
        console.error("Error fetching houses:", err);
      } finally {
        setLoadingHouses(false);
      }
    };

    fetchHouses();
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

  const currentTheme = HOUSE_THEMES[selectedHouse] || HOUSE_THEMES.betano;

  const getDisplayName = (houseId: string) => {
    const dynamic = dynamicHouses.find((h) => h.id === houseId);
    return dynamic?.name || currentTheme?.name || "Casa";
  };

  const getDisplayLogo = (houseId: string) => {
    const dynamic = dynamicHouses.find((h) => h.id === houseId);
    if (dynamic?.logoUrl) return dynamic.logoUrl;
    return currentTheme?.logo || "/betano.png";
  };

  const allHouses = [
    ...Object.values(HOUSE_THEMES),
    ...dynamicHouses.filter(
      (dh) => !Object.values(HOUSE_THEMES).some((th) => th.id === dh.id)
    ),
  ];

  const selectedColor = currentTheme?.colors?.primary || "#3b82f6";
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
            ) : (
              allHouses.map((house) => {
                const isDynamic = dynamicHouses.some((dh) => dh.id === house.id);
                const dynamicHouse = dynamicHouses.find((dh) => dh.id === house.id);
                const logoUrl = isDynamic ? dynamicHouse?.logoUrl : (house as any).logo;
                const houseColor = isDynamic ? dynamicHouse?.color : (house as any).colors?.primary || "#3b82f6";

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
