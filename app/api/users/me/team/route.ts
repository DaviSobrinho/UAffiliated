import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

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
    const houseId = searchParams.get("houseId");

    if (!houseId) {
      return NextResponse.json(
        { error: "houseId é obrigatório" },
        { status: 400 }
      );
    }

    // Fetch direct children only
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
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

    const descendants = user.affiliateChildren;

    const affiliates = descendants
      .map((child) => {
        const houseData = child.userHouseData[0];
        const cpaBigDecimal = houseData ? Number(houseData.cpa) : 0;
        const commission = houseData ? cpaBigDecimal * houseData.qftds : 0;

        return {
          id: child.id,
          name: child.name,
          email: child.email,
          commission: formatCPA(commission),
          linkedDate: formatDate(child.createdAt),
          cpa: houseData ? cpaBigDecimal : null,
          cpaEditedOnce: houseData ? houseData.cpaEditedOnce : false,
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
