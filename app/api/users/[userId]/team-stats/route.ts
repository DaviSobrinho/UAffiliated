import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

const TIMEFRAME_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
};

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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
    const timeframe = searchParams.get("timeframe") || "30d";

    // Permission check
    const isAdmin = decoded.role === "ADMIN";
    if (!isAdmin) {
      const isDescendant = await isDescendantOf(decoded.id, userId);
      if (!isDescendant) {
        return NextResponse.json(
          { error: "Você não tem acesso a este usuário" },
          { status: 403 }
        );
      }
    }

    const days = TIMEFRAME_DAYS[timeframe] ?? 30;

    // Get all descendants (including the user itself)
    const descendants = await getAllDescendants(userId);
    const allUserIds = [userId, ...descendants];

    // Calculate date boundaries
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - days);

    // Helper to convert Date to ISO string for @db.Date comparison
    const dateToString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return new Date(`${year}-${month}-${day}T00:00:00Z`);
    };

    // Get snapshots for the period
    const snapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: { in: allUserIds },
        houseId,
        date: { gte: dateToString(periodStart) },
      },
    });

    // Get CPA for all users
    const userHouseDataList = await prisma.userHouseData.findMany({
      where: {
        userId: { in: allUserIds },
        houseId,
      },
    });

    const cpaByUserId = new Map(
      userHouseDataList.map((data) => [
        data.userId,
        Math.round(Number(data.cpa) * 100),
      ])
    );

    // Calculate team stats
    let totalRegistros = 0;
    let totalFtds = 0;
    let totalQftds = 0;
    let totalCommissionCents = 0;

    for (const snapshot of snapshots) {
      totalRegistros += snapshot.registros;
      totalFtds += snapshot.ftds;
      totalQftds += snapshot.qftds;

      // Commission = CPA × QFTDS for each user
      const userCpaCents = cpaByUserId.get(snapshot.userId) || 0;
      totalCommissionCents += userCpaCents * snapshot.qftds;
    }

    return NextResponse.json({
      registros: totalRegistros,
      ftds: totalFtds,
      qftds: totalQftds,
      commission: totalCommissionCents / 100,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar stats da equipe" },
      { status: 500 }
    );
  }
}
