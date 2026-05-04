"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { HOUSE_THEMES } from "@/lib/houseThemes";

interface LocalHouseSelectorProps {
  selectedHouse: string;
  onSelectHouse: (houseId: string) => void;
  primaryColor: string;
}

export default function LocalHouseSelector({
  selectedHouse,
  onSelectHouse,
  primaryColor,
}: LocalHouseSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentTheme = HOUSE_THEMES[selectedHouse];

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border transition cursor-pointer"
        style={{
          borderColor: primaryColor,
          boxShadow: `0 0 12px ${primaryColor}20`,
        }}
      >
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <Image
            src={currentTheme.logo}
            alt={currentTheme.name}
            width={120}
            height={32}
            className="h-6 w-auto object-contain"
          />
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
            {Object.values(HOUSE_THEMES).map((house) => (
              <button
                key={house.id}
                onClick={() => {
                  onSelectHouse(house.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 transition bg-zinc-800 hover:bg-zinc-700 border-l-4 cursor-pointer"
                style={{
                  borderLeftColor: selectedHouse === house.id ? house.colors.primary : "transparent",
                  boxShadow:
                    selectedHouse === house.id
                      ? `inset 0 0 15px ${house.colors.primary}30`
                      : undefined,
                }}
              >
                <div className="flex-1 flex items-center justify-center min-w-0">
                  <Image
                    src={house.logo}
                    alt={house.name}
                    width={140}
                    height={40}
                    className="h-8 w-auto object-contain"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
