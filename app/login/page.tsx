"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Settings } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <Settings className="absolute bottom-8 right-8 w-8 h-8 text-zinc-700 hover:text-zinc-600 transition cursor-pointer" />

      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image
            src="/uaffiliatedwide.png"
            alt="UAffiliated"
            width={400}
            height={160}
            className="w-80 h-auto rounded-2xl drop-shadow-lg"
            priority
          />
        </div>

        <div className="bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-zinc-800/50">
          <h1 className="text-sm font-semibold text-white mb-8 text-center tracking-widest uppercase">
            Entrar
          </h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm shadow-lg shadow-red-500/10">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 bg-zinc-100 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 hover:bg-zinc-50 transition shadow-md border border-zinc-200/50 hover:border-zinc-300/70 font-medium"
              required
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-zinc-100 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 hover:bg-zinc-50 transition shadow-md border border-zinc-200/50 hover:border-zinc-300/70 font-medium"
              required
            />

            <div className="flex items-center justify-between text-sm py-2">
              <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded-md bg-zinc-800 border border-zinc-600 cursor-pointer accent-blue-600 shadow-sm"
                />
                <span className="text-zinc-400">Lembrar-me</span>
              </label>
              <button
                type="button"
                className="text-zinc-500 hover:text-blue-600 transition cursor-pointer font-medium bg-none border-none p-0"
              >
                Esqueceu a senha?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 active:shadow-inner transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-6 uppercase tracking-wider text-sm shadow-lg shadow-blue-600/30 border border-blue-500/50 hover:shadow-xl hover:shadow-blue-600/40"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-zinc-800 pt-6">
            <p className="text-zinc-500 text-sm">
              Não tem conta?{" "}
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-500 font-semibold transition cursor-pointer underline decoration-blue-600/30 hover:decoration-blue-600"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
