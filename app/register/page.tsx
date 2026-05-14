"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Settings, Eye, EyeOff } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [market, setMarket] = useState("");
  const [ftdsPerMonth, setFtdsPerMonth] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

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

    fetchLogo();
  }, []);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");

    if (!termsAccepted) {
      setError("Você deve concordar com os Termos de Uso");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          instagram,
          phone,
          market,
          ftdsPerMonth,
          ...(referralCode && { referralCode }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
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
          {logoLoading ? (
            <div className="w-80 h-40 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 rounded-2xl animate-pulse drop-shadow-lg" />
          ) : logoUrl ? (
            <Image
              src={logoUrl}
              alt="UAffiliated"
              width={400}
              height={160}
              className="w-80 h-auto rounded-2xl drop-shadow-lg"
              priority
            />
          ) : null}
        </div>

        <div className="bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-zinc-800/50">
          <h1 className="text-sm font-semibold text-white mb-8 text-center tracking-widest uppercase">
            Criar Conta
          </h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm shadow-lg shadow-red-500/10">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Nome completo</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full px-4 py-3 bg-zinc-100 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 hover:bg-zinc-50 transition shadow-md border border-zinc-200/50 hover:border-zinc-300/70 font-medium"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-zinc-100 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 hover:bg-zinc-50 transition shadow-md border border-zinc-200/50 hover:border-zinc-300/70 font-medium"
                required
              />
            </div>

            <div>
              <label htmlFor="instagram" className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Instagram</label>
              <input
                id="instagram"
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@ seu_usuario"
                className="w-full px-4 py-3 bg-zinc-100 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 hover:bg-zinc-50 transition shadow-md border border-zinc-200/50 hover:border-zinc-300/70 font-medium"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Telefone (WhatsApp)</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3 bg-zinc-100 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 hover:bg-zinc-50 transition shadow-md border border-zinc-200/50 hover:border-zinc-300/70 font-medium"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Senha</label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-zinc-100 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 hover:bg-zinc-50 transition shadow-md border border-zinc-200/50 hover:border-zinc-300/70 font-medium pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-zinc-600 hover:text-blue-600 transition cursor-pointer hover:scale-110 active:scale-95"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Confirmar senha</label>
              <div className="relative flex items-center">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digita a senha novamente"
                  className="w-full px-4 py-3 bg-zinc-100 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 hover:bg-zinc-50 transition shadow-md border border-zinc-200/50 hover:border-zinc-300/70 font-medium pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 text-zinc-600 hover:text-blue-600 transition cursor-pointer hover:scale-110 active:scale-95"
                >
                  {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Principal mercado</label>
              <CustomSelect
                value={market}
                onChange={setMarket}
                placeholder="Selecione..."
                options={[
                  { value: "apostas-esportivas", label: "Apostas Esportivas (Sportsbook)" },
                  { value: "cassino-slots", label: "Cassino (Slots, Crash & Instant Games)" },
                  { value: "cassino-vivo", label: "Cassino ao Vivo (Live Casino)" },
                  { value: "streamer-igaming", label: "Streamer iGaming (Lives & Plataformas)" },
                  { value: "influenciador", label: "Influenciador" },
                  { value: "gerente-afiliados", label: "Gerente de Afiliados" },
                ]}
                required
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Quantos FTDs você pretende gerar por mês?</label>
              <CustomSelect
                value={ftdsPerMonth}
                onChange={setFtdsPerMonth}
                placeholder="Selecione..."
                options={[
                  { value: "0-100", label: "0 - 100" },
                  { value: "101-250", label: "101 - 250" },
                  { value: "251-500", label: "251 - 500" },
                  { value: "501-1000", label: "501 - 1.000" },
                  { value: "1001-2000", label: "1.001 - 2.000" },
                  { value: "2001-5000", label: "2.001 - 5.000" },
                  { value: "5001-10000", label: "5.001 - 10.000" },
                  { value: "10000+", label: "+10.000" },
                ]}
                required
              />
            </div>

            <div>
              <label htmlFor="referral" className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Código de indicação (opcional)</label>
              <input
                id="referral"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Cole o código ou link de indicação"
                className="w-full px-4 py-3 bg-zinc-100 rounded-xl text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 hover:bg-zinc-50 transition shadow-md border border-zinc-200/50 hover:border-zinc-300/70 font-medium"
              />
              <p className="text-xs text-zinc-500 mt-1">Você será vinculado ao seu indicador na árvore de afiliados</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer py-2 hover:opacity-80 transition">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-5 h-5 rounded-md bg-zinc-800 border border-zinc-600 cursor-pointer mt-0.5 shrink-0 accent-blue-600 shadow-sm"
              />
              <span className="text-zinc-400 text-sm leading-5">
                Li e concordo com os <button type="button" className="text-blue-600 hover:text-blue-500 font-medium transition cursor-pointer underline decoration-blue-600/30 hover:decoration-blue-600 bg-none border-none p-0">Termos de Uso</button> e <button type="button" className="text-blue-600 hover:text-blue-500 font-medium transition cursor-pointer underline decoration-blue-600/30 hover:decoration-blue-600 bg-none border-none p-0">Política de Privacidade</button>.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 active:shadow-inner transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-6 uppercase tracking-wider text-sm shadow-lg shadow-blue-600/30 border border-blue-500/50 hover:shadow-xl hover:shadow-blue-600/40"
            >
              {loading ? "Criando conta..." : "Criar Conta"}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-zinc-800 pt-6">
            <Link
              href="/login"
              className="text-zinc-500 hover:text-blue-600 font-semibold transition text-sm cursor-pointer underline decoration-zinc-600/30 hover:decoration-blue-600"
            >
              Voltar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
