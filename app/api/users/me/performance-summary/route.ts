import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const houseId = searchParams.get("houseId");
    const timeframe = searchParams.get("timeframe") || "30d";

    if (!houseId) {
      return NextResponse.json(
        { error: "houseId é obrigatório" },
        { status: 400 }
      );
    }

    const TIMEFRAME_DAYS: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "3m": 90,
      "6m": 180,
      "1y": 365,
    };
    const days = TIMEFRAME_DAYS[timeframe] ?? 30;

    // Calculate date boundaries for the selected timeframe
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - days);

    // Get user's own house data
    const userHouseData = await prisma.userHouseData.findUnique({
      where: {
        userId_houseId: {
          userId: decoded.id,
          houseId,
        },
      },
    });

    // Calculate user's own revenue for the selected timeframe using snapshots
    const userSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: decoded.id,
        houseId,
        date: { gte: periodStart },
      },
    });

    const meuRevCents = userSnapshots.reduce((sum, snapshot) => {
      const cpaCents = userHouseData ? Math.round(Number(userHouseData.cpa) * 100) : 0;
      return sum + cpaCents * snapshot.qftds;
    }, 0);
    const meuRev = meuRevCents / 100;

    // Get only direct children (1st level)
    const directChildren = await prisma.user.findMany({
      where: { affiliateParentId: decoded.id },
      select: { id: true },
    });

    // Get house data only for direct children
    const directChildrenHouseData = await prisma.userHouseData.findMany({
      where: {
        userId: { in: directChildren.map((c) => c.id) },
        houseId,
      },
    });

    // Get snapshots for direct children in the selected timeframe
    const childrenSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: { in: directChildren.map((c) => c.id) },
        houseId,
        date: { gte: periodStart },
      },
    });

    const childQftdsMap = new Map<string, number>();
    for (const snapshot of childrenSnapshots) {
      childQftdsMap.set(snapshot.userId, (childQftdsMap.get(snapshot.userId) || 0) + snapshot.qftds);
    }

    // Calculate commission from direct children using integer arithmetic (cents)
    const comissaoEquipeCents = directChildrenHouseData.reduce((sum, data) => {
      const userCpaCents = userHouseData ? Math.round(Number(userHouseData.cpa) * 100) : 0;
      const childCpaCents = Math.round(Number(data.cpa) * 100);
      const cpaDifferenceCents = Math.max(0, userCpaCents - childCpaCents);
      const childQftds = childQftdsMap.get(data.userId) || 0;
      return sum + cpaDifferenceCents * childQftds;
    }, 0);
    const comissaoEquipe = comissaoEquipeCents / 100;

    const totalProprio = meuRev + comissaoEquipe;

    return NextResponse.json({
      meuRev,
      totalProprio,
      comissaoEquipe,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao calcular performance" },
      { status: 500 }
    );
  }
}
