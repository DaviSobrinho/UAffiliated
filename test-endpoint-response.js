const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testEndpointResponse() {
  // Find A1 ID
  const a1 = await prisma.user.findFirst({
    where: { name: { contains: "a1", mode: "insensitive" } }
  });

  console.log("Simulating: GET /api/users/a1-id/dashboard?houseId=betano&timeframe=30d\n");

  const houseId = "betano";
  const timeframe = "30d";
  const userId = a1.id;
  const TIMEFRAME_DAYS = { "7d": 7, "30d": 30, "3m": 90, "6m": 180, "1y": 365 };
  const days = TIMEFRAME_DAYS[timeframe] ?? 30;

  const dateToString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return new Date(`${year}-${month}-${day}T00:00:00Z`);
  };

  // This is what endpoint does
  const now = new Date();
  console.log("Current Date (new Date()):", now.toISOString());

  now.setHours(0, 0, 0, 0);
  console.log("After setHours(0,0,0,0):", now.toISOString());

  const periodStart = new Date(now);
  periodStart.setDate(now.getDate() - days);
  console.log(`Period start (${days} days ago):`, periodStart.toISOString());

  const dateStringResult = dateToString(periodStart);
  console.log("dateToString(periodStart):", dateStringResult.toISOString());

  // Query
  const userSnapshots = await prisma.dailySnapshot.findMany({
    where: {
      userId,
      houseId,
      date: { gte: dateStringResult }
    }
  });

  console.log(`\nSnapshots found: ${userSnapshots.length}`);

  const periodQftds = userSnapshots.reduce((sum, s) => sum + s.qftds, 0);
  const periodFtds = userSnapshots.reduce((sum, s) => sum + s.ftds, 0);
  const periodRegistros = userSnapshots.reduce((sum, s) => sum + s.registros, 0);

  console.log(`Total QFTDS: ${periodQftds}`);
  console.log(`Total FTDs: ${periodFtds}`);
  console.log(`Total Registros: ${periodRegistros}`);

  const houseData = await prisma.userHouseData.findUnique({
    where: { userId_houseId: { userId, houseId } }
  });

  console.log(`\nEndpoint would return:`);
  console.log(`  periodStats.qftds: ${periodQftds}`);
  console.log(`  periodStats.ftds: ${periodFtds}`);
  console.log(`  periodStats.registros: ${periodRegistros}`);

  await prisma.$disconnect();
}

testEndpointResponse();
