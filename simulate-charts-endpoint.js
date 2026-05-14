const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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

async function simulateChartsEndpoint() {
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

    console.log("=== SIMULATING CHARTS ENDPOINT FOR A1 ===\n");
    console.log("User:", a1.name, `(${a1.id})`);

    // Params
    const affiliateId = "all";
    const timeframe = "30d";
    const houseId = "betano";
    const TIMEFRAME_DAYS = { "7d": 7, "30d": 30, "3m": 90, "6m": 180, "1y": 365 };
    const days = TIMEFRAME_DAYS[timeframe] ?? 30;

    // Determine target user IDs (same as endpoint)
    let targetIds = [];
    if (affiliateId === "all") {
      targetIds = await getAllDescendants(a1.id);
    }

    console.log(`\nTarget IDs (affiliateId='${affiliateId}'):`, targetIds.length, "users");
    for (const id of targetIds) {
      const u = await prisma.user.findUnique({
        where: { id },
        select: { name: true }
      });
      console.log(`  - ${u.name}`);
    }

    // Compute date boundaries
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const currentStart = new Date(now);
    currentStart.setDate(now.getDate() - days);

    console.log(`\nDate range: ${currentStart.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]} (${days} days)`);

    // Helper function
    const dateToString = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return new Date(`${year}-${month}-${day}T00:00:00Z`);
    };

    // Query snapshots
    const currentSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: { in: targetIds },
        houseId,
        date: { gte: dateToString(currentStart) }
      },
      orderBy: { date: "asc" }
    });

    console.log(`\nTotal snapshots retrieved: ${currentSnapshots.length}`);

    // Get user CPA
    const userHouseData = await prisma.userHouseData.findUnique({
      where: {
        userId_houseId: {
          userId: a1.id,
          houseId
        }
      }
    });

    const userCpaCents = Math.round(Number(userHouseData.cpa) * 100);
    console.log(`A1 CPA: ${Number(userHouseData.cpa)}`);

    // Get direct children
    const directChildren = await prisma.user.findMany({
      where: { affiliateParentId: a1.id },
      select: { id: true }
    });

    console.log(`\nDirect children: ${directChildren.length}`);

    // Get CPAs
    const targetUserHouseData = await prisma.userHouseData.findMany({
      where: {
        userId: { in: targetIds },
        houseId
      }
    });

    const cpaByCpnserId = new Map(
      targetUserHouseData.map((data) => [data.userId, Math.round(Number(data.cpa) * 100)])
    );

    // Calculate commission using THE CORRECTED ENDPOINT CODE
    const calculateCommission = (snapshots) => {
      let totalCents = 0;

      // Add own commission (own CPA × own QFTDS)
      for (const snap of snapshots) {
        if (snap.userId === a1.id) {
          totalCents += userCpaCents * snap.qftds;
        }
      }

      // Add commission from each direct child's subtree
      for (const directChild of directChildren) {
        const directChildCpaCents = cpaByCpnserId.get(directChild.id) || userCpaCents;
        const cpaDifferenceCents = Math.max(0, userCpaCents - directChildCpaCents);

        // Get all descendants of this child
        const allDescendants = await getAllDescendants(directChild.id);
        const subtreeIds = new Set([directChild.id, ...allDescendants]);

        for (const snap of snapshots) {
          if (subtreeIds.has(snap.userId)) {
            totalCents += cpaDifferenceCents * snap.qftds;
          }
        }
      }

      return totalCents;
    };

    // Note: Our calculate function is async, so we need to handle it
    console.log("\n=== COMMISSION BREAKDOWN ===");

    // Calculate own commission
    let ownCommissionCents = 0;
    for (const snap of currentSnapshots) {
      if (snap.userId === a1.id) {
        ownCommissionCents += userCpaCents * snap.qftds;
      }
    }
    console.log(`A1 own commission: ${ownCommissionCents / 100}`);

    // Calculate from direct children
    let totalFromChildrenCents = 0;
    for (const directChild of directChildren) {
      const directChildCpaCents = cpaByCpnserId.get(directChild.id) || userCpaCents;
      const cpaDifferenceCents = Math.max(0, userCpaCents - directChildCpaCents);

      const allDescendants = await getAllDescendants(directChild.id);
      const subtreeIds = new Set([directChild.id, ...allDescendants]);

      let childCommissionCents = 0;
      for (const snap of currentSnapshots) {
        if (subtreeIds.has(snap.userId)) {
          childCommissionCents += cpaDifferenceCents * snap.qftds;
        }
      }

      const child = await prisma.user.findUnique({
        where: { id: directChild.id },
        select: { name: true }
      });

      const childQftds = currentSnapshots
        .filter(s => subtreeIds.has(s.userId))
        .reduce((sum, s) => sum + s.qftds, 0);

      console.log(`From ${child.name} (${allDescendants.length} descendants, ${childQftds} qftds): (${Number(userHouseData.cpa)} - ${Number(cpaByCpnserId.get(directChild.id) || 0) / 100}) × ${childQftds} = ${childCommissionCents / 100}`);
      totalFromChildrenCents += childCommissionCents;
    }

    const totalCommissionCents = ownCommissionCents + totalFromChildrenCents;
    console.log(`\nTOTAL COMMISSION: ${totalCommissionCents / 100}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error.stack);
  }
}

simulateChartsEndpoint();
