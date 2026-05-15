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

    if (!(await isAdmin(token))) {
      return NextResponse.json({ error: "Apenas admin pode realizar esta ação" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const houseNameOrId = searchParams.get("houseId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!houseNameOrId || !month || !year) {
      return NextResponse.json(
        { error: "houseId, month e year são obrigatórios" },
        { status: 400 }
      );
    }

    const houseId = await resolveHouseId(houseNameOrId);
    if (!houseId) {
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    // Get first and last day of month (in UTC date format)
    const firstDay = new Date(`${yearNum}-${String(monthNum).padStart(2, "0")}-01T00:00:00Z`);
    const lastDay = new Date(`${yearNum}-${String(monthNum).padStart(2, "0")}-${String(new Date(yearNum, monthNum, 0).getDate()).padStart(2, "0")}T23:59:59Z`);

    const snapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId,
        houseId,
        date: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ snapshots }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar snapshots" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  try {
    const token = request.cookies.get("auth")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!isAdmin(token)) {
      return NextResponse.json({ error: "Apenas admin pode realizar esta ação" }, { status: 403 });
    }

    const { houseId: houseNameOrId, date, registros, ftds, qftds } = await request.json();

    if (!houseNameOrId || !date) {
      return NextResponse.json({ error: "houseId e date são obrigatórios" }, { status: 400 });
    }

    const houseId = await resolveHouseId(houseNameOrId);
    if (!houseId) {
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
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

    // Parse date in UTC format to avoid timezone issues
    const snapshotDate = new Date(`${date}T00:00:00Z`);

    const finalQftds = qftds !== undefined ? qftds : 0;
    // Convert CPA to cents (integer), calculate, then convert back to decimal
    const cpaCents = Math.round(Number(userHouseData.cpa) * 100);
    const revenueCents = cpaCents * finalQftds;
    const revenue = revenueCents / 100;

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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  try {
    const token = request.cookies.get("auth")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!isAdmin(token)) {
      return NextResponse.json({ error: "Apenas admin pode realizar esta ação" }, { status: 403 });
    }

    const { houseId: houseNameOrId, date } = await request.json();

    if (!houseNameOrId || !date) {
      return NextResponse.json({ error: "houseId e date são obrigatórios" }, { status: 400 });
    }

    const houseId = await resolveHouseId(houseNameOrId);
    if (!houseId) {
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
    }

    const snapshotDate = new Date(`${date}T00:00:00Z`);

    await prisma.dailySnapshot.delete({
      where: {
        userId_houseId_date: {
          userId,
          houseId,
          date: snapshotDate,
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao remover snapshot" }, { status: 500 });
  }
}
