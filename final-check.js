const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function finalCheck() {
  const allDates = await prisma.dailySnapshot.findMany({
    where: { houseId: "betano" },
    select: { date: true },
    distinct: ["date"],
    orderBy: { date: "asc" }
  });

  const dates = allDates.map(d => d.date.toISOString().split('T')[0]);
  console.log(`Snapshots exist for: ${dates[0]} to ${dates[dates.length - 1]} (${dates.length} days)`);
  console.log(`Last date: ${dates[dates.length - 1]}`);
  console.log(`Today is: 2026-05-14`);
  console.log(`Missing days: ${new Date("2026-05-14") - new Date(dates[dates.length - 1])} ms = ${(new Date("2026-05-14") - new Date(dates[dates.length - 1])) / (24 * 3600 * 1000)} days`);

  await prisma.$disconnect();
}

finalCheck();
