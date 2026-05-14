import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// BFS to collect all descendant IDs
async function getAllDescendants(userId: string): Promise<string[]> {
  const descendants: string[] = [];
  const visited = new Set<string>();
  const queue = [userId];

  while (queue.length > 0) {
    const currentId = queue.shift();

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

// Get direct children IDs
async function getDirectChildren(userId: string): Promise<string[]> {
  const children = await prisma.user.findMany({
    where: { affiliateParentId: userId },
    select: { id: true },
  });

  return children.map((c) => c.id);
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

    // Get DIRECT CHILDREN only
    const directChildrenIds = await getDirectChildren(decoded.id);

    let comissaoEquipe = 0;
    if (directChildrenIds.length > 0) {
      // Get house data for direct children
      const directChildrenHouseData = await prisma.userHouseData.findMany({
        where: {
          userId: { in: directChildrenIds },
          houseId,
        },
      });

      // For each direct child, calculate total QFTDS of child + all its descendants
      const comissaoEquipeCents = await Promise.all(
        directChildrenIds.map(async (childId) => {
          const childHouseData = directChildrenHouseData.find((d) => d.userId === childId);
          if (!childHouseData) return 0;

          // Get all descendants of this child
          const childDescendants = await getAllDescendants(childId);
          const allInSubtree = [childId, ...childDescendants];

          // Get snapshots for child + all its descendants in selected timeframe
          const subtreeSnapshots = await prisma.dailySnapshot.findMany({
            where: {
              userId: { in: allInSubtree },
              houseId,
              date: { gte: periodStart },
            },
          });

          // Sum QFTDS of entire subtree
          const subtreeQftds = subtreeSnapshots.reduce((sum, snap) => sum + snap.qftds, 0);

          // Calculate commission: (My CPA - Child CPA) × Total QFTDS of subtree
          const userCpaCents = userHouseData ? Math.round(Number(userHouseData.cpa) * 100) : 0;
          const childCpaCents = Math.round(Number(childHouseData.cpa) * 100);
          const cpaDifferenceCents = Math.max(0, userCpaCents - childCpaCents);

          return cpaDifferenceCents * subtreeQftds;
        })
      );

      comissaoEquipe = (comissaoEquipeCents.reduce((a, b) => a + b, 0)) / 100;
    }

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
