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

    if (!houseId) {
      return NextResponse.json(
        { error: "houseId é obrigatório" },
        { status: 400 }
      );
    }

    // Get user's own house data
    const userHouseData = await prisma.userHouseData.findUnique({
      where: {
        userId_houseId: {
          userId: decoded.id,
          houseId,
        },
      },
    });

    // Calculate user's own revenue
    const meuRev = userHouseData
      ? Number(userHouseData.cpa) * userHouseData.qftds
      : 0;

    // Get all direct children (1st level)
    const directChildren = await prisma.user.findMany({
      where: { affiliateParentId: decoded.id },
      select: { id: true },
    });

    // BFS to get all descendants
    const allDescendants: string[] = [];
    const queue = [...directChildren.map((c) => c.id)];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      allDescendants.push(currentId);

      const children = await prisma.user.findMany({
        where: { affiliateParentId: currentId },
        select: { id: true },
      });
      queue.push(...children.map((c) => c.id));
    }

    // Get house data for all descendants
    const descendantHouseData = await prisma.userHouseData.findMany({
      where: {
        userId: { in: allDescendants },
        houseId,
      },
    });

    // Calculate team commission
    const comissaoEquipe = descendantHouseData.reduce((sum, data) => {
      return sum + Number(data.cpa) * data.qftds;
    }, 0);

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
