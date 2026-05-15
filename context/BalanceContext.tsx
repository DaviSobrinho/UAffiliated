"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface BalanceContextType {
  balance: string;
  setBalance: (value: string) => void;
  refreshBalance: (userId: string, houseId: string) => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState("R$ 0,00");

  const refreshBalance = useCallback(
    async (userId: string, houseId: string) => {
      try {
        const response = await fetch(
          `/api/admin/users/${userId}/house-data?houseId=${houseId}`
        );

        if (response.ok) {
          const data = await response.json();
          const reais = parseFloat(data.userHouseData?.balance || "0");
          const formatted = reais.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
          setBalance(formatted);
        }
      } catch (err) {
        console.error("[BALANCE] Erro ao atualizar saldo:", err);
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
