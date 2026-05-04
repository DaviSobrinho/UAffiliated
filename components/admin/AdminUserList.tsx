"use client";

import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { useHouse } from "@/context/HouseContext";
import AdminUserModal from "./AdminUserModal";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminUserListProps {
  users: User[];
  onUsersUpdated: () => void;
}

export default function AdminUserList({ users, onUsersUpdated }: AdminUserListProps) {
  const { theme } = useHouse();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg md:text-xl font-bold text-white">Usuários do Sistema</h3>

        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Busca por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-900 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition"
            style={{
              borderColor: theme.colors.primary,
              "--tw-ring-color": theme.colors.primary,
            } as React.CSSProperties}
          />
        </div>

        {/* User List */}
        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="w-full flex items-center justify-between p-4 bg-zinc-900 border rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                style={{
                  borderColor: theme.colors.primary,
                }}
              >
                <div className="text-left">
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-sm text-zinc-400">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-3 py-1 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: user.role === "ADMIN" ? theme.colors.primary : "transparent",
                      color: user.role === "ADMIN" ? "white" : theme.colors.primary,
                      border: `1px solid ${theme.colors.primary}`,
                    }}
                  >
                    {user.role}
                  </span>
                  <ChevronRight size={20} style={{ color: theme.colors.primary }} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedUser && (
        <AdminUserModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onUpdated={onUsersUpdated}
        />
      )}
    </>
  );
}
