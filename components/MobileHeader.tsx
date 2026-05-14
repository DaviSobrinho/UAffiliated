"use client";

import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useHouse } from "@/context/HouseContext";
import { useState, useEffect } from "react";

interface MobileHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function MobileHeader({ isOpen, onToggle }: MobileHeaderProps) {
  const { theme } = useHouse();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        setLogoLoading(true);
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setLogoUrl(data.logoUrl);
        }
      } catch (err) {
        console.error("Error fetching logo:", err);
      } finally {
        setLogoLoading(false);
      }
    };

    fetchLogo();
  }, []);

  return (
    <div
      className="xl:hidden fixed top-0 left-0 right-0 bg-zinc-950 border-b px-4 py-2 z-50 flex items-center justify-between h-14"
      style={{ borderBottomColor: theme.colors.primary }}
    >
      <div className="flex-1 flex items-center h-10">
        {logoLoading ? (
          <div className="h-full flex-1 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 rounded animate-pulse" />
        ) : logoUrl ? (
          <Image
            src={logoUrl}
            alt="UAffiliated"
            width={200}
            height={40}
            className="h-full w-auto object-contain"
            priority
          />
        ) : null}
      </div>
      <button onClick={onToggle} className="transition shrink-0" style={{ color: theme.colors.primary }}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );
}
