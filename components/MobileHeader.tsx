"use client";

import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useHouse } from "@/context/HouseContext";

interface MobileHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function MobileHeader({ isOpen, onToggle }: MobileHeaderProps) {
  const { theme } = useHouse();

  return (
    <div
      className="xl:hidden fixed top-0 left-0 right-0 bg-zinc-950 border-b px-4 py-2 z-50 flex items-center justify-between h-14"
      style={{ borderBottomColor: theme.colors.primary }}
    >
      <div className="flex-1 flex items-center h-10">
        <Image
          src="/uaffiliatedwide.png"
          alt="UAffiliated"
          width={200}
          height={40}
          className="h-full w-auto object-contain"
        />
      </div>
      <button onClick={onToggle} className="transition shrink-0" style={{ color: theme.colors.primary }}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );
}
