const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugCommission() {
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

    if (!a1) {
      console.log("❌ User A1 not found");
      return;
    }

    console.log("\n=== USER A1 ===");
    console.log("ID:", a1.id);
    console.log("Name:", a1.name);
    console.log("Email:", a1.email);

    // Get A1's house data
    const a1HouseData = await prisma.userHouseData.findUnique({
      where: {
        userId_houseId: {
          userId: a1.id,
          houseId: "betano"
        }
      }
    });

    console.log("\n=== A1 HOUSE DATA (Betano) ===");
    console.log("CPA:", a1HouseData?.cpa);

    // Get last 30 days
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - 30);

    // Get A1's snapshots
    const a1Snapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: a1.id,
        houseId: "betano",
        date: { gte: periodStart }
      }
    });

    const a1TotalQftds = a1Snapshots.reduce((sum, s) => sum + s.qftds, 0);
    console.log("\n=== A1 SNAPSHOTS (Last 30 days) ===");
    console.log("Count:", a1Snapshots.length);
    console.log("Total QFTDS:", a1TotalQftds);
    console.log("A1 Own Commission:", Number(a1HouseData?.cpa || 0) * a1TotalQftds);

    // Get A1's direct children
    const directChildren = await prisma.user.findMany({
      where: { affiliateParentId: a1.id }
    });

    console.log("\n=== A1 DIRECT CHILDREN ===");
    console.log("Count:", directChildren.length);

    for (const child of directChildren) {
      console.log(`\n  Child: ${child.name} (${child.id})`);

      const childHouseData = await prisma.userHouseData.findUnique({
        where: {
          userId_houseId: {
            userId: child.id,
            houseId: "betano"
          }
        }
      });
      console.log(`  CPA: ${childHouseData?.cpa}`);

      // Get all descendants of this child
      const childDescendants = await getAllDescendants(child.id);
      const allInSubtree = [child.id, ...childDescendants];

      console.log(`  Descendants count: ${childDescendants.length}`);
      console.log(`  Subtree (including self): ${allInSubtree.length}`);

      // Get snapshots for entire subtree
      const subtreeSnapshots = await prisma.dailySnapshot.findMany({
        where: {
          userId: { in: allInSubtree },
          houseId: "betano",
          date: { gte: periodStart }
        }
      });

      const subtreeQftds = subtreeSnapshots.reduce((sum, s) => sum + s.qftds, 0);
      console.log(`  Subtree Total QFTDS: ${subtreeQftds}`);

      const cpaDiff = Number(a1HouseData?.cpa || 0) - Number(childHouseData?.cpa || 0);
      const commission = cpaDiff * subtreeQftds;
      console.log(`  CPA Difference (${a1HouseData?.cpa} - ${childHouseData?.cpa}): ${cpaDiff}`);
      console.log(`  Commission from this child: ${cpaDiff} × ${subtreeQftds} = ${commission}`);
    }

    console.log("\n✅ Debug complete");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

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

debugCommission();
