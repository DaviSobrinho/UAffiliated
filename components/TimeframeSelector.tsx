"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useHouse } from "@/context/HouseContext";

interface TimeframeSelectorProps {
  value: string;
  onChange: (timeframe: string) => void;
}

const TIMEFRAMES = [
  { id: "7d", label: "Últimos 7 dias" },
  { id: "30d", label: "Últimos 30 dias" },
  { id: "3m", label: "Últimos 3 meses" },
  { id: "6m", label: "Últimos 6 meses" },
  { id: "1y", label: "Último ano" },
];

export default function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  const { theme } = useHouse();
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

  const currentTimeframe = TIMEFRAMES.find((t) => t.id === value) || TIMEFRAMES[0];

  return (
    <div ref={dropdownRef} className="relative w-full md:w-64">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border transition duration-200"
        style={{
          borderColor: theme.colors.primary,
          boxShadow: `0 0 12px ${theme.colors.primary}20`,
        }}
      >
        <span className="text-sm font-medium text-white">{currentTimeframe.label}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: theme.colors.primary }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border rounded-lg z-50 overflow-hidden"
          style={{
            borderColor: theme.colors.primary,
            boxShadow: `0 8px 32px ${theme.colors.primary}35`,
          }}
        >
          <div className="max-h-96 overflow-y-auto">
            {TIMEFRAMES.map((timeframe) => (
              <button
                key={timeframe.id}
                onClick={() => {
                  onChange(timeframe.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-zinc-800 transition border-l-4 duration-200"
                style={{
                  borderLeftColor: value === timeframe.id ? theme.colors.primary : "transparent",
                  boxShadow:
                    value === timeframe.id
                      ? `inset 0 0 15px ${theme.colors.primary}30`
                      : undefined,
                }}
              >
                {timeframe.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
