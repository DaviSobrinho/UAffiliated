const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testEndpoint() {
  // Find A1
  const a1 = await prisma.user.findFirst({
    where: { name: { contains: "a1", mode: "insensitive" } }
  });

  console.log("=== SIMULATING DASHBOARD ENDPOINT ===\n");
  console.log("User:", a1.name);
  console.log("Timeframe: 30d\n");

  // Simulate endpoint logic
  const houseId = "betano";
  const timeframe = "30d";
  const TIMEFRAME_DAYS = { "7d": 7, "30d": 30, "3m": 90, "6m": 180, "1y": 365 };
  const days = TIMEFRAME_DAYS[timeframe] ?? 30;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const periodStart = new Date(now);
  periodStart.setDate(now.getDate() - days);

  console.log(`Date range: ${periodStart.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}\n`);

  // Helper
  const dateToString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return new Date(`${year}-${month}-${day}T00:00:00Z`);
  };

  // Query same as endpoint
  const userSnapshots = await prisma.dailySnapshot.findMany({
    where: {
      userId: a1.id,
      houseId,
      date: { gte: dateToString(periodStart) }
    }
  });

  console.log(`Snapshots retrieved: ${userSnapshots.length}\n`);

  // Calculate as endpoint does
  const periodRegistros = userSnapshots.reduce((sum, s) => sum + s.registros, 0);
  const periodFtds = userSnapshots.reduce((sum, s) => sum + s.ftds, 0);
  const periodQftds = userSnapshots.reduce((sum, s) => sum + s.qftds, 0);

  console.log("Period Stats (as endpoint returns):");
  console.log(`  registros: ${periodRegistros}`);
  console.log(`  ftds: ${periodFtds}`);
  console.log(`  qftds: ${periodQftds}`);

  // Get house data
  const houseData = await prisma.userHouseData.findUnique({
    where: {
      userId_houseId: { userId: a1.id, houseId }
    }
  });

  const userCpaCents = Math.round(Number(houseData.cpa) * 100);
  const meuRevCents = userSnapshots.reduce(
    (sum, s) => sum + userCpaCents * s.qftds,
    0
  );
  const meuRev = meuRevCents / 100;

  console.log(`\nA1 CPA: ${houseData.cpa}`);
  console.log(`A1 meuRev (CPA × QFTDS): ${houseData.cpa} × ${periodQftds} = ${meuRev}`);

  // Direct children
  const directChildren = await prisma.user.findMany({
    where: { affiliateParentId: a1.id },
    select: { id: true, name: true }
  });

  console.log(`\nDirect children: ${directChildren.length}`);

  let comissaoEquipeCents = 0;

  async function getAllDescendants(userId) {
    const descendants = [];
    const visited = new Set();
    const queue = [userId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const children = await prisma.user.findMany({
        where: { affiliateParentId: currentId },
        select: { id: true }
      });

      for (const child of children) {
        descendants.push(child.id);
        queue.push(child.id);
      }
    }

    return descendants;
  }

  for (const child of directChildren) {
    const childHouseData = await prisma.userHouseData.findUnique({
      where: { userId_houseId: { userId: child.id, houseId } }
    });

    // GET ENTIRE SUBTREE, NOT JUST THE DIRECT CHILD
    const childDescendants = await getAllDescendants(child.id);
    const allInSubtree = [child.id, ...childDescendants];

    const childSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: { in: allInSubtree },
        houseId,
        date: { gte: dateToString(periodStart) }
      }
    });

    const childQftds = childSnapshots.reduce((sum, s) => sum + s.qftds, 0);
    const cpaDiff = Number(houseData.cpa) - Number(childHouseData.cpa);
    const commission = cpaDiff * childQftds;

    console.log(`  ${child.name}: subtree size=${allInSubtree.length}, CPA ${childHouseData.cpa}, QFTDS ${childQftds}, commission ${cpaDiff} × ${childQftds} = ${commission}`);

    comissaoEquipeCents += cpaDiff * 100 * childQftds;
  }

  const comissaoEquipe = comissaoEquipeCents / 100;
  const totalProprio = meuRev + comissaoEquipe;

  console.log(`\ncomissaoEquipe: ${comissaoEquipe}`);
  console.log(`totalProprio (meuRev + comissaoEquipe): ${meuRev} + ${comissaoEquipe} = ${totalProprio}`);

  await prisma.$disconnect();
}

testEndpoint();
