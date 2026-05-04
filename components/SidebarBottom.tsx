"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useHouse } from "@/context/HouseContext";

export default function SidebarBottom() {
  const router = useRouter();
  const { theme } = useHouse();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div
      className="space-y-3 pt-4 px-4"
      style={{ borderTopColor: theme.colors.primary, borderTopWidth: "2px" }}
    >
      <div
        className="bg-zinc-900 rounded-lg p-3 border"
        style={{
          borderColor: theme.colors.primary,
          boxShadow: `0 0 15px ${theme.colors.primary}30`,
        }}
      >
        <p className="text-xs text-zinc-500">Seu Payout</p>
        <p className="text-white font-bold text-sm">R$ 0 / R$ 100K</p>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-zinc-900 transition"
      >
        <LogOut size={18} />
        <span className="text-sm font-medium">Sair</span>
      </button>
    </div>
  );
}
