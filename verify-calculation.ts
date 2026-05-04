import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  // Get Admin
  const admin = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });

  if (!admin) {
    console.log("Admin not found");
    await prisma.$disconnect();
    return;
  }

  // Get all descendants of admin
  const getAllDescendants = async (userId: string): Promise<string[]> => {
    const descendants: string[] = [];
    const visited = new Set<string>();
    const queue = [userId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
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
  };

  const descendantIds = await getAllDescendants(admin.id);

  // Get all users in the tree
  const allUsers = await prisma.user.findMany({
    where: { id: { in: [admin.id, ...descendantIds] } },
    select: { id: true, name: true },
  });

  const userMap = new Map(allUsers.map((u) => [u.id, u.name]));

  // Get house data
  const houseDataList = await prisma.userHouseData.findMany({
    where: {
      userId: { in: [admin.id, ...descendantIds] },
      houseId: "betano",
    },
  });

  const houseDataMap = new Map(houseDataList.map((h) => [h.userId, h]));

  // Get snapshots for last 7 days
  const snapshots = await prisma.dailySnapshot.findMany({
    where: {
      userId: { in: [admin.id, ...descendantIds] },
      houseId: "betano",
      date: { gte: sevenDaysAgo },
    },
  });

  // Calculate QFTDS per user
  const qftdsMap = new Map<string, number>();
  for (const snap of snapshots) {
    qftdsMap.set(snap.userId, (qftdsMap.get(snap.userId) || 0) + snap.qftds);
  }

  console.log("\n=== ÁRVORE COMPLETA (últimos 7 dias) ===\n");
  console.log(`Admin: CPA R$ 200 | QFTDS ${qftdsMap.get(admin.id) || 0}`);

  const adminCpa = 200;
  let totalComission = 0;
  let meuRev = 0;

  // Calculate meuRev
  const adminQftds = qftdsMap.get(admin.id) || 0;
  meuRev = adminCpa * adminQftds;
  console.log(`  → Meu Rev: R$ ${meuRev.toFixed(2)}`);

  // Calculate commission for all descendants
  const descendantDetails: string[] = [];
  for (const descendantId of descendantIds) {
    const name = userMap.get(descendantId) || "Unknown";
    const houseData = houseDataMap.get(descendantId);
    const descendantQftds = qftdsMap.get(descendantId) || 0;
    const descendantCpa = houseData ? Number(houseData.cpa) : 0;

    const commission = (adminCpa - descendantCpa) * descendantQftds;
    totalComission += commission;

    descendantDetails.push(
      `  ${name}: CPA R$ ${descendantCpa} | QFTDS ${descendantQftds} | (200-${descendantCpa})×${descendantQftds} = R$ ${commission.toFixed(2)}`
    );
  }

  console.log("\nDescententes:");
  descendantDetails.forEach((d) => console.log(d));

  console.log(`\n=== TOTAIS ===`);
  console.log(`Meu Rev: R$ ${meuRev.toFixed(2)}`);
  console.log(`Comissão da Equipe: R$ ${totalComission.toFixed(2)}`);
  console.log(`Total Próprio: R$ ${(meuRev + totalComission).toFixed(2)}`);

  await prisma.$disconnect();
}

main().catch(console.error);
