"use client";

import { useRef, useEffect } from "react";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  primaryColor: string;
  disabled?: boolean;
}

export default function CurrencyInput({
  value,
  onChange,
  primaryColor,
  disabled = false,
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = formatDisplay(value);
    }
  }, [value]);

  const formatDisplay = (numericOnly: string): string => {
    if (!numericOnly) return "";

    let cleaned = numericOnly;

    // Se valor > 100 centavos (3+ dígitos), remove zeros à esquerda
    if (cleaned.length > 2) {
      cleaned = cleaned.replace(/^0+/, "") || "0";
    }

    const length = cleaned.length;
    if (length === 1) return `0,0${cleaned}`;
    if (length === 2) return `0,${cleaned}`;

    const reais = cleaned.slice(0, -2);
    const centavos = cleaned.slice(-2);
    return `${reais},${centavos}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericOnly = inputValue.replace(/\D/g, "");

    onChange(numericOnly);
    e.currentTarget.value = formatDisplay(numericOnly);
  };

  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  return (
    <div
      className="inline-flex items-center rounded-lg border px-4 py-2 transition-all duration-200"
      style={{
        borderColor: disabled ? "rgba(200, 200, 200, 0.2)" : primaryColor,
        backgroundColor: "#18181b",
        width: "fit-content",
      }}
    >
      <span
        className="text-sm font-semibold whitespace-nowrap mr-2"
        style={{ color: disabled ? "rgba(200, 200, 200, 0.4)" : "rgba(200, 200, 200, 0.6)" }}
      >
        R$
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        onChange={handleInputChange}
        onFocus={handleFocus}
        disabled={disabled}
        placeholder="0,00"
        className="bg-transparent text-white font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed w-24"
        style={{
          color: disabled ? "rgba(200, 200, 200, 0.4)" : "white",
          textAlign: "left",
        }}
      />

      <style jsx>{`
        input {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
