"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
  required?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  placeholder = "Selecione...",
  options,
  required = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-zinc-100 rounded-2xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 hover:bg-zinc-50 transition shadow-md border border-zinc-200/50 hover:border-zinc-300/70 font-medium flex items-center justify-between"
      >
        <span className={value ? "text-zinc-900" : "text-zinc-500"}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={18}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-zinc-200/70 z-50 overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-3 text-left font-medium transition ${
                  value === option.value
                    ? "bg-blue-600 text-white"
                    : "text-zinc-900 hover:bg-blue-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {required && !value && (
        <input type="hidden" required />
      )}
    </div>
  );
}
