const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkA1() {
  // Find A1
  const a1 = await prisma.user.findFirst({
    where: { name: { contains: "a1", mode: "insensitive" } }
  });

  console.log("User:", a1.name, `(${a1.id})\n`);

  // Get last 30 days starting from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  console.log(`Date range: ${thirtyDaysAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);

  // Get ALL snapshots in this range (unfiltered to see what's there)
  const allSnapshots = await prisma.dailySnapshot.findMany({
    where: {
      houseId: "betano",
      date: { gte: thirtyDaysAgo, lte: today }
    },
    orderBy: { date: "asc" }
  });

  console.log(`\nTotal snapshots in date range: ${allSnapshots.length}`);

  // Get A1's snapshots specifically
  const a1Snapshots = await prisma.dailySnapshot.findMany({
    where: {
      userId: a1.id,
      houseId: "betano",
      date: { gte: thirtyDaysAgo, lte: today }
    },
    orderBy: { date: "asc" }
  });

  console.log(`\nA1 snapshots count: ${a1Snapshots.length}`);

  let totalQftds = 0;
  let totalFtds = 0;

  console.log("\nA1 Snapshot breakdown:");
  a1Snapshots.forEach(s => {
    console.log(`  ${s.date.toISOString().split('T')[0]}: registros=${s.registros}, ftds=${s.ftds}, qftds=${s.qftds}`);
    totalQftds += s.qftds;
    totalFtds += s.ftds;
  });

  console.log(`\nA1 Totals:`);
  console.log(`  Total QFTDS: ${totalQftds}`);
  console.log(`  Total FTDs: ${totalFtds}`);

  await prisma.$disconnect();
}

checkA1();
