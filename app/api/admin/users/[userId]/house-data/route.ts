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
    console.log("[HOUSE-DATA-PUT] Iniciando...", { userId });

    const token = request.cookies.get("auth")?.value;

    if (!token) {
      console.log("[HOUSE-DATA-PUT] Sem token");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!isAdmin(token)) {
      console.log("[HOUSE-DATA-PUT] Não é admin");
      return NextResponse.json({ error: "Apenas admin pode realizar esta ação" }, { status: 403 });
    }

    const body = await request.json();
    console.log("[HOUSE-DATA-PUT] Body:", body);

    const { houseId: houseNameOrId, affiliateLink, balance } = body;
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    if (!houseNameOrId) {
      console.log("[HOUSE-DATA-PUT] Sem houseId");
      return NextResponse.json({ error: "houseId é obrigatório" }, { status: 400 });
    }

    const houseId = await resolveHouseId(houseNameOrId);
    console.log("[HOUSE-DATA-PUT] houseId resolvido:", { houseNameOrId, houseId });

    if (!houseId) {
      console.log("[HOUSE-DATA-PUT] Casa não encontrada");
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
    }

    // Check if link is unique or belongs to this user
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
        console.log("[HOUSE-DATA-PUT] Link já em uso");
        return NextResponse.json({ error: "Este link já está em uso por outro usuário" }, { status: 409 });
      }
    }

    console.log("[HOUSE-DATA-PUT] Atualizando UserHouseData...", { userId, houseId, affiliateLink, balance });

    // Se balance está sendo atualizado, registrar auditoria
    if (balance !== undefined) {
      const currentData = await prisma.userHouseData.findUnique({
        where: {
          userId_houseId: {
            userId,
            houseId,
          },
        },
      });

      if (currentData && currentData.balance !== balance) {
        const oldBalance = currentData.balance;
        const newBalance = balance;

        // Registrar auditoria
        await prisma.balanceAudit.create({
          data: {
            userHouseDataId: currentData.id,
            userId: decoded.id,
            userName: decoded.name || "Admin",
            oldBalance: oldBalance,
            newBalance: newBalance,
          },
        });

        console.log("[HOUSE-DATA-PUT] 📊 Auditoria criada:", { oldBalance, newBalance, adminId: decoded.id });
      }
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
        ...(balance !== undefined && { balance }),
      },
    });

    console.log("[HOUSE-DATA-PUT] ✅ Atualizado com sucesso");
    return NextResponse.json({ userHouseData }, { status: 200 });
  } catch (error) {
    console.error("[HOUSE-DATA-PUT] ❌ Erro:", error);
    return NextResponse.json({ error: "Erro ao atualizar dados da casa", details: String(error) }, { status: 500 });
  }
}
