import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { resolveHouseId } from "@/lib/house-utils";

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

// BFS to collect all descendant IDs (entire tree)
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
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
    const houseNameOrId = searchParams.get("houseId");
    const timeframe = searchParams.get("timeframe") || "30d";

    if (!houseNameOrId) {
      return NextResponse.json({ error: "houseId é obrigatório" }, { status: 400 });
    }

    const houseId = await resolveHouseId(houseNameOrId);
    if (!houseId) {
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
    }

    const TIMEFRAME_DAYS: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "3m": 90,
      "6m": 180,
      "1y": 365,
    };
    const days = TIMEFRAME_DAYS[timeframe] ?? 30;

    // Permission check
    const isAdmin = decoded.role === "ADMIN";
    if (!isAdmin) {
      const isDescendant = await isDescendantOf(decoded.id, userId);
      if (!isDescendant) {
        return NextResponse.json({ error: "Você não tem acesso a este usuário" }, { status: 403 });
      }
    }

    // Fetch user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Fetch house data
    const houseData = await prisma.userHouseData.findUnique({
      where: {
        userId_houseId: {
          userId,
          houseId,
        },
      },
    });

    // Helper to convert Date to DateTime for @db.Date comparison
    const dateToString = (d: Date): Date => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return new Date(`${year}-${month}-${day}T00:00:00Z`);
    };

    // Calculate date boundaries for the selected timeframe
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - days);

    // Calculate meuRev (own revenue) for the selected timeframe using snapshots
    const userSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId,
        houseId,
        date: { gte: dateToString(periodStart) },
      },
    });

    // Calculate period stats
    const periodRegistros = userSnapshots.reduce((sum, s) => sum + s.registros, 0);
    const periodFtds = userSnapshots.reduce((sum, s) => sum + s.ftds, 0);
    const periodQftds = userSnapshots.reduce((sum, s) => sum + s.qftds, 0);

    const meuRevCents = userSnapshots.reduce((sum, snapshot) => {
      const cpaCents = houseData ? Math.round(Number(houseData.cpa) * 100) : 0;
      return sum + cpaCents * snapshot.qftds;
    }, 0);
    const meuRev = meuRevCents / 100;

    // Get DIRECT CHILDREN only
    const directChildrenIds = await getDirectChildren(userId);

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

          // Calculate commission: (Viewed User CPA - Child CPA) × Total QFTDS of subtree
          const userCpaCents = houseData ? Math.round(Number(houseData.cpa) * 100) : 0;
          const childCpaCents = Math.round(Number(childHouseData.cpa) * 100);
          const cpaDifferenceCents = Math.max(0, userCpaCents - childCpaCents);

          return cpaDifferenceCents * subtreeQftds;
        })
      );

      comissaoEquipe = (comissaoEquipeCents.reduce((a, b) => a + b, 0)) / 100;
    }

    const totalProprio = meuRev + comissaoEquipe;

    // Get team stats (all descendants)
    const allDescendants = await getAllDescendants(viewedUserId);
    const teamSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: { in: allDescendants },
        houseId,
        date: { gte: periodStart },
      },
    });

    const teamRegistros = teamSnapshots.reduce((sum, s) => sum + s.registros, 0);
    const teamFtds = teamSnapshots.reduce((sum, s) => sum + s.ftds, 0);
    const teamQftds = teamSnapshots.reduce((sum, s) => sum + s.qftds, 0);

    return NextResponse.json({
      user,
      houseData,
      periodStats: {
        registros: periodRegistros,
        ftds: periodFtds,
        qftds: periodQftds,
      },
      teamStats: {
        registros: teamRegistros,
        ftds: teamFtds,
        qftds: teamQftds,
      },
      performance: {
        meuRev,
        totalProprio,
        comissaoEquipe,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar dados do usuário" }, { status: 500 });
  }
}
