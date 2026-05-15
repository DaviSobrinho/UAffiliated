"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Link2 } from "lucide-react";
import Image from "next/image";
import { useHouse } from "@/context/HouseContext";
import { useLogo } from "@/context/LogoContext";

interface ReferralLinkSectionProps {
  referralLink: string;
}

export default function ReferralLinkSection({ referralLink }: ReferralLinkSectionProps) {
  const { theme } = useHouse();
  const { logoUrl, logoLoading } = useLogo();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnSocial = (platform: string) => {
    const encodedLink = encodeURIComponent(referralLink);
    const shareText = encodeURIComponent("Junte-se à minha equipe no UAffiliated!");

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${shareText}%20${encodedLink}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
      twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedLink}`,
      tiktok: `https://www.tiktok.com/share?url=${encodedLink}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <div
      className="rounded-lg p-6 border bg-zinc-900/50 space-y-4 transition-all duration-300"
      style={{
        borderColor: theme.colors.primary,
        boxShadow: `0 0 15px ${theme.colors.primary}20`,
      }}
    >
      <div className="flex items-start gap-3">
        {logoLoading ? (
          <div className="h-8 w-24 bg-zinc-700 rounded animate-pulse" />
        ) : logoUrl ? (
          <Image
            src={logoUrl}
            alt="UAffiliated"
            width={120}
            height={40}
            className="h-8 w-auto"
          />
        ) : (
          <div className="h-8 w-24 bg-zinc-700 rounded" />
        )}
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
            <Link2 size={20} style={{ color: theme.colors.primary }} />
            Link de indicação UAffiliated
          </h3>
          <p className="text-zinc-400 text-sm">
            Compartilhe este link para convidar novos afiliados para a plataforma
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={referralLink}
          readOnly
          className="flex-1 px-4 py-2 bg-zinc-800 border rounded-lg text-white text-sm font-mono"
          style={{
            borderColor: theme.colors.primary,
          }}
        />
        <button
          onClick={handleCopy}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:scale-102 border bg-zinc-800 hover:bg-zinc-700"
          style={{
            borderColor: theme.colors.primary,
            boxShadow: `0 0 12px ${theme.colors.primary}30`,
          }}
        >
          {copied ? (
            <>
              <Check size={16} />
              <span className="hidden sm:inline">Copiado</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span className="hidden sm:inline">Copiar Link</span>
            </>
          )}
        </button>
      </div>

      <div className="pt-2">
        <p className="text-xs text-zinc-500 mb-2">Compartilhar:</p>
        <div className="flex gap-3">
          <button
            onClick={() => shareOnSocial("whatsapp")}
            className="w-12 h-12 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition flex items-center justify-center hover:scale-110"
            title="Compartilhar no WhatsApp"
          >
            <Image src="/wpp.png" alt="WhatsApp" width={28} height={28} className="w-7 h-7" />
          </button>
          <button
            onClick={() => shareOnSocial("facebook")}
            className="w-12 h-12 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition flex items-center justify-center hover:scale-110"
            title="Compartilhar no Facebook"
          >
            <Image src="/fb.png" alt="Facebook" width={28} height={28} className="w-7 h-7" />
          </button>
          <button
            onClick={() => shareOnSocial("twitter")}
            className="w-12 h-12 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition flex items-center justify-center hover:scale-110"
            title="Compartilhar no Twitter"
          >
            <Image src="/tt.png" alt="Twitter" width={28} height={28} className="w-7 h-7" />
          </button>
          <button
            onClick={() => shareOnSocial("tiktok")}
            className="w-12 h-12 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition flex items-center justify-center hover:scale-110"
            title="Compartilhar no TikTok"
          >
            <Image src="/tiktok.png" alt="TikTok" width={28} height={28} className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
}
