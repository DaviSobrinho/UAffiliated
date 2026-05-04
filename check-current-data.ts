import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      affiliateParentId: true,
    },
    orderBy: { name: "asc" },
  });

  const houseData = await prisma.userHouseData.findMany({
    where: { houseId: "betano" },
    select: { userId: true, cpa: true, qftds: true },
  });

  const houseDataMap = new Map(houseData.map((h) => [h.userId, h]));

  console.log("\n=== USUÁRIOS E HOUSE DATA ===\n");
  for (const user of users) {
    const data = houseDataMap.get(user.id);
    const parent = users.find((u) => u.id === user.affiliateParentId);
    console.log(`${user.name} (${user.role})`);
    console.log(
      `  CPA: R$ ${data ? Number(data.cpa).toFixed(0) : "N/A"} | QFTDS: ${data?.qftds || 0}`
    );
    if (parent) {
      console.log(`  Pai: ${parent.name}`);
    }
    console.log();
  }

  await prisma.$disconnect();
}

main().catch(console.error);
