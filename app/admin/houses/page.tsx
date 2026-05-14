"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layouts/MainLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import HousesManagement from "@/components/admin/HousesManagement";

export default function HousesPage() {
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
      <DashboardHeader title="Casas de Aposta" subtitle="Crie e gerencie as casas de aposta" />

      <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        <HousesManagement />
      </div>
    </MainLayout>
  );
}
