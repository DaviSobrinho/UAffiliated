import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { resolveHouseId } from "@/lib/house-utils";

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

async function getUserLevel(userId: string): Promise<number> {
  let level = 1;
  let currentId: string | null = userId;

  while (currentId) {
    const user = await prisma.user.findUnique({
      where: { id: currentId },
      select: { affiliateParentId: true },
    });

    if (!user || !user.affiliateParentId) break;

    currentId = user.affiliateParentId;
    level++;
  }

  return level;
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
    const houseNameOrId = searchParams.get("houseId");

    if (!houseNameOrId) {
      return NextResponse.json({ error: "houseId é obrigatório" }, { status: 400 });
    }

    const houseId = await resolveHouseId(houseNameOrId);
    if (!houseId) {
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
    }

    // Permission check
    const isAdmin = decoded.role === "ADMIN";
    if (!isAdmin) {
      const isDescendant = await isDescendantOf(decoded.id, userId);
      if (!isDescendant) {
        return NextResponse.json({ error: "Você não tem acesso a este usuário" }, { status: 403 });
      }
    }

    // Get direct children
    const directChildren = await prisma.user.findMany({
      where: { affiliateParentId: userId },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });

    // Get house data for direct children
    const childrenHouseData = await prisma.userHouseData.findMany({
      where: {
        userId: { in: directChildren.map((c) => c.id) },
        houseId,
      },
    });

    const houseDataMap = new Map(
      childrenHouseData.map((d) => [d.userId, d])
    );

    // Get levels for all children and build response
    const affiliates = await Promise.all(
      directChildren.map(async (child) => {
        const houseData = houseDataMap.get(child.id);
        const level = await getUserLevel(child.id);

        return {
          id: child.id,
          name: child.name,
          email: child.email,
          level,
          cpa: houseData ? Number(houseData.cpa) : 0,
          registros: houseData?.registros || 0,
          ftds: houseData?.ftds || 0,
          qftds: houseData?.qftds || 0,
        };
      })
    );

    return NextResponse.json({ affiliates });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar afiliados" }, { status: 500 });
  }
}
