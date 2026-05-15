#!/usr/bin/env node

/**
 * Database Audit Script
 *
 * Verifica se há dados no banco e mostra um relatório completo
 *
 * Execute: node audit-database.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function auditDatabase() {
  console.log("\n🔍 AUDITANDO BANCO DE DADOS...\n");
  console.log("=".repeat(80));

  try {
    // 1. Users
    console.log("\n👤 USUÁRIOS:");
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
    console.log(`   Total: ${users.length}`);
    if (users.length > 0) {
      console.log("   Amostra:");
      users.slice(0, 5).forEach((u) => {
        console.log(`     - ${u.name} (${u.role}) - ${u.email}`);
      });
      if (users.length > 5) {
        console.log(`     ... e mais ${users.length - 5}`);
      }
    }

    // 2. Houses
    console.log("\n🏠 CASAS DE APOSTAS:");
    const houses = await prisma.house.findMany({ select: { id: true, name: true } });
    console.log(`   Total: ${houses.length}`);
    if (houses.length > 0) {
      console.log("   Casas:");
      houses.forEach((h) => {
        console.log(`     - ${h.name} (${h.id})`);
      });
    }

    // 3. UserHouseData
    console.log("\n🔗 DADOS DE USUÁRIO POR CASA (UserHouseData):");
    const userHouseData = await prisma.userHouseData.findMany({
      select: { id: true, userId: true, houseId: true, cpa: true, registros: true, ftds: true, qftds: true },
    });
    console.log(`   Total: ${userHouseData.length}`);

    if (userHouseData.length === 0) {
      console.log("   ⚠️  NENHUM REGISTRO DE UserHouseData!");
    } else {
      console.log("   Amostra (primeiros 5):");
      userHouseData.slice(0, 5).forEach((d) => {
        console.log(`     - User ${d.userId.substring(0, 8)}... | Casa ${d.houseId} | CPA: R$ ${d.cpa} | Registros: ${d.registros}, FTDs: ${d.ftds}, QFTDs: ${d.qftds}`);
      });
      if (userHouseData.length > 5) {
        console.log(`     ... e mais ${userHouseData.length - 5}`);
      }

      // Estatísticas de UserHouseData
      console.log("\n   Estatísticas:");
      const totalRegistros = userHouseData.reduce((sum, d) => sum + d.registros, 0);
      const totalFtds = userHouseData.reduce((sum, d) => sum + d.ftds, 0);
      const totalQftds = userHouseData.reduce((sum, d) => sum + d.qftds, 0);
      console.log(`     - Total Registros: ${totalRegistros}`);
      console.log(`     - Total FTDs: ${totalFtds}`);
      console.log(`     - Total QFTDs: ${totalQftds}`);

      // Por casa
      console.log("\n   Distribuição por Casa:");
      const byHouse = {};
      userHouseData.forEach((d) => {
        if (!byHouse[d.houseId]) {
          byHouse[d.houseId] = { count: 0, registros: 0, ftds: 0, qftds: 0 };
        }
        byHouse[d.houseId].count++;
        byHouse[d.houseId].registros += d.registros;
        byHouse[d.houseId].ftds += d.ftds;
        byHouse[d.houseId].qftds += d.qftds;
      });

      Object.entries(byHouse).forEach(([houseId, stats]) => {
        console.log(`     - ${houseId}: ${stats.count} usuários | Registros: ${stats.registros}, FTDs: ${stats.ftds}, QFTDs: ${stats.qftds}`);
      });
    }

    // 4. DailySnapshots
    console.log("\n📊 SNAPSHOTS DIÁRIOS (DailySnapshot):");
    const snapshots = await prisma.dailySnapshot.findMany({
      select: { id: true, userId: true, houseId: true, date: true, registros: true, ftds: true, qftds: true },
      take: 1, // Just to count
    });

    const snapshotCount = await prisma.dailySnapshot.count();
    console.log(`   Total: ${snapshotCount}`);

    if (snapshotCount === 0) {
      console.log("   ⚠️  NENHUM SNAPSHOT NO BANCO!");
    } else {
      // Amostra de snapshots
      const sampleSnapshots = await prisma.dailySnapshot.findMany({
        take: 5,
        orderBy: { date: "desc" },
      });

      console.log("   Amostra (últimos 5):");
      sampleSnapshots.forEach((s) => {
        const dateStr = s.date.toISOString().split("T")[0];
        console.log(`     - ${dateStr} | User ${s.userId.substring(0, 8)}... | Casa ${s.houseId} | Registros: ${s.registros}, FTDs: ${s.ftds}, QFTDs: ${s.qftds}`);
      });

      // Estatísticas de Snapshots
      console.log("\n   Estatísticas:");
      const allSnapshots = await prisma.dailySnapshot.findMany({
        select: { registros: true, ftds: true, qftds: true, userId: true, houseId: true },
      });

      const totalSnapshotRegistros = allSnapshots.reduce((sum, s) => sum + s.registros, 0);
      const totalSnapshotFtds = allSnapshots.reduce((sum, s) => sum + s.ftds, 0);
      const totalSnapshotQftds = allSnapshots.reduce((sum, s) => sum + s.qftds, 0);
      const uniqueUsers = new Set(allSnapshots.map((s) => s.userId)).size;
      const uniqueHouses = new Set(allSnapshots.map((s) => s.houseId)).size;

      console.log(`     - Total Registros: ${totalSnapshotRegistros}`);
      console.log(`     - Total FTDs: ${totalSnapshotFtds}`);
      console.log(`     - Total QFTDs: ${totalSnapshotQftds}`);
      console.log(`     - Usuários com snapshots: ${uniqueUsers}`);
      console.log(`     - Casas com snapshots: ${uniqueHouses}`);

      // Data range
      const dateRange = await prisma.dailySnapshot.findMany({
        orderBy: { date: "asc" },
        take: 1,
        select: { date: true },
      });

      const latestDate = await prisma.dailySnapshot.findMany({
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true },
      });

      if (dateRange.length > 0 && latestDate.length > 0) {
        const startDate = dateRange[0].date.toISOString().split("T")[0];
        const endDate = latestDate[0].date.toISOString().split("T")[0];
        console.log(`     - Range de datas: ${startDate} até ${endDate}`);
      }
    }

    // 5. Verificar dados do Admin específico
    if (users.length > 0) {
      const admin = users.find((u) => u.role === "ADMIN");
      if (admin) {
        console.log(`\n🔐 DADOS DO ADMIN (${admin.name}):`);
        console.log(`   ID: ${admin.id}`);

        const adminHouseData = await prisma.userHouseData.findMany({
          where: { userId: admin.id },
          select: { houseId: true, cpa: true, registros: true, ftds: true, qftds: true },
        });

        console.log(`   UserHouseData records: ${adminHouseData.length}`);
        if (adminHouseData.length > 0) {
          adminHouseData.forEach((d) => {
            console.log(`     - Casa: ${d.houseId} | CPA: R$ ${d.cpa} | Registros: ${d.registros}, FTDs: ${d.ftds}, QFTDs: ${d.qftds}`);
          });
        }

        const adminSnapshots = await prisma.dailySnapshot.count({
          where: { userId: admin.id },
        });
        console.log(`   DailySnapshots: ${adminSnapshots}`);

        if (adminSnapshots > 0) {
          const sampleAdminSnapshots = await prisma.dailySnapshot.findMany({
            where: { userId: admin.id },
            take: 5,
            orderBy: { date: "desc" },
            select: { date: true, houseId: true, registros: true, ftds: true, qftds: true },
          });

          console.log("   Amostra de snapshots:");
          sampleAdminSnapshots.forEach((s) => {
            const dateStr = s.date.toISOString().split("T")[0];
            console.log(`     - ${dateStr} | Casa ${s.houseId} | Registros: ${s.registros}, FTDs: ${s.ftds}, QFTDs: ${s.qftds}`);
          });
        }
      }
    }

    // 6. Relatório Final
    console.log("\n" + "=".repeat(80));
    console.log("\n📋 RESUMO:");

    if (userHouseData.length === 0) {
      console.log("   ❌ PROBLEMA: Nenhum UserHouseData encontrado!");
      console.log("   ➜ Você precisa executar: npm run prisma:seed");
    } else if (snapshotCount === 0) {
      console.log("   ⚠️  PROBLEMA: UserHouseData existe, mas sem snapshots!");
      console.log("   ➜ Os dados de snapshot estão zerados");
      console.log("   ➜ Você precisa executar: npm run prisma:seed");
    } else {
      console.log("   ✅ TUDO OK! Banco tem dados completos:");
      console.log(`      - ${users.length} usuários`);
      console.log(`      - ${houses.length} casas`);
      console.log(`      - ${userHouseData.length} registros de UserHouseData`);
      console.log(`      - ${snapshotCount} snapshots diários`);
      console.log("\n   ✅ Dados devem carregar na dashboard!");
    }

    console.log("\n" + "=".repeat(80) + "\n");
  } catch (error) {
    console.error("❌ ERRO ao auditar banco:", error);
  } finally {
    await prisma.$disconnect();
  }
}

auditDatabase();
