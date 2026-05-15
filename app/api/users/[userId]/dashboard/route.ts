import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { resolveHouseId } from "@/lib/house-utils";

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

function dateToString(d: Date): Date {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return new Date(`${year}-${month}-${day}T00:00:00Z`);
}

async function getDirectChildren(userId: string): Promise<string[]> {
  const children = await prisma.user.findMany({
    where: { affiliateParentId: userId },
    select: { id: true },
  });
  return children.map((c) => c.id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const token = request.cookies.get("auth")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const houseNameOrId = searchParams.get("houseId") || "betano";
    const timeframe = searchParams.get("timeframe") || "30d";

    const houseId = await resolveHouseId(houseNameOrId);
    if (!houseId) {
      console.log(`[DASHBOARD-USER] ❌ Casa não encontrada: ${houseNameOrId}`);
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
    }

    console.log(`[DASHBOARD-USER] Requisição: userId=${userId}, houseId=${houseId}`);

    // Permission check
    const isAdmin = decoded.role === "ADMIN";
    if (!isAdmin) {
      const isDescendant = await isDescendantOf(decoded.id, userId);
      if (!isDescendant) {
        console.log(`[DASHBOARD-USER] ❌ Acesso negado`);
        return NextResponse.json(
          { error: "Sem acesso a este usuário" },
          { status: 403 }
        );
      }
    }

    const days = TIMEFRAME_DAYS[timeframe] ?? 30;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      console.log(`[DASHBOARD-USER] ❌ Usuário não encontrado`);
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    console.log(`[DASHBOARD-USER] ✓ Usuário: ${user.name}`);

    // Get house data
    const houseData = await prisma.userHouseData.findUnique({
      where: { userId_houseId: { userId, houseId } },
    });

    if (!houseData) {
      console.log(`[DASHBOARD-USER] ❌ userHouseData não encontrado para userId=${userId}, houseId=${houseId}`);

      // Debug: show what houses this user has
      const allUserHouses = await prisma.userHouseData.findMany({
        where: { userId },
      });
      console.log(`[DASHBOARD-USER] 📊 Casas disponíveis: ${allUserHouses.map(h => h.houseId).join(', ') || 'NENHUMA'}`);

      return NextResponse.json({ error: "Dados da casa não encontrados" }, { status: 404 });
    }

    console.log(`[DASHBOARD-USER] ✓ Dados encontrados, CPA=${houseData.cpa}`);

    // Get period snapshots
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - days);

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

    // Calculate meuRev (own revenue)
    const userCpaCents = Math.round(Number(houseData.cpa) * 100);
    const meuRevCents = userSnapshots.reduce(
      (sum, s) => sum + userCpaCents * s.qftds,
      0
    );
    const meuRev = meuRevCents / 100;

    // Calculate commission from direct children
    const directChildrenIds = await getDirectChildren(userId);
    let comissaoEquipeCents = 0;

    if (directChildrenIds.length > 0) {
      const childrenHouseData = await prisma.userHouseData.findMany({
        where: { userId: { in: directChildrenIds }, houseId },
      });

      const childrenComissions = await Promise.all(
        directChildrenIds.map(async (childId) => {
          const childHouseData = childrenHouseData.find((d) => d.userId === childId);
          if (!childHouseData) return 0;

          const childDescendants = await getAllDescendants(childId);
          const allInSubtree = [childId, ...childDescendants];

          const subtreeSnapshots = await prisma.dailySnapshot.findMany({
            where: {
              userId: { in: allInSubtree },
              houseId,
              date: { gte: dateToString(periodStart) },
            },
          });

          const subtreeQftds = subtreeSnapshots.reduce((sum, s) => sum + s.qftds, 0);
          const childCpaCents = Math.round(Number(childHouseData.cpa) * 100);
          const cpaDifferenceCents = Math.max(0, userCpaCents - childCpaCents);

          return cpaDifferenceCents * subtreeQftds;
        })
      );

      comissaoEquipeCents = childrenComissions.reduce((a, b) => a + b, 0);
    }

    const comissaoEquipe = comissaoEquipeCents / 100;
    const totalProprio = meuRev + comissaoEquipe;

    // Get team stats (all descendants)
    const allDescendants = await getAllDescendants(userId);
    const teamSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: { in: allDescendants },
        houseId,
        date: { gte: dateToString(periodStart) },
      },
    });

    const teamRegistros = teamSnapshots.reduce((sum, s) => sum + s.registros, 0);
    const teamFtds = teamSnapshots.reduce((sum, s) => sum + s.ftds, 0);
    const teamQftds = teamSnapshots.reduce((sum, s) => sum + s.qftds, 0);

    return NextResponse.json({
      user,
      houseData: {
        id: houseData.id,
        cpa: Number(houseData.cpa),
        affiliateLink: houseData.affiliateLink,
      },
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
        comissaoEquipe,
        totalProprio,
      },
    });
  } catch (error) {
    console.error("Dashboard endpoint error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    );
  }
}
