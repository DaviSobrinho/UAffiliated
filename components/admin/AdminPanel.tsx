"use client";

import { useState, useEffect } from "react";
import { Search, ChevronRight } from "lucide-react";
import { useHouse } from "@/context/HouseContext";
import AdminUserModal from "./AdminUserModal";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}


const ITEMS_PER_PAGE = 10;
const TOTAL_LIMIT = 100;

export default function AdminPanel() {
  const { theme } = useHouse();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  useEffect(() => {
    fetchAllUsers();
    fetchLogo();
  }, []);

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


  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload-logo", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.logoUrl);
        setUploadMessage("✅ Logo atualizado com sucesso!");
        setTimeout(() => setUploadMessage(""), 3000);
      } else {
        const error = await res.json();
        setUploadMessage(`❌ ${error.error}`);
      }
    } catch (err) {
      console.error("Error uploading logo:", err);
      setUploadMessage("❌ Erro ao fazer upload da logo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

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
      <div className="space-y-6 md:space-y-8">
        {/* Site Settings Section */}
        <div className="bg-zinc-800/50 rounded-lg p-4 mb-6 border border-zinc-700">
          <h3 className="text-white font-semibold mb-4">Configurações do Site</h3>

          <div className="space-y-4">
            {/* Logo Preview */}
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-zinc-700 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                {logoLoading ? (
                  <div className="w-full h-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 animate-pulse" />
                ) : logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Current Logo"
                    className="w-full h-full object-contain p-2"
                  />
                ) : null}
              </div>

              <div className="flex-1">
                <label className="block mb-2">
                  <span className="text-zinc-300 text-sm font-medium mb-2 block">Fazer upload de logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-zinc-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-zinc-700 file:text-white
                      hover:file:bg-zinc-600
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>
                <p className="text-xs text-zinc-500">Máx 2MB. PNG, JPG ou WebP.</p>
              </div>
            </div>

            {uploadMessage && (
              <div className={`text-sm rounded-lg p-3 ${
                uploadMessage.startsWith("✅")
                  ? "bg-green-500/10 text-green-300 border border-green-500/30"
                  : "bg-red-500/10 text-red-300 border border-red-500/30"
              }`}>
                {uploadMessage}
              </div>
            )}
          </div>
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
                <div className="space-y-2 max-h-[700px] overflow-y-auto">
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
