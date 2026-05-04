"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
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
  const [searchInput, setSearchInput] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync searchInput with value
  useEffect(() => {
    if (value) {
      setSearchInput(value.name);
    } else {
      setSearchInput("");
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchInput(newValue);
    setIsOpen(true);

    if (debounceTimer) clearTimeout(debounceTimer);

    if (newValue.trim() === "") {
      onChange(null);
      setUsers([]);
      setLoading(false);
    } else {
      const timer = setTimeout(() => {
        fetchUsers(newValue);
      }, 300);
      setDebounceTimer(timer);
    }
  };

  const handleSelectUser = (user: User) => {
    onChange({ id: user.id, name: user.name });
    setSearchInput(user.name);
    setIsOpen(false);
    setUsers([]);
  };

  const handleSelectAll = () => {
    onChange(null);
    setSearchInput("");
    setIsOpen(false);
    setUsers([]);
  };

  const handleClear = () => {
    handleSelectAll();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          size={18}
        />
        <input
          type="text"
          placeholder="Buscar usu�rio..."
          value={searchInput}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-12 pr-10 py-2 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition"
          style={{
            borderColor: theme.colors.primary,
            "--tw-ring-color": theme.colors.primary,
          } as React.CSSProperties}
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
          style={{ borderColor: theme.colors.primary }}
        >
          {/* "Todos (voc�)" option */}
          <button
            onClick={handleSelectAll}
            className="w-full px-4 py-3 text-left hover:bg-zinc-800/50 transition border-b first:rounded-t-lg"
            style={{ borderColor: theme.colors.primary }}
          >
            <span className="text-white font-medium">Todos (voc�)</span>
          </button>

          {/* Loading state */}
          {loading && (
            <div className="px-4 py-3 text-zinc-400 text-sm text-center">
              Carregando...
            </div>
          )}

          {/* Users list */}
          {!loading && users.length > 0 ? (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="w-full px-4 py-3 text-left hover:bg-zinc-800/50 transition border-b last:border-b-0"
                style={{
                  borderColor: theme.colors.primary,
                }}
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
            ))
          ) : !loading && (
            <div className="px-4 py-3 text-zinc-400 text-sm text-center">
              {searchInput ? "Nenhum usu�rio encontrado" : "Comece a digitar para buscar"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
