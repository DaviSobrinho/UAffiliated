const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkRecent() {
  try {
    console.log("Today:", new Date().toISOString().split('T')[0]);

    // Check most recent snapshots
    const recent = await prisma.dailySnapshot.findMany({
      where: { houseId: "betano" },
      orderBy: { date: "desc" },
      take: 30
    });

    console.log("\n=== Most Recent Snapshots ===");
    const userNames = new Map();

    for (const s of recent) {
      const user = await prisma.user.findUnique({
        where: { id: s.userId },
        select: { name: true }
      });
      console.log(`${s.date.toISOString().split('T')[0]} - ${user?.name || "Unknown"}: ${s.qftds} QFTDS`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkRecent();
