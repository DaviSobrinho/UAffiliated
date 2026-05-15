import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const startTime = Date.now();
  try {
    console.log("[SETTINGS] 🔧 Buscando settings...");

    const queryStart = Date.now();
    let settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });
    console.log(`[SETTINGS] ✓ Query em ${Date.now() - queryStart}ms`);

    if (!settings) {
      console.log("[SETTINGS] 📝 Criando settings padrão...");
      const createStart = Date.now();
      settings = await prisma.siteSettings.create({
        data: { id: "singleton", logoUrl: "/uaffiliatedwide.png" },
      });
      console.log(`[SETTINGS] ✓ Settings criado em ${Date.now() - createStart}ms`);
    }

    const duration = Date.now() - startTime;
    console.log(`[SETTINGS] ✅ Logo URL: ${settings.logoUrl} (${duration}ms)`);
    return NextResponse.json({ logoUrl: settings.logoUrl });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[SETTINGS] 💥 ERRO após ${duration}ms:`, error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}
