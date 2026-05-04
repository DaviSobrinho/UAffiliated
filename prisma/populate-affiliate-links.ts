import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HOUSES = [
  { id: "betano", name: "Betano" },
  { id: "betfair", name: "Betfair" },
  { id: "betnacional", name: "Bet Nacional" },
  { id: "esportivabet", name: "Esportivabet" },
  { id: "estrelabet", name: "Estrelabet" },
  { id: "novibet", name: "Novibet" },
  { id: "segurobet", name: "Segurobet" },
  { id: "stake", name: "Stake" },
  { id: "superbet", name: "Superbet" },
];

async function main() {
  console.log("🔄 Populando links de afiliados...");

  // Get all users
  const users = await prisma.user.findMany();

  for (const user of users) {
    // Generate affiliate link site if not exists
    if (!user.affiliateLinkSite) {
      const affiliateLinkSite = `${user.id.substring(0, 8).toUpperCase()}`;
      await prisma.user.update({
        where: { id: user.id },
        data: { affiliateLinkSite },
      });
      console.log(`✓ Link gerado para ${user.name}: ${affiliateLinkSite}`);
    }

    // Create UserHouseData for each house if not exists
    for (const house of HOUSES) {
      const exists = await prisma.userHouseData.findUnique({
        where: {
          userId_houseId: {
            userId: user.id,
            houseId: house.id,
          },
        },
      });

      if (!exists) {
        try {
          const affiliateLink = `${house.id}.com/register?ref=${user.affiliateLinkSite}-${house.id.toUpperCase()}`;

          await prisma.userHouseData.create({
            data: {
              userId: user.id,
              houseId: house.id,
              houseName: house.name,
              cpa: 0,
              affiliateLink,
              registros: 0,
              ftds: 0,
              qftds: 0,
            },
          });

          console.log(`✓ Dados criados para ${user.name} - ${house.name}`);
        } catch (error: any) {
          if (error.code === "P2002" && error.meta?.target?.includes("affiliateLink")) {
            console.log(`⚠️  Link de afiliado já existe para ${user.name} - ${house.name}`);
          } else {
            throw error;
          }
        }
      }
    }
  }

  console.log("✅ População concluída!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
