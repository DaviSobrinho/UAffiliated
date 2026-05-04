"use client";

import { useState, useEffect } from "react";
import { Search, ChevronRight, Settings } from "lucide-react";
import { useHouse } from "@/context/HouseContext";
import AdminUserModal from "./AdminUserModal";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

const ITEMS_PER_PAGE = 5;
const TOTAL_LIMIT = 100;

export default function AdminPanel() {
  const { theme } = useHouse();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users.slice(0, TOTAL_LIMIT));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        className="rounded-lg border bg-zinc-900/50 p-6 space-y-4"
        style={{
          borderColor: theme.colors.primary,
          boxShadow: `0 0 15px ${theme.colors.primary}20`,
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Settings size={20} style={{ color: theme.colors.primary }} />
          <h2 className="text-lg md:text-xl font-bold text-white">Painel de Administração</h2>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Busca por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition"
            style={{
              borderColor: theme.colors.primary,
              "--tw-ring-color": theme.colors.primary,
            } as React.CSSProperties}
          />
        </div>

        {/* User List */}
        {loading ? (
          <div className="text-center py-4 text-zinc-400">Carregando...</div>
        ) : (
          <>
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-4 text-zinc-400">
                  <p>Nenhum usuário encontrado</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {paginatedUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center justify-between p-3 bg-zinc-800 border rounded-lg hover:bg-zinc-700 transition cursor-pointer"
                      style={{
                        borderColor: theme.colors.primary,
                      }}
                    >
                      <div className="text-left">
                        <p className="text-white font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-zinc-400">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.role === "ADMIN" ? (
                          <span
                            className="px-2 py-1 text-xs font-medium rounded"
                            style={{
                              border: `1px solid ${theme.colors.primary}`,
                              color: theme.colors.primary,
                            }}
                          >
                            ║ {user.role} ║
                          </span>
                        ) : (
                          <span
                            className="px-2 py-1 text-xs font-medium rounded"
                            style={{
                              border: `1px solid ${theme.colors.primary}`,
                              color: theme.colors.primary,
                            }}
                          >
                            {user.role}
                          </span>
                        )}
                        <ChevronRight
                          size={16}
                          style={{ color: theme.colors.primary }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && filteredUsers.length > 0 && (
              <div className="flex items-center justify-center gap-2 pt-4 border-t" style={{ borderColor: theme.colors.primary }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition cursor-pointer"
                  style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
                >
                  ← Anterior
                </button>
                <span className="text-sm text-zinc-400">
                  {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition"
                  style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
                >
                  Próximo →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedUser && (
        <AdminUserModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onUpdated={fetchAllUsers}
        />
      )}
    </>
  );
}
