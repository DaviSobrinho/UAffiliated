import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

async function isAdmin(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  const decoded = verifyToken(token);
  if (!decoded) return false;

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  return user?.role === "ADMIN";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = request.cookies.get("auth")?.value;
    if (!(await isAdmin(token))) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const houseId = searchParams.get("houseId");
    const { userId } = await params;

    if (!houseId) {
      return NextResponse.json(
        { error: "Casa de aposta é obrigatória" },
        { status: 400 }
      );
    }

    const houseData = await prisma.userHouseData.findUnique({
      where: {
        userId_houseId: {
          userId,
          houseId,
        },
      },
    });

    return NextResponse.json({ houseData }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = request.cookies.get("auth")?.value;
    if (!(await isAdmin(token))) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { houseId, houseName, cpa, affiliateLink, registros, ftds, qftds } =
      await request.json();
    const { userId } = await params;

    if (!houseId || !houseName || cpa === undefined || !affiliateLink) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    if (cpa < 5) {
      return NextResponse.json(
        { error: "CPA deve ser de no mínimo 5" },
        { status: 400 }
      );
    }

    const houseData = await prisma.userHouseData.create({
      data: {
        userId,
        houseId,
        houseName,
        cpa: parseFloat(cpa.toString()),
        affiliateLink,
        registros: registros || 0,
        ftds: ftds || 0,
        qftds: qftds || 0,
      },
    });

    return NextResponse.json({ houseData }, { status: 201 });
  } catch (error: any) {
    console.error(error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Dados já existem para este usuário e casa" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = request.cookies.get("auth")?.value;
    if (!(await isAdmin(token))) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { houseId, houseName, cpa, affiliateLink, registros, ftds, qftds } =
      await request.json();
    const { userId } = await params;

    if (!houseId) {
      return NextResponse.json(
        { error: "Casa de aposta é obrigatória" },
        { status: 400 }
      );
    }

    if (cpa !== undefined && cpa < 5) {
      return NextResponse.json(
        { error: "CPA deve ser de no mínimo 5" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (houseName) updateData.houseName = houseName;
    if (cpa !== undefined) updateData.cpa = parseFloat(cpa.toString());
    if (affiliateLink) updateData.affiliateLink = affiliateLink;
    if (registros !== undefined) updateData.registros = registros;
    if (ftds !== undefined) updateData.ftds = ftds;
    if (qftds !== undefined) updateData.qftds = qftds;

    const houseData = await prisma.userHouseData.update({
      where: {
        userId_houseId: {
          userId,
          houseId,
        },
      },
      data: updateData,
    });

    return NextResponse.json({ houseData }, { status: 200 });
  } catch (error: any) {
    console.error(error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Dados não encontrados" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
