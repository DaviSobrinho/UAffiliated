import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { resolveHouseId } from "@/lib/house-utils";
import { getAllDescendants } from "@/lib/affiliate-utils";

const TIMEFRAME_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
};

async function getDirectChildren(userId: string): Promise<string[]> {
  const children = await prisma.user.findMany({
    where: { affiliateParentId: userId },
    select: { id: true },
  });
  return children.map((c) => c.id);
}

function dateToString(d: Date): Date {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return new Date(`${year}-${month}-${day}T00:00:00Z`);
}

export async function GET(request: NextRequest) {
  try {
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
      console.log(`[DASHBOARD] ❌ Casa não encontrada: ${houseNameOrId}`);
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
    }

    console.log(`[DASHBOARD] Usuário: ${decoded.id}, Casa: ${houseId}, Timeframe: ${timeframe}`);

    const days = TIMEFRAME_DAYS[timeframe] ?? 30;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      console.log(`[DASHBOARD] ❌ Usuário não encontrado: ${decoded.id}`);
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    console.log(`[DASHBOARD] ✓ Usuário encontrado: ${user.name}`);

    // Get house data (or create defaults if not found)
    let houseData = await prisma.userHouseData.findUnique({
      where: { userId_houseId: { userId: decoded.id, houseId } },
    });

    if (!houseData) {
      console.log(
        `[DASHBOARD] ℹ️ userHouseData não encontrado, usando defaults para userId=${decoded.id}, houseId=${houseId}`
      );

      // Return default values when userHouseData doesn't exist
      houseData = {
        id: `default-${decoded.id}-${houseId}`,
        userId: decoded.id,
        houseId,
        cpa: new Decimal(0),
        affiliateLink: `${houseId.toLowerCase()}/${decoded.id}`,
        registros: 0,
        ftds: 0,
        qftds: 0,
        balance: new Decimal(0),
        cpaEditedOnce: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      console.log(`[DASHBOARD] ✓ Dados da casa encontrados, CPA: ${houseData.cpa}`);
    }

    // Get period snapshots
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - days);

    const userSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: decoded.id,
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
    const directChildrenIds = await getDirectChildren(decoded.id);
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
    const allDescendants = await getAllDescendants(decoded.id);
    console.log(`[DASHBOARD] 👥 Descendentes encontrados: ${allDescendants.length}`);

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

    console.log(`[DASHBOARD] 📈 Stats: Próprio=${periodRegistros}/${periodFtds}/${periodQftds}, Equipe=${teamRegistros}/${teamFtds}/${teamQftds}`);
    console.log(`[DASHBOARD] 💰 Performance: MeuRev=${meuRev}, Comissão=${comissaoEquipe}, Total=${totalProprio}`);

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
