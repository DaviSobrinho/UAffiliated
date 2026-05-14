const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testCalculation() {
  try {
    // Find A1
    const a1 = await prisma.user.findFirst({
      where: { name: { contains: "a1", mode: "insensitive" } }
    });

    console.log("User: A1\n");

    // Get snapshots for last 30 days
    const now = new Date("2026-05-14");
    now.setHours(0, 0, 0, 0);
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - 30);

    const dateToString = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return new Date(`${year}-${month}-${day}T00:00:00Z`);
    };

    const a1Snaps = await prisma.dailySnapshot.findMany({
      where: {
        userId: a1.id,
        houseId: "betano",
        date: { gte: dateToString(periodStart) }
      }
    });

    const a1QFTDS = a1Snaps.reduce((sum, s) => sum + s.qftds, 0);
    console.log(`A1 own QFTDS: ${a1QFTDS}`);

    // Get direct child
    const child = await prisma.user.findFirst({
      where: { affiliateParentId: a1.id }
    });

    console.log(`Direct child: ${child.name}`);

    // Get child's snapshots
    const childSnaps = await prisma.dailySnapshot.findMany({
      where: {
        userId: child.id,
        houseId: "betano",
        date: { gte: dateToString(periodStart) }
      }
    });

    const childQFTDS = childSnaps.reduce((sum, s) => sum + s.qftds, 0);
    console.log(`Child QFTDS: ${childQFTDS}`);

    // Get grandchild
    const grandchild = await prisma.user.findFirst({
      where: { affiliateParentId: child.id }
    });

    const gcSnaps = await prisma.dailySnapshot.findMany({
      where: {
        userId: grandchild.id,
        houseId: "betano",
        date: { gte: dateToString(periodStart) }
      }
    });

    const gcQFTDS = gcSnaps.reduce((sum, s) => sum + s.qftds, 0);
    console.log(`Grandchild QFTDS: ${gcQFTDS}`);

    const subtreeQFTDS = childQFTDS + gcQFTDS;
    console.log(`\nChild subtree total QFTDS: ${subtreeQFTDS}`);

    // CPAs
    const a1CPA = await prisma.userHouseData.findUnique({
      where: { userId_houseId: { userId: a1.id, houseId: "betano" } }
    });

    const childCPA = await prisma.userHouseData.findUnique({
      where: { userId_houseId: { userId: child.id, houseId: "betano" } }
    });

    console.log(`\nA1 CPA: ${a1CPA.cpa}`);
    console.log(`Child CPA: ${childCPA.cpa}`);

    const ownCommission = Number(a1CPA.cpa) * a1QFTDS;
    const childCommission = (Number(a1CPA.cpa) - Number(childCPA.cpa)) * subtreeQFTDS;
    const total = ownCommission + childCommission;

    console.log(`\n=== CALCULATION ===`);
    console.log(`Own: ${a1CPA.cpa} × ${a1QFTDS} = ${ownCommission}`);
    console.log(`From child: (${a1CPA.cpa} - ${childCPA.cpa}) × ${subtreeQFTDS} = ${childCommission}`);
    console.log(`TOTAL: ${total}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testCalculation();
