import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { resolveHouseId } from "@/lib/house-utils";
import { getUserLevel } from "@/lib/affiliate-utils";

// Get only direct children with data
async function getDirectChildrenWithData(
  userId: string,
  houseId: string
): Promise<any[]> {
  const children = await prisma.user.findMany({
    where: { affiliateParentId: userId },
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
  });

  const result = [];
  for (const child of children) {
    const level = await getUserLevel(child.id);
    const childrenCount = await prisma.user.count({
      where: { affiliateParentId: child.id },
    });
    result.push({ ...child, level, hasChildren: childrenCount > 0 });
  }

  return result;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR");
}

function formatCPA(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
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
    const houseNameOrId = searchParams.get("houseId");

    if (!houseNameOrId) {
      return NextResponse.json(
        { error: "houseId é obrigatório" },
        { status: 400 }
      );
    }

    const houseId = await resolveHouseId(houseNameOrId);
    if (!houseId) {
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
    }

    // Fetch only direct children with their levels
    const directChildren = await getDirectChildrenWithData(decoded.id, houseId);

    const affiliates = directChildren
      .map((child) => {
        const houseData = child.userHouseData[0];
        const cpaBigDecimal = houseData ? Number(houseData.cpa) : 0;
        const commission = houseData ? cpaBigDecimal * houseData.qftds : 0;

        return {
          id: child.id,
          name: child.name,
          email: child.email,
          level: child.level,
          commission: formatCPA(commission),
          linkedDate: formatDate(child.createdAt),
          cpa: houseData ? cpaBigDecimal : null,
          cpaEditedOnce: houseData ? houseData.cpaEditedOnce : false,
          hasChildren: child.hasChildren,
        };
      })
      .sort((a, b) => new Date(b.linkedDate).getTime() - new Date(a.linkedDate).getTime());

    return NextResponse.json({ affiliates });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar equipe" },
      { status: 500 }
    );
  }
}
