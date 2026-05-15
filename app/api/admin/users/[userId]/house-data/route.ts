import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { resolveHouseId } from "@/lib/house-utils";

function isAdmin(token: string | undefined): boolean {
  const decoded = verifyToken(token);
  return decoded?.role === "ADMIN";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  try {
    const token = request.cookies.get("auth")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!isAdmin(token)) {
      return NextResponse.json({ error: "Apenas admin pode realizar esta ação" }, { status: 403 });
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

    const userHouseData = await prisma.userHouseData.findUnique({
      where: {
        userId_houseId: {
          userId,
          houseId,
        },
      },
    });

    if (!userHouseData) {
      return NextResponse.json({ error: "Dados de casa não encontrados" }, { status: 404 });
    }

    return NextResponse.json({ userHouseData }, { status: 200 });
  } catch (error) {
    console.error("[HOUSE-DATA] Erro:", error);
    return NextResponse.json({ error: "Erro ao buscar dados da casa" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  try {
    const token = request.cookies.get("auth")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!isAdmin(token)) {
      return NextResponse.json({ error: "Apenas admin pode realizar esta ação" }, { status: 403 });
    }

    const body = await request.json();
    const { houseId: houseNameOrId, affiliateLink, cpa, balance } = body;
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    if (!houseNameOrId) {
      return NextResponse.json({ error: "houseId é obrigatório" }, { status: 400 });
    }

    const houseId = await resolveHouseId(houseNameOrId);

    if (!houseId) {
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
    }

    if (affiliateLink) {
      const existingLink = await prisma.userHouseData.findFirst({
        where: {
          affiliateLink,
          OR: [
            { userId: { not: userId } },
            { houseId: { not: houseId } },
          ],
        },
      });

      if (existingLink) {
        return NextResponse.json({ error: "Este link já está em uso por outro usuário" }, { status: 409 });
      }
    }

    // Check if userHouseData exists, create if not
    let currentData = await prisma.userHouseData.findUnique({
      where: {
        userId_houseId: {
          userId,
          houseId,
        },
      },
    });

    if (!currentData) {
      // Create userHouseData if it doesn't exist
      currentData = await prisma.userHouseData.create({
        data: {
          userId,
          houseId,
          cpa: 0,
          affiliateLink: affiliateLink || `${houseId}/${userId}`,
          registros: 0,
          ftds: 0,
          qftds: 0,
          ...(balance !== undefined && { balance }),
        },
      });
    }

    if (balance !== undefined && currentData.balance !== balance) {
      const oldBalance = currentData.balance;
      const newBalance = balance;

      await prisma.balanceAudit.create({
        data: {
          userHouseDataId: currentData.id,
          userId: decoded.id,
          userName: decoded.name || "Admin",
          oldBalance: oldBalance,
          newBalance: newBalance,
        },
      });
    }

    const userHouseData = await prisma.userHouseData.update({
      where: {
        userId_houseId: {
          userId,
          houseId,
        },
      },
      data: {
        ...(affiliateLink !== undefined && { affiliateLink: affiliateLink || "" }),
        ...(cpa !== undefined && { cpa }),
        ...(balance !== undefined && { balance }),
      },
    });

    return NextResponse.json({ userHouseData }, { status: 200 });
  } catch (error) {
    console.error("[HOUSE-DATA-PUT] Erro:", error);
    return NextResponse.json({ error: "Erro ao atualizar dados da casa" }, { status: 500 });
  }
}
