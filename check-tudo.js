#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  console.log("\n✨ VERIFICANDO TUDO...\n");

  try {
    // 1. Users
    const users = await prisma.user.count();
    console.log(`👤 Usuários: ${users}`);

    // 2. Houses
    const houses = await prisma.house.count();
    console.log(`🏠 Casas: ${houses}`);

    // 3. UserHouseData
    const uhd = await prisma.userHouseData.count();
    console.log(`🔗 UserHouseData: ${uhd}`);

    // 4. Snapshots
    const snaps = await prisma.dailySnapshot.count();
    console.log(`📊 Snapshots: ${snaps}`);

    // 5. Resultado
    console.log("\n" + "=".repeat(50));

    if (users === 0 || houses === 0 || uhd === 0 || snaps === 0) {
      console.log("\n❌ DADOS INCOMPLETOS!");
      console.log("\nExecute isto:\n");
      console.log("   npm run prisma:seed\n");
      console.log("Depois rode novamente:\n");
      console.log("   node check-tudo.js\n");
    } else {
      console.log("\n✅ TUDO CERTO!");
      console.log(`\n${users} usuários`);
      console.log(`${houses} casas`);
      console.log(`${uhd} registros de dados`);
      console.log(`${snaps} snapshots\n`);
      console.log("Agora execute:\n");
      console.log("   npm run dev\n");
    }

    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
