"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface BalanceContextType {
  balance: string;
  setBalance: (value: string) => void;
  refreshBalance: (houseId: string) => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState("R$ 0,00");

  const refreshBalance = useCallback(
    async (houseId: string) => {
      try {
        // Use /api/users/me/house-data for current logged-in user (not admin endpoint)
        const response = await fetch(
          `/api/users/me/house-data?houseId=${houseId}`
        );

        if (response.ok) {
          const data = await response.json();
          const reais = parseFloat(data.houseData?.balance || "0");
          const formatted = reais.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
          setBalance(formatted);
        } else {
          // If balance can't be fetched, show 0
          setBalance("R$ 0,00");
        }
      } catch (err) {
        console.error("[BALANCE] Erro ao atualizar saldo:", err);
        setBalance("R$ 0,00");
      }
    },
    []
  );

  return (
    <BalanceContext.Provider value={{ balance, setBalance, refreshBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error("useBalance deve ser usado dentro de BalanceProvider");
  }
  return context;
}
