import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: "singleton", logoUrl: "/uaffiliatedwide.png" },
      });
    }

    return NextResponse.json({ logoUrl: settings.logoUrl });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}
