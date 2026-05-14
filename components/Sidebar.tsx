"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Network,
  FileText,
  DollarSign,
  Percent,
  User,
  Gift,
  Settings,
  Building2,
} from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import HouseSelector from "@/components/HouseSelector";
import SidebarBottom from "@/components/SidebarBottom";
import MobileDrawerBottom from "@/components/MobileDrawerBottom";
import MobileHeader from "@/components/MobileHeader";
import { useHouse } from "@/context/HouseContext";

export default function Sidebar() {
  const { theme } = useHouse();
  const [isOpen, setIsOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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

    const checkAdmin = () => {
      const user = localStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        setIsAdmin(userData.role === "ADMIN");
      }
    };

    fetchLogo();
    checkAdmin();
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Minha Equipe", href: "/team" },
    { icon: Network, label: "Minha Rede", href: "#" },
    { icon: FileText, label: "Materiais", href: "#" },
    { icon: DollarSign, label: "Financeiro", href: "#" },
    { icon: Percent, label: "Plano de Comissão", href: "#" },
    { icon: User, label: "Meu Perfil", href: "#" },
    { icon: Gift, label: "Premiações", href: "#" },
  ];

  const adminMenuItems = [
    { icon: Settings, label: "Admin", href: "/admin" },
    { icon: Building2, label: "Casas", href: "/admin/houses" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden xl:flex fixed left-0 top-0 h-screen w-56 bg-zinc-950 border-r border-zinc-800 z-40 flex-col ">
        {/* Logo */}
        <div className="w-full px-4 py-4 mb-8 flex items-center justify-center h-24">
          {logoLoading ? (
            <div className="w-full h-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 rounded-lg animate-pulse" />
          ) : logoUrl ? (
            <Image
              src={logoUrl}
              alt="UAffiliated"
              width={224}
              height={96}
              className="w-full h-full object-contain"
              priority
            />
          ) : null}
        </div>

        {/* House Selector */}
        <div className="mb-6 px-4">
          <HouseSelector />
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all duration-200 group"
            >
              <item.icon size={18} style={{ color: theme.colors.primary }} className="group-hover:scale-125 transition-transform duration-300" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}

          {/* Admin Menu Items */}
          {isAdmin && (
            <>
              <div className="my-2 border-t border-zinc-800" />
              {adminMenuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all duration-200 group"
                >
                  <item.icon size={18} style={{ color: theme.colors.primary }} className="group-hover:scale-125 transition-transform duration-300" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Bottom Section */}
        <SidebarBottom />
      </div>

      {/* Mobile Header */}
      <MobileHeader isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="xl:hidden fixed inset-0 top-14 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="xl:hidden fixed top-14 left-0 bottom-0 w-full sm:w-3/4 sm:max-w-xs bg-zinc-950 border-r border-zinc-800 z-40 overflow-y-auto flex flex-col">
          {/* House Selector - Mobile */}
          <div className="px-4 py-4 border-b border-zinc-800">
            <HouseSelector />
          </div>

          <nav className="space-y-1 p-4 flex-1">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
                onClick={() => setIsOpen(false)}
              >
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}

            {/* Admin Menu Items - Mobile */}
            {isAdmin && (
              <>
                <div className="my-2 border-t border-zinc-800" />
                {adminMenuItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </>
            )}
          </nav>

          <MobileDrawerBottom onLogoutClick={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
}
