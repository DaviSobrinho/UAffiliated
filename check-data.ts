import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const data = await prisma.userHouseData.findMany({
    where: { houseId: "betano" },
    include: { user: { select: { name: true, role: true, id: true } } },
    orderBy: { user: { name: "asc" } },
  });

  console.log("\n=== BETANO HOUSE DATA ===\n");
  for (const item of data) {
    console.log(`${item.user.name} (${item.user.role})`);
    console.log(`  CPA: R$ ${Number(item.cpa).toFixed(2)}`);
    console.log(`  QFTDS: ${item.qftds}`);
    console.log();
  }

  await prisma.$disconnect();
}

main().catch(console.error);
