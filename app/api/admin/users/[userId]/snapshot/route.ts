import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

async function isAdmin(token: string): Promise<boolean> {
  const decoded = verifyToken(token);
  return decoded?.role === "ADMIN";
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const token = request.cookies.get("auth")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!(await isAdmin(token))) {
      return NextResponse.json({ error: "Apenas admin pode realizar esta ação" }, { status: 403 });
    }

    const { userId } = params;
    const { houseId, date, registros, ftds, qftds } = await request.json();

    if (!houseId || !date) {
      return NextResponse.json({ error: "houseId e date são obrigatórios" }, { status: 400 });
    }

    // Fetch user's house data to get CPA
    const userHouseData = await prisma.userHouseData.findUnique({
      where: {
        userId_houseId: {
          userId,
          houseId,
        },
      },
    });

    if (!userHouseData) {
      return NextResponse.json({ error: "Dados de casa não encontrados para este usuário" }, { status: 404 });
    }

    // Parse date and calculate revenue
    const snapshotDate = new Date(date);
    snapshotDate.setHours(0, 0, 0, 0);

    const finalQftds = qftds !== undefined ? qftds : 0;
    const revenue = Number(userHouseData.cpa) * finalQftds;

    // Upsert DailySnapshot
    const snapshot = await prisma.dailySnapshot.upsert({
      where: {
        userId_houseId_date: {
          userId,
          houseId,
          date: snapshotDate,
        },
      },
      create: {
        userId,
        houseId,
        date: snapshotDate,
        registros: registros || 0,
        ftds: ftds || 0,
        qftds: finalQftds,
        revenue: revenue.toString(),
      },
      update: {
        registros: registros || 0,
        ftds: ftds || 0,
        qftds: finalQftds,
        revenue: revenue.toString(),
      },
    });

    return NextResponse.json({ snapshot }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao salvar snapshot" }, { status: 500 });
  }
}
