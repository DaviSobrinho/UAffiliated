#!/usr/bin/env node

/**
 * Verify and Fix Script
 *
 * Verifica o estado do banco e fornece instruções para corrigir
 *
 * Execute: node verify-and-fix.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("\n🔧 VERIFICAR E CORRIGIR BANCO DE DADOS\n");
  console.log("=".repeat(80) + "\n");

  try {
    // Step 1: Contar dados
    console.log("📊 PASSO 1: Contando dados...\n");

    const userCount = await prisma.user.count();
    const houseCount = await prisma.house.count();
    const userHouseDataCount = await prisma.userHouseData.count();
    const snapshotCount = await prisma.dailySnapshot.count();

    console.log(`   ✓ Usuários: ${userCount}`);
    console.log(`   ✓ Casas: ${houseCount}`);
    console.log(`   ✓ UserHouseData: ${userHouseDataCount}`);
    console.log(`   ✓ DailySnapshots: ${snapshotCount}`);

    // Step 2: Verificar Admin
    console.log("\n📝 PASSO 2: Verificando usuário Admin...\n");

    const admin = await prisma.user.findFirst({
      where: { email: "admin@example.com" },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!admin) {
      console.log("   ❌ ERRO: Admin não encontrado!");
      console.log("   ➜ Execute: npm run prisma:seed");
      process.exit(1);
    }

    console.log(`   ✓ Admin encontrado: ${admin.name}`);

    // Step 3: Verificar Betano house
    console.log("\n🏠 PASSO 3: Verificando casa Betano...\n");

    const betano = await prisma.house.findUnique({
      where: { name: "Betano" },
      select: { id: true, name: true },
    });

    if (!betano) {
      console.log("   ❌ ERRO: Casa 'Betano' não encontrada!");
      console.log("   ➜ Execute: npm run prisma:seed");
      process.exit(1);
    }

    console.log(`   ✓ Casa Betano encontrada (ID: ${betano.id})`);

    // Step 4: Verificar admin tem dados para Betano
    console.log("\n🔗 PASSO 4: Verificando dados do Admin em Betano...\n");

    const adminBetanoData = await prisma.userHouseData.findUnique({
      where: {
        userId_houseId: {
          userId: admin.id,
          houseId: betano.id,
        },
      },
    });

    if (!adminBetanoData) {
      console.log("   ❌ ERRO: Admin não tem dados para Betano!");
      console.log("   ➜ Execute: npm run prisma:seed");
      process.exit(1);
    }

    console.log(`   ✓ Admin tem dados em Betano`);
    console.log(`     - CPA: R$ ${adminBetanoData.cpa}`);
    console.log(`     - Registros: ${adminBetanoData.registros}`);
    console.log(`     - FTDs: ${adminBetanoData.ftds}`);
    console.log(`     - QFTDs: ${adminBetanoData.qftds}`);

    // Step 5: Verificar snapshots para Admin em Betano
    console.log("\n📈 PASSO 5: Verificando snapshots para Admin...\n");

    const adminBetanoSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: admin.id,
        houseId: betano.id,
      },
      select: { date: true, registros: true, ftds: true, qftds: true },
      orderBy: { date: "desc" },
      take: 3,
    });

    if (adminBetanoSnapshots.length === 0) {
      console.log("   ❌ ERRO: Nenhum snapshot para Admin em Betano!");
      console.log("   ➜ Execute: npm run prisma:seed");
      process.exit(1);
    }

    console.log(`   ✓ Admin tem ${adminBetanoSnapshots.length} snapshots`);
    adminBetanoSnapshots.forEach((s) => {
      const dateStr = s.date.toISOString().split("T")[0];
      console.log(`     - ${dateStr}: Registros=${s.registros}, FTDs=${s.ftds}, QFTDs=${s.qftds}`);
    });

    // Step 6: Calcular totais esperados
    console.log("\n💰 PASSO 6: Validando cálculos...\n");

    const allAdminSnapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId: admin.id,
        houseId: betano.id,
      },
    });

    const totalRegistros = allAdminSnapshots.reduce((sum, s) => sum + s.registros, 0);
    const totalFtds = allAdminSnapshots.reduce((sum, s) => sum + s.ftds, 0);
    const totalQftds = allAdminSnapshots.reduce((sum, s) => sum + s.qftds, 0);

    console.log(`   Total de snapshots: ${allAdminSnapshots.length}`);
    console.log(`   Total Registros: ${totalRegistros}`);
    console.log(`   Total FTDs: ${totalFtds}`);
    console.log(`   Total QFTDs: ${totalQftds}`);

    const expectedCpa = Number(adminBetanoData.cpa);
    const expectedCommission = expectedCpa * totalQftds;

    console.log(`   Comissão esperada: R$ ${expectedCpa} × ${totalQftds} = R$ ${expectedCommission.toFixed(2)}`);

    // Step 7: Verificar dados de affiliados
    console.log("\n👥 PASSO 7: Verificando dados de affiliados...\n");

    const directChildren = await prisma.user.findMany({
      where: { affiliateParentId: admin.id },
      select: { id: true, name: true },
    });

    console.log(`   ✓ Admin tem ${directChildren.length} affiliados diretos`);

    if (directChildren.length > 0) {
      const firstChild = directChildren[0];
      const childData = await prisma.userHouseData.findUnique({
        where: {
          userId_houseId: {
            userId: firstChild.id,
            houseId: betano.id,
          },
        },
      });

      if (childData) {
        console.log(`   ✓ Primeiro affiliado ${firstChild.name} tem dados em Betano`);
        console.log(`     - CPA: R$ ${childData.cpa}`);
      }
    }

    // Final Check
    console.log("\n" + "=".repeat(80));
    console.log("\n✅ TODOS OS TESTES PASSARAM!\n");
    console.log("   O banco de dados está configurado corretamente.");
    console.log("   Você pode rodar: npm run dev");
    console.log("   E os dados devem carregar na dashboard.\n");
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ ERRO:", error.message, "\n");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
