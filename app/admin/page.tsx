"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layouts/MainLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AdminPanel from "@/components/admin/AdminPanel";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      if (userData.role !== "ADMIN") {
        router.push("/dashboard");
      }
    }
  }, [router]);

  return (
    <MainLayout>
      <DashboardHeader title="Painel de Administração" subtitle="Gerencie usuários e configurações do sistema" />

      <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        <AdminPanel />
      </div>
    </MainLayout>
  );
}
