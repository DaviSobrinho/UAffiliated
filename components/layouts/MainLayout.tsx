"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <div className="xl:ml-56">{children}</div>
    </div>
  );
}
