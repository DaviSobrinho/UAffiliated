import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
    });

    // For each user, check if they have userHouseData
    const userStatus = await Promise.all(
      users.map(async (user) => {
        const uhdCount = await prisma.userHouseData.count({
          where: { userId: user.id },
        });

        const snapshotCount = await prisma.dailySnapshot.count({
          where: { userId: user.id },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          userHouseDataCount: uhdCount,
          snapshotCount: snapshotCount,
          hasData: uhdCount > 0 && snapshotCount > 0,
        };
      })
    );

    const withData = userStatus.filter((u) => u.hasData).length;
    const withoutData = userStatus.filter((u) => !u.hasData).length;

    return NextResponse.json({
      summary: {
        totalUsers: users.length,
        usersWithData: withData,
        usersWithoutData: withoutData,
      },
      users: userStatus,
      action:
        withoutData > 0
          ? "Execute: npm run prisma:seed"
          : "All users have data!",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao verificar usuários",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
