import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  // Get Second User ID
  const secondUser = await prisma.user.findUnique({
    where: { email: "user2@example.com" },
  });

  if (!secondUser) {
    console.log("Second User not found");
    await prisma.$disconnect();
    return;
  }

  // Get Second Sub User ID
  const secondSubUser = await prisma.user.findUnique({
    where: { email: "subuser2@example.com" },
  });

  // Get snapshots for last 7 days
  const snapshots = await prisma.dailySnapshot.findMany({
    where: {
      houseId: "betano",
      userId: { in: [secondUser.id, secondSubUser?.id].filter(Boolean) as string[] },
      date: { gte: sevenDaysAgo },
    },
    include: { user: { select: { name: true } } },
    orderBy: [{ userId: "asc" }, { date: "desc" }],
  });

  console.log("\n=== ÚLTIMOS 7 DIAS - BETANO ===\n");

  let secondUserTotal = { qftds: 0 };
  let secondSubUserTotal = { qftds: 0 };

  for (const snap of snapshots) {
    console.log(`${snap.user.name} - ${snap.date.toISOString().split('T')[0]} - QFTDS: ${snap.qftds}`);

    if (snap.userId === secondUser.id) {
      secondUserTotal.qftds += snap.qftds;
    } else if (snap.userId === secondSubUser?.id) {
      secondSubUserTotal.qftds += snap.qftds;
    }
  }

  console.log("\n=== TOTAIS (7 DIAS) ===");
  console.log(`Second User: ${secondUserTotal.qftds} QFTDS`);
  console.log(`Second Sub User: ${secondSubUserTotal.qftds} QFTDS`);
  console.log(`Total: ${secondUserTotal.qftds + secondSubUserTotal.qftds} QFTDS`);

  console.log("\n=== COMISSÃO ESPERADA ===");
  const adminCpa = 200;
  const secondUserCpa = 150;
  const secondSubUserCpa = 80;

  const commission =
    (adminCpa - secondUserCpa) * secondUserTotal.qftds +
    (adminCpa - secondSubUserCpa) * secondSubUserTotal.qftds;

  console.log(`(200 - 150) × ${secondUserTotal.qftds} + (200 - 80) × ${secondSubUserTotal.qftds}`);
  console.log(`= 50 × ${secondUserTotal.qftds} + 120 × ${secondSubUserTotal.qftds}`);
  console.log(`= ${50 * secondUserTotal.qftds} + ${120 * secondSubUserTotal.qftds}`);
  console.log(`= R$ ${commission.toFixed(2)}`);

  await prisma.$disconnect();
}

main().catch(console.error);
