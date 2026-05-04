import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

const TIMEFRAME_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
};

// BFS to collect all descendant IDs
async function getAllDescendants(userId: string): Promise<string[]> {
  const descendants: string[] = [userId];
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

// BFS to verify if nodeId is a descendant of userId
async function isDescendantOf(userId: string, nodeId: string): Promise<boolean> {
  if (nodeId === userId) return true;

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
      if (child.id === nodeId) return true;
      queue.push(child.id);
    }
  }

  return false;
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
    const houseId = searchParams.get("houseId") || "betano";
    const affiliateId = searchParams.get("affiliateId") || "all";
    const timeframe = searchParams.get("timeframe") || "30d";

    const days = TIMEFRAME_DAYS[timeframe] ?? 30;

    // Determine target user IDs
    let targetIds: string[] = [];

    if (affiliateId === "all") {
      targetIds = await getAllDescendants(decoded.id);
    } else if (affiliateId === decoded.id) {
      targetIds = [decoded.id];
    } else {
      const isAdmin = decoded.role === "ADMIN";
      if (!isAdmin) {
        const isDescendant = await isDescendantOf(decoded.id, affiliateId);
        if (!isDescendant) {
          return NextResponse.json(
            { error: "Você não tem acesso a este afiliado" },
            { status: 403 }
          );
        }
      }
      targetIds = await getAllDescendants(affiliateId);
    }

    // Compute date boundaries for timeline (based on timeframe)
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const currentStart = new Date(now);
    currentStart.setDate(now.getDate() - days);

    const previousStart = new Date(currentStart);
    previousStart.setDate(currentStart.getDate() - days);

    // Compute calendar month boundaries for comparison (independent of timeframe)
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevMonthStart.setHours(0, 0, 0, 0);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    prevMonthEnd.setHours(23, 59, 59, 999);

    // Query snapshots for current period (timeline, based on timeframe)
    const currentSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: { in: targetIds },
        houseId,
        date: { gte: currentStart },
      },
      orderBy: { date: "asc" },
    });

    // Query snapshots for previous period (timeline, based on timeframe)
    const previousSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: { in: targetIds },
        houseId,
        date: { gte: previousStart, lt: currentStart },
      },
    });

    // Query snapshots for current calendar month (for comparison)
    const currentMonthSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: { in: targetIds },
        houseId,
        date: { gte: currentMonthStart },
      },
    });

    // Query snapshots for previous calendar month (for comparison)
    const prevMonthSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: { in: targetIds },
        houseId,
        date: { gte: prevMonthStart, lte: prevMonthEnd },
      },
    });

    // Fetch user's CPA for commission calculation
    const userHouseData = await prisma.userHouseData.findUnique({
      where: {
        userId_houseId: {
          userId: decoded.id,
          houseId,
        },
      },
    });

    const userCpaCents = userHouseData ? Math.round(Number(userHouseData.cpa) * 100) : 0;

    // Fetch CPAs for all target users (to calculate commission using CPA difference)
    const targetUserHouseData = await prisma.userHouseData.findMany({
      where: {
        userId: { in: targetIds },
        houseId,
      },
    });

    const cpaByCpnserId = new Map(
      targetUserHouseData.map((data) => [data.userId, Math.round(Number(data.cpa) * 100)])
    );

    // Build timeline: group by date, calculate commission using CPA difference (in cents)
    const timelineMapCents = new Map<string, number>();
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      timelineMapCents.set(dateStr, 0);
    }

    for (const snapshot of currentSnapshots) {
      const dateStr = new Date(snapshot.date).toISOString().slice(0, 10);
      const currentCents = timelineMapCents.get(dateStr) || 0;

      // Calculate commission using CPA difference: (My CPA - Their CPA) × QFTDS
      const snapshotUserCpaCents = cpaByCpnserId.get(snapshot.userId) || 0;
      const cpaDifferenceCents = Math.max(0, userCpaCents - snapshotUserCpaCents);
      const commissionCents = cpaDifferenceCents * snapshot.qftds;

      timelineMapCents.set(dateStr, currentCents + commissionCents);
    }

    const timeline = Array.from(timelineMapCents, ([date, revenueCents]) => ({ date, revenue: revenueCents / 100 }));

    // Build funnel: sum registros, ftds, qftds
    const funnel = currentSnapshots.reduce(
      (acc, s) => ({
        registros: acc.registros + s.registros,
        ftds: acc.ftds + s.ftds,
        qftds: acc.qftds + s.qftds,
      }),
      { registros: 0, ftds: 0, qftds: 0 }
    );

    // Build comparison: calculate commission using CPA difference
    const currentMonthCommissionCents = currentMonthSnapshots.reduce((acc, s) => {
      const snapshotUserCpaCents = cpaByCpnserId.get(s.userId) || 0;
      const cpaDifferenceCents = Math.max(0, userCpaCents - snapshotUserCpaCents);
      return acc + cpaDifferenceCents * s.qftds;
    }, 0);

    const prevMonthCommissionCents = prevMonthSnapshots.reduce((acc, s) => {
      const snapshotUserCpaCents = cpaByCpnserId.get(s.userId) || 0;
      const cpaDifferenceCents = Math.max(0, userCpaCents - snapshotUserCpaCents);
      return acc + cpaDifferenceCents * s.qftds;
    }, 0);

    // Calculate total commission from current period using CPA difference formula
    const totalCommissionCents = currentSnapshots.reduce((acc, s) => {
      const snapshotUserCpaCents = cpaByCpnserId.get(s.userId) || 0;
      const cpaDifferenceCents = Math.max(0, userCpaCents - snapshotUserCpaCents);
      return acc + cpaDifferenceCents * s.qftds;
    }, 0);

    return NextResponse.json({
      timeline,
      funnel,
      commission: totalCommissionCents / 100,
      comparison: {
        current: currentMonthCommissionCents / 100,
        previous: prevMonthCommissionCents / 100,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar dados dos gráficos" },
      { status: 500 }
    );
  }
}
