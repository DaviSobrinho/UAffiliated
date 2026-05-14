const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugCommissionDetailed() {
  try {
    // Find A1
    const a1 = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: "a1", mode: "insensitive" } },
          { email: { contains: "a1", mode: "insensitive" } }
        ]
      }
    });

    // Get last 30 days
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - 30);

    // Get ALL snapshots for A1 and descendants in last 30 days
    const directChild = await prisma.user.findFirst({
      where: { affiliateParentId: a1.id }
    });

    const grandChild = await prisma.user.findFirst({
      where: { affiliateParentId: directChild.id }
    });

    console.log("\n=== DETAILED SNAPSHOT BREAKDOWN (Last 30 days) ===\n");

    // A1 snapshots
    const a1Snapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: a1.id,
        houseId: "betano",
        date: { gte: periodStart }
      },
      orderBy: { date: "asc" }
    });

    console.log(`A1 Snapshots:`);
    let a1TotalQftds = 0;
    a1Snapshots.forEach(s => {
      console.log(`  ${s.date.toISOString().split('T')[0]}: qftds=${s.qftds}`);
      a1TotalQftds += s.qftds;
    });
    console.log(`  TOTAL: ${a1TotalQftds}\n`);

    // Direct child snapshots
    const childSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: directChild.id,
        houseId: "betano",
        date: { gte: periodStart }
      },
      orderBy: { date: "asc" }
    });

    console.log(`${directChild.name} Snapshots:`);
    let childTotalQftds = 0;
    childSnapshots.forEach(s => {
      console.log(`  ${s.date.toISOString().split('T')[0]}: qftds=${s.qftds}`);
      childTotalQftds += s.qftds;
    });
    console.log(`  TOTAL: ${childTotalQftds}\n`);

    // Grandchild snapshots
    if (grandChild) {
      const grandchildSnapshots = await prisma.dailySnapshot.findMany({
        where: {
          userId: grandChild.id,
          houseId: "betano",
          date: { gte: periodStart }
        },
        orderBy: { date: "asc" }
      });

      console.log(`${grandChild.name} Snapshots:`);
      let grandchildTotalQftds = 0;
      grandchildSnapshots.forEach(s => {
        console.log(`  ${s.date.toISOString().split('T')[0]}: qftds=${s.qftds}`);
        grandchildTotalQftds += s.qftds;
      });
      console.log(`  TOTAL: ${grandchildTotalQftds}\n`);

      // Calculate commission
      const a1CPA = 100;
      const childCPA = 50;
      const childSubtreeTotal = childTotalQftds + grandchildTotalQftds;

      console.log("=== CALCULATION ===");
      console.log(`A1 own commission: ${a1CPA} × ${a1TotalQftds} = ${a1CPA * a1TotalQftds}`);
      console.log(`Child subtree QFTDS: ${childTotalQftds} + ${grandchildTotalQftds} = ${childSubtreeTotal}`);
      console.log(`Commission from child: (${a1CPA} - ${childCPA}) × ${childSubtreeTotal} = ${(a1CPA - childCPA) * childSubtreeTotal}`);
      console.log(`TOTAL: ${a1CPA * a1TotalQftds + (a1CPA - childCPA) * childSubtreeTotal}`);
    }

    console.log("\n✅ Debug complete");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugCommissionDetailed();
