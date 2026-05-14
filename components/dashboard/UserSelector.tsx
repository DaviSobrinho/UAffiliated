"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useHouse } from "@/context/HouseContext";

interface User {
  id: string;
  name: string;
  email: string;
  level?: number;
}

interface UserSelectorProps {
  value: { id: string; name: string } | null;
  onChange: (user: { id: string; name: string } | null) => void;
}

export default function UserSelector({ value, onChange }: UserSelectorProps) {
  const { theme } = useHouse();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    if (users.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    onChange({ id: user.id, name: user.name });
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    onChange(null);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchUsers();
        }}
        className="w-full px-4 py-2.5 bg-zinc-800 border rounded-lg text-white flex items-center justify-between hover:bg-zinc-700 transition"
        style={{ borderColor: theme.colors.primary }}
      >
        <span>{value ? value.name : "Selecionar usuário"}</span>
        <ChevronDown size={18} className={`transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
          style={{ borderColor: theme.colors.primary }}
        >
          <button
            onClick={handleSelectAll}
            className="w-full px-4 py-3 text-left hover:bg-zinc-800/50 transition border-b first:rounded-t-lg"
            style={{ borderColor: theme.colors.primary }}
          >
            <span className="text-white font-medium">Todos (você)</span>
          </button>

          {loading && (
            <div className="px-4 py-3 text-zinc-400 text-sm text-center">
              Carregando...
            </div>
          )}

          {!loading && users.length > 0 && users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user)}
              className="w-full px-4 py-3 text-left hover:bg-zinc-800/50 transition border-b last:border-b-0"
              style={{ borderColor: theme.colors.primary }}
            >
              <div className="flex items-center justify-between">
                <div className="text-white font-medium">{user.name}</div>
                {user.level && (
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: "#000",
                    }}
                  >
                    N{user.level}
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-400">{user.email}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
