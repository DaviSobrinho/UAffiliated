import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR");
}

function formatCPA(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ affiliateId: string }> }
) {
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

    const { affiliateId } = await params;

    // Verify that the caller is the parent of the node, or the node itself
    if (affiliateId !== decoded.id) {
      const isDescendant = await isDescendantOf(decoded.id, affiliateId);
      if (!isDescendant) {
        return NextResponse.json(
          { error: "Você não tem acesso a este nó" },
          { status: 403 }
        );
      }
    }

    // Fetch direct children of the node
    const user = await prisma.user.findUnique({
      where: { id: affiliateId },
      include: {
        affiliateChildren: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            userHouseData: {
              where: { houseId },
              select: {
                cpa: true,
                qftds: true,
                cpaEditedOnce: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const affiliates = user.affiliateChildren
      .map((child) => {
        const houseData = child.userHouseData[0];
        const commission = houseData
          ? Number(houseData.cpa) * houseData.qftds
          : 0;

        return {
          id: child.id,
          name: child.name,
          email: child.email,
          commission: formatCPA(commission),
          linkedDate: formatDate(child.createdAt),
          cpa: houseData ? Number(houseData.cpa) : null,
          cpaEditedOnce: houseData ? houseData.cpaEditedOnce : false,
        };
      })
      .sort((a, b) => new Date(b.linkedDate).getTime() - new Date(a.linkedDate).getTime());

    return NextResponse.json({ affiliates });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar filhos" },
      { status: 500 }
    );
  }
}
