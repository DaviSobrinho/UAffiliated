import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("[DEBUG-STATUS] Iniciando verificação completa...");

    // Count everything
    const userCount = await prisma.user.count();
    const houseCount = await prisma.house.count();
    const uhdCount = await prisma.userHouseData.count();
    const snapshotCount = await prisma.dailySnapshot.count();

    console.log(`[DEBUG-STATUS] Users: ${userCount}, Houses: ${houseCount}, UHD: ${uhdCount}, Snapshots: ${snapshotCount}`);

    // Get sample data
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      take: 5,
    });

    const houses = await prisma.house.findMany({
      select: { id: true, name: true },
      take: 5,
    });

    const uhdSample = await prisma.userHouseData.findMany({
      select: { userId: true, houseId: true, cpa: true, registros: true, ftds: true, qftds: true },
      take: 5,
    });

    const snapshotSample = await prisma.dailySnapshot.findMany({
      select: { userId: true, houseId: true, date: true, registros: true, ftds: true, qftds: true },
      take: 5,
      orderBy: { date: "desc" },
    });

    // Check admin
    const admin = await prisma.user.findFirst({
      where: { email: "admin@example.com" },
      select: { id: true, name: true },
    });

    let adminStatus = "❌ NÃO ENCONTRADO";
    let adminData = null;

    if (admin) {
      adminStatus = "✅ ENCONTRADO";
      const adminUhd = await prisma.userHouseData.findMany({
        where: { userId: admin.id },
        select: { houseId: true, cpa: true },
      });

      const adminSnapshots = await prisma.dailySnapshot.count({
        where: { userId: admin.id },
      });

      adminData = {
        name: admin.name,
        userHouseDataCount: adminUhd.length,
        snapshotCount: adminSnapshots,
        houses: adminUhd,
      };
    }

    const result = {
      timestamp: new Date().toISOString(),
      counts: {
        users: userCount,
        houses: houseCount,
        userHouseData: uhdCount,
        snapshots: snapshotCount,
      },
      status: {
        dataComplete:
          userCount > 0 &&
          houseCount > 0 &&
          uhdCount > 0 &&
          snapshotCount > 0,
        readyForDashboard: userCount > 0 && uhdCount > 0 && snapshotCount > 0,
      },
      admin: {
        status: adminStatus,
        data: adminData,
      },
      samples: {
        users: users.slice(0, 3),
        houses: houses.slice(0, 3),
        userHouseData: uhdSample.slice(0, 3),
        snapshots: snapshotSample.slice(0, 3),
      },
    };

    console.log("[DEBUG-STATUS] ✅ Relatório gerado com sucesso");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[DEBUG-STATUS] ❌ Erro:", error);
    return NextResponse.json(
      {
        error: "Erro ao verificar banco",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
