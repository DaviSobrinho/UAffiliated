import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { resolveHouseId } from "@/lib/house-utils";

function isAdmin(token: string | undefined): boolean {
  const decoded = verifyToken(token);
  return decoded?.role === "ADMIN";
}

const TIMEFRAME_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
};

const dateToString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return new Date(`${year}-${month}-${day}T00:00:00Z`);
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  try {
    const token = request.cookies.get("auth")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!isAdmin(token)) {
      return NextResponse.json({ error: "Apenas admin pode realizar esta ação" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const houseNameOrId = searchParams.get("houseId");
    const timeframe = searchParams.get("timeframe") || "30d";

    if (!houseNameOrId) {
      return NextResponse.json({ error: "houseId é obrigatório" }, { status: 400 });
    }

    const houseId = await resolveHouseId(houseNameOrId);
    if (!houseId) {
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
    }

    const days = TIMEFRAME_DAYS[timeframe] ?? 30;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const currentStart = new Date(now);
    currentStart.setDate(now.getDate() - days);

    const startDateObj = dateToString(currentStart);
    const endDateObj = new Date(now);
    endDateObj.setHours(23, 59, 59, 999);

    console.log("[SNAPSHOTS] Buscando para userId:", userId, "houseId:", houseId, "timeframe:", timeframe, "startDate:", startDateObj.toISOString(), "endDate:", endDateObj.toISOString());

    const snapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId,
        houseId,
        date: {
          gte: startDateObj,
          lte: endDateObj,
        },
      },
      orderBy: { date: "asc" },
    });

    console.log("[SNAPSHOTS] Encontrados:", snapshots.length, "registros");

    return NextResponse.json({ snapshots }, { status: 200 });
  } catch (error) {
    console.error("[SNAPSHOTS] Erro:", error);
    return NextResponse.json({ error: "Erro ao buscar snapshots" }, { status: 500 });
  }
}
