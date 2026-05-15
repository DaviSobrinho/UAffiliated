"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { HOUSE_THEMES } from "@/lib/houseThemes";

interface DynamicHouse {
  id: string;
  name: string;
  color: string;
  logoUrl?: string;
}

interface StatelessHouseSelectorProps {
  value: string;
  onChange: (houseId: string) => void;
  primaryColor: string;
  disabled?: boolean;
}

export default function StatelessHouseSelector({
  value,
  onChange,
  primaryColor,
  disabled = false,
}: StatelessHouseSelectorProps) {
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
        console.error("Erro ao buscar casas:", err);
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

  const getThemeByName = (houseName: string) => {
    return Object.values(HOUSE_THEMES).find(
      (theme) => theme.name.toLowerCase() === houseName.toLowerCase()
    );
  };

  const getDisplayLogo = (house: DynamicHouse) => {
    const theme = getThemeByName(house.name);
    return house.logoUrl || theme?.logo || "";
  };

  const currentHouse = dynamicHouses.find((h) => h.id === value);
  const currentTheme = getThemeByName(currentHouse?.name || "") || HOUSE_THEMES.betano;
  const currentLogo = currentHouse ? getDisplayLogo(currentHouse) : currentTheme.logo;

  // Combine dynamic houses with pre-defined themes
  const allHouses = [
    ...dynamicHouses,
    ...Object.values(HOUSE_THEMES)
      .filter(theme => !dynamicHouses.find(h => h.name.toLowerCase() === theme.name.toLowerCase()))
      .map(theme => ({
        id: theme.id,
        name: theme.name,
        color: theme.colors.primary,
        logoUrl: theme.logo,
      })),
  ];

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          borderColor: primaryColor,
          boxShadow: disabled ? "none" : `0 0 12px ${primaryColor}20`,
        }}
      >
        <div className="flex-1 flex items-center gap-3 min-w-0">
          {currentLogo && (
            <Image
              src={currentLogo}
              alt={currentHouse?.name || "Casa"}
              width={120}
              height={32}
              className="h-6 w-auto object-contain"
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
            borderColor: primaryColor,
            boxShadow: `0 8px 32px ${primaryColor}35`,
          }}
        >
          <div className="max-h-96 overflow-y-auto">
            {loadingHouses ? (
              <div className="px-4 py-3 text-zinc-400 text-sm">Carregando casas...</div>
            ) : (
              allHouses.map((house) => {
                const theme = getThemeByName(house.name);
                const color = house.color || theme?.colors.primary || primaryColor;
                return (
                  <button
                    key={house.id}
                    type="button"
                    onClick={() => {
                      onChange(house.id);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 transition bg-zinc-800 hover:bg-zinc-700 border-l-4 cursor-pointer"
                    style={{
                      borderLeftColor: value === house.id ? color : "transparent",
                      boxShadow:
                        value === house.id
                          ? `inset 0 0 15px ${color}30`
                          : undefined,
                    }}
                  >
                    <div className="flex-1 flex items-center justify-center min-w-0">
                      {house.logoUrl && (
                        <Image
                          src={house.logoUrl}
                          alt={house.name}
                          width={140}
                          height={40}
                          className="h-8 w-auto object-contain"
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
