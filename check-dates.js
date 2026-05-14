const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const recent = await prisma.dailySnapshot.findMany({
    where: { houseId: "betano", date: { gte: new Date("2026-05-04") } },
    orderBy: { date: "desc" }
  });

  console.log("Snapshots from 2026-05-04 onwards:", recent.length);
  for (const s of recent) {
    const u = await prisma.user.findUnique({
      where: { id: s.userId },
      select: { name: true }
    });
    console.log(`  ${s.date.toISOString().split('T')[0]}: ${u?.name}: ${s.qftds} QFTDS`);
  }

  await prisma.$disconnect();
}

check();
