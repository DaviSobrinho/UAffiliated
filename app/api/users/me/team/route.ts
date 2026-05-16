import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { resolveHouseId } from "@/lib/house-utils";
import { getUserLevel, getAllDescendants } from "@/lib/affiliate-utils";
import { Decimal } from "@prisma/client/runtime/library";

interface AffiliateRaw {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  level: number;
  hasChildren: boolean;
  userHouseData: Array<{ cpa: Decimal; qftds: number; cpaEditedOnce: boolean }>;
}

// Get all descendants (any level) with data
async function getAllDescendantsWithData(
  userId: string,
  houseId: string
): Promise<AffiliateRaw[]> {
  // Get all descendant IDs using the optimized function
  const descendantIds = await getAllDescendants(userId);

  // Fetch all descendants with their data
  const descendants = await prisma.user.findMany({
    where: { id: { in: descendantIds } },
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
  for (const descendant of descendants) {
    const level = await getUserLevel(descendant.id);
    const childrenCount = await prisma.user.count({
      where: { affiliateParentId: descendant.id },
    });
    result.push({ ...descendant, level, hasChildren: childrenCount > 0 });
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

    // Fetch all descendants (any level) with their levels
    const allDescendants = await getAllDescendantsWithData(decoded.id, houseId);

    const affiliates = allDescendants
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
