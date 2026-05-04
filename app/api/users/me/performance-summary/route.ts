import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

// BFS to collect all descendant IDs
async function getAllDescendants(userId: string): Promise<string[]> {
  const descendants: string[] = [];
  const visited = new Set<string>();
  const queue = [userId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const children = await prisma.user.findMany({
      where: { affiliateParentId: currentId },
      select: { id: true },
    });

    for (const child of children) {
      descendants.push(child.id);
      queue.push(child.id);
    }
  }

  return descendants;
}

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

    // Get ALL descendants (entire tree) for commission calculation
    const descendantIds = await getAllDescendants(decoded.id);

    // Get house data for all descendants
    const descendantHouseData = await prisma.userHouseData.findMany({
      where: {
        userId: { in: descendantIds },
        houseId,
      },
    });

    // Get snapshots for all descendants in the selected timeframe
    const descendantSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: { in: descendantIds },
        houseId,
        date: { gte: periodStart },
      },
    });

    const descendantQftdsMap = new Map<string, number>();
    for (const snapshot of descendantSnapshots) {
      descendantQftdsMap.set(snapshot.userId, (descendantQftdsMap.get(snapshot.userId) || 0) + snapshot.qftds);
    }

    // Calculate commission from ALL descendants (entire tree) using integer arithmetic (cents)
    // comissaoEquipe = Σ(Meu CPA - CPA de cada descendente) × QFTDS de cada descendente
    const comissaoEquipeCents = descendantHouseData.reduce((sum, data) => {
      const userCpaCents = userHouseData ? Math.round(Number(userHouseData.cpa) * 100) : 0;
      const descendantCpaCents = Math.round(Number(data.cpa) * 100);
      const cpaDifferenceCents = Math.max(0, userCpaCents - descendantCpaCents);
      const descendantQftds = descendantQftdsMap.get(data.userId) || 0;
      return sum + cpaDifferenceCents * descendantQftds;
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
