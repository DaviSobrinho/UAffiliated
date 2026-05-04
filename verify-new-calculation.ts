import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getAllDescendants(userId: string): Promise<string[]> {
  const descendants: string[] = [];
  const visited = new Set<string>();
  const queue = [userId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const children = await prisma.user.findMany({
      where: { affiliateParentId: currentId },
      select: { id: true },
    });

    for (const child of children) {
      descendants.push(child.id);
      queue.push(child.id);
    }
  }

  return descendants;
}

async function main() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const admin = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });

  if (!admin) {
    console.log("Admin not found");
    await prisma.$disconnect();
    return;
  }

  // Get direct children
  const directChildren = await prisma.user.findMany({
    where: { affiliateParentId: admin.id },
    select: { id: true, name: true },
  });

  const adminHouseData = await prisma.userHouseData.findUnique({
    where: { userId_houseId: { userId: admin.id, houseId: "betano" } },
  });

  // Get admin snapshots
  const adminSnapshots = await prisma.dailySnapshot.findMany({
    where: {
      userId: admin.id,
      houseId: "betano",
      date: { gte: sevenDaysAgo },
    },
  });
  const adminQftds = adminSnapshots.reduce((sum, s) => sum + s.qftds, 0);

  console.log("\n=== COMISSÃO COM NOVA FÓRMULA ===\n");
  console.log(`Admin: CPA R$ 200, QFTDS ${adminQftds}`);
  console.log(`Meu Rev: ${200 * adminQftds}\n`);

  let totalComission = 0;

  for (const child of directChildren) {
    const childHouseData = await prisma.userHouseData.findUnique({
      where: { userId_houseId: { userId: child.id, houseId: "betano" } },
    });

    // Get all descendants of this child
    const descendants = await getAllDescendants(child.id);
    const allInSubtree = [child.id, ...descendants];

    // Get snapshots for entire subtree
    const subtreeSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: { in: allInSubtree },
        houseId: "betano",
        date: { gte: sevenDaysAgo },
      },
    });

    const subtreeQftds = subtreeSnapshots.reduce((sum, s) => sum + s.qftds, 0);
    const childCpa = childHouseData ? Number(childHouseData.cpa) : 0;
    const cpaDiff = 200 - childCpa;
    const commission = cpaDiff * subtreeQftds;

    totalComission += commission;

    console.log(`Afiliado Direto: ${child.name}`);
    console.log(`  CPA: R$ ${childCpa}`);
    console.log(`  Subtree QFTDS: ${subtreeQftds}`);
    console.log(`  Comissão: (200 - ${childCpa}) × ${subtreeQftds} = R$ ${commission}`);
    console.log();
  }

  console.log(`Total Comissão da Equipe: R$ ${totalComission}`);
  console.log(`Total Próprio: R$ ${200 * adminQftds + totalComission}`);

  await prisma.$disconnect();
}

main().catch(console.error);
