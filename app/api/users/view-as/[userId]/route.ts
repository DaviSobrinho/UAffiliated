import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

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

// BFS to collect all direct children IDs
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
    const houseId = searchParams.get("houseId");

    if (!houseId) {
      return NextResponse.json({ error: "houseId é obrigatório" }, { status: 400 });
    }

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

    // Calculate meuRev (own revenue) using integer arithmetic (cents)
    const meuRevCents = houseData ? Math.round(Number(houseData.cpa) * 100) * houseData.qftds : 0;
    const meuRev = meuRevCents / 100;

    // Get direct children and calculate comissaoEquipe (difference in CPA)
    const directChildrenIds = await getDirectChildren(userId);

    let comissaoEquipe = 0;
    if (directChildrenIds.length > 0) {
      const childrenHouseData = await prisma.userHouseData.findMany({
        where: {
          userId: { in: directChildrenIds },
          houseId,
        },
      });

      const comissaoEquipeCents = childrenHouseData.reduce((sum, data) => {
        const userCpaCents = houseData ? Math.round(Number(houseData.cpa) * 100) : 0;
        const childCpaCents = Math.round(Number(data.cpa) * 100);
        const cpaDifferenceCents = Math.max(0, userCpaCents - childCpaCents);
        return sum + cpaDifferenceCents * data.qftds;
      }, 0);
      comissaoEquipe = comissaoEquipeCents / 100;
    }

    const totalProprio = meuRev + comissaoEquipe;

    return NextResponse.json({
      user,
      houseData,
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
