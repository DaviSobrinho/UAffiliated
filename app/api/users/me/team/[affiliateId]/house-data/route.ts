import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(
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

    const { affiliateId } = await params;
    const { cpa, houseId, houseName } = await request.json();

    if (!cpa || !houseId || !houseName) {
      return NextResponse.json(
        { error: "CPA, houseId e houseName são obrigatórios" },
        { status: 400 }
      );
    }

    const cpaBigDecimal = parseFloat(cpa.toString());

    if (cpaBigDecimal < 5) {
      return NextResponse.json(
        { error: "CPA mínimo é R$ 5,00" },
        { status: 400 }
      );
    }

    // Verify that the child belongs to the parent (parentId = decoded.id)
    const child = await prisma.user.findUnique({
      where: { id: affiliateId },
      select: { affiliateParentId: true },
    });

    if (!child) {
      return NextResponse.json(
        { error: "Subafiliado não encontrado" },
        { status: 404 }
      );
    }

    if (child.affiliateParentId !== decoded.id) {
      return NextResponse.json(
        { error: "Você não é o indicador deste usuário" },
        { status: 403 }
      );
    }

    // Get parent's CPA for this house
    const parentHouseData = await prisma.userHouseData.findUnique({
      where: {
        userId_houseId: {
          userId: decoded.id,
          houseId,
        },
      },
      select: { cpa: true },
    });

    if (!parentHouseData) {
      return NextResponse.json(
        { error: "Você não tem CPA definido para esta casa" },
        { status: 400 }
      );
    }

    const parentCpa = Number(parentHouseData.cpa);

    if (cpaBigDecimal > parentCpa) {
      return NextResponse.json(
        { error: `CPA não pode exceder seu CPA de R$ ${parentCpa.toFixed(2).replace(".", ",")}` },
        { status: 400 }
      );
    }

    // Check if child already has CPA set for this house
    const childHouseData = await prisma.userHouseData.findUnique({
      where: {
        userId_houseId: {
          userId: affiliateId,
          houseId,
        },
      },
      select: { cpaEditedOnce: true },
    });

    if (childHouseData?.cpaEditedOnce) {
      return NextResponse.json(
        { error: "O CPA deste subafiliado já foi definido e não pode ser alterado" },
        { status: 409 }
      );
    }

    // Upsert child's house data with the new CPA
    await prisma.userHouseData.upsert({
      where: {
        userId_houseId: {
          userId: affiliateId,
          houseId,
        },
      },
      update: {
        cpa: cpaBigDecimal,
        cpaEditedOnce: true,
      },
      create: {
        userId: affiliateId,
        houseId,
        houseName,
        cpa: cpaBigDecimal,
        affiliateLink: `${houseId}/${affiliateId}`,
        cpaEditedOnce: true,
        registros: 0,
        ftds: 0,
        qftds: 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao definir CPA" },
      { status: 500 }
    );
  }
}
