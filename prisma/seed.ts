import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function generateSnapshots(
  userId: string,
  houseId: string,
  cpa: number,
  days: number = 90
) {
  const snapshots = [];
  const now = new Date();

  for (let i = days; i > 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);

    // Deterministic, small QFTDS pattern (1-4)
    const dayOfMonth = date.getDate();
    const qftds = 1 + (dayOfMonth % 4); // 1-4

    // Use integer arithmetic for revenue
    const cpaCents = Math.round(cpa * 100);
    const revenueCents = cpaCents * qftds;
    const revenue = revenueCents / 100;

    snapshots.push({
      userId,
      houseId,
      date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      registros: qftds,
      ftds: qftds,
      qftds,
      revenue,
    });
  }

  return snapshots;
}

async function main() {
  const totalStart = Date.now();
  console.log("[SEED] 🔄 Iniciando seed com logs...");

  // Clear existing data
  console.log("[SEED] 🗑️  Limpando dados antigos...");
  const clearStart = Date.now();
  await prisma.dailySnapshot.deleteMany();
  await prisma.userHouseData.deleteMany();
  await prisma.house.deleteMany();
  await prisma.user.deleteMany();
  console.log(`[SEED] ✓ Dados deletados em ${Date.now() - clearStart}ms`);

  // Predefined houses with their theme colors
  const predefinedHouses = [
    { name: "Betano", color: "#FF6B00" },
    { name: "Betfair", color: "#FFD700" },
    { name: "Bet Nacional", color: "#0066FF" },
    { name: "Esportivabet", color: "#FF6B00" },
    { name: "Estrelabet", color: "#FFD700" },
    { name: "Novibet", color: "#FFFFFF" },
    { name: "Segurobet", color: "#00C853" },
    { name: "Stake", color: "#FFFFFF" },
    { name: "Superbet", color: "#FF1744" },
  ];

  const createdHouses: Record<string, any> = {};

  console.log(`[SEED] 🏠 Criando ${predefinedHouses.length} casas...`);
  const housesStart = Date.now();
  for (const house of predefinedHouses) {
    const created = await prisma.house.create({
      data: {
        name: house.name,
        color: house.color,
      },
    });
    createdHouses[house.name] = created;
  }
  console.log(`[SEED] ✓ Casas criadas em ${Date.now() - housesStart}ms`);

  const betano = createdHouses["Betano"];
  const novibet = createdHouses["Novibet"];

  const hashedPassword = await bcrypt.hash("user123", 10);

  // Create 5-level hierarchy
  // N1 (root admin)
  const n1 = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: await bcrypt.hash("admin123", 10),
      name: "Admin (N1)",
      role: "ADMIN",
    },
  });

  // Create N1 (admin)
  console.log(`[SEED] 👤 Criando admin (N1)...`);
  const usersStart = Date.now();
  let userCount = 1;

  // N2 (direct children of admin) - 3 users
  const n2_users = [];
  console.log(`[SEED]   - Criando 3 usuários N2...`);
  for (let i = 1; i <= 3; i++) {
    const user = await prisma.user.create({
      data: {
        email: `user-n2-${i}@example.com`,
        password: hashedPassword,
        name: `User N2-${i}`,
        role: "USER",
        affiliateParentId: n1.id,
      },
    });
    n2_users.push(user);
    userCount++;
  }

  // N3 (children of N2) - each N2 user has 3 children
  const n3_users = [];
  console.log(`[SEED]   - Criando 9 usuários N3...`);
  for (const n2 of n2_users) {
    for (let i = 1; i <= 3; i++) {
      const user = await prisma.user.create({
        data: {
          email: `user-n3-${n2_users.indexOf(n2)}-${i}@example.com`,
          password: hashedPassword,
          name: `User N3-${n2_users.indexOf(n2)}-${i}`,
          role: "USER",
          affiliateParentId: n2.id,
        },
      });
      n3_users.push(user);
      userCount++;
    }
  }

  // N4 (children of N3) - each N3 user has 2 children
  const n4_users = [];
  console.log(`[SEED]   - Criando 18 usuários N4...`);
  for (const n3 of n3_users) {
    for (let i = 1; i <= 2; i++) {
      const user = await prisma.user.create({
        data: {
          email: `user-n4-${n3_users.indexOf(n3)}-${i}@example.com`,
          password: hashedPassword,
          name: `User N4-${n3_users.indexOf(n3)}-${i}`,
          role: "USER",
          affiliateParentId: n3.id,
        },
      });
      n4_users.push(user);
      userCount++;
    }
  }

  // N5 (children of N4) - each N4 user has 1 child
  const n5_users = [];
  console.log(`[SEED]   - Criando 18 usuários N5...`);
  for (const n4 of n4_users) {
    const user = await prisma.user.create({
      data: {
        email: `user-n5-${n4_users.indexOf(n4)}@example.com`,
        password: hashedPassword,
        name: `User N5-${n4_users.indexOf(n4)}`,
        role: "USER",
        affiliateParentId: n4.id,
      },
    });
    n5_users.push(user);
    userCount++;
  }
  console.log(`[SEED] ✓ ${userCount} usuários criados em ${Date.now() - usersStart}ms`);

  // Create UserHouseData for all users with CPAs that decrease by level
  const createHouseData = async (userId: string, betanoCpa: number, novibetCpa: number) => {
    return [
      await prisma.userHouseData.create({
        data: {
          userId,
          houseId: betano.id,
          cpa: betanoCpa,
          affiliateLink: `betano/${userId}`,
          registros: 0,
          ftds: 0,
          qftds: 0,
        },
      }),
      await prisma.userHouseData.create({
        data: {
          userId,
          houseId: novibet.id,
          cpa: novibetCpa,
          affiliateLink: `novibet/${userId}`,
          registros: 0,
          ftds: 0,
          qftds: 0,
        },
      }),
    ];
  };

  // CPAs decrease by level (200 → 150 → 100 → 50 → 25)
  await createHouseData(n1.id, 200, 150);

  // Create house data for all N2 users
  for (const n2 of n2_users) {
    await createHouseData(n2.id, 150, 120);
  }

  // Create house data for all N3 users
  for (const n3 of n3_users) {
    await createHouseData(n3.id, 100, 80);
  }

  // Create house data for all N4 users
  for (const n4 of n4_users) {
    await createHouseData(n4.id, 50, 40);
  }

  // Create house data for all N5 users
  for (const n5 of n5_users) {
    await createHouseData(n5.id, 25, 20);
  }

  // Generate and create snapshots for each user (including admin!)
  const users = [
    { id: n1.id, cpaB: 200, cpaN: 150 }, // Admin
    ...n2_users.map((u) => ({ id: u.id, cpaB: 150, cpaN: 120 })),
    ...n3_users.map((u) => ({ id: u.id, cpaB: 100, cpaN: 80 })),
    ...n4_users.map((u) => ({ id: u.id, cpaB: 50, cpaN: 40 })),
    ...n5_users.map((u) => ({ id: u.id, cpaB: 25, cpaN: 20 })),
  ];

  console.log(`[SEED] 📊 Criando ${users.length * 30 * 2} snapshots (30 dias × 2 casas)...`);
  const snapshotsStart = Date.now();
  let snapshotBatches = 0;

  for (const u of users) {
    // Use 30 days instead of 90 to reduce load
    const snapshotsBetano = await generateSnapshots(u.id, betano.id, u.cpaB, 30);
    const snapshotsNovibet = await generateSnapshots(u.id, novibet.id, u.cpaN, 30);

    await prisma.dailySnapshot.createMany({
      data: snapshotsBetano,
      skipDuplicates: true,
    });
    snapshotBatches++;

    await prisma.dailySnapshot.createMany({
      data: snapshotsNovibet,
      skipDuplicates: true,
    });
    snapshotBatches++;

    // Update UserHouseData totals based on snapshots
    const totalsBetano = snapshotsBetano.reduce(
      (acc, s) => ({
        registros: acc.registros + s.registros,
        ftds: acc.ftds + s.ftds,
        qftds: acc.qftds + s.qftds,
      }),
      { registros: 0, ftds: 0, qftds: 0 }
    );

    const totalsNovibet = snapshotsNovibet.reduce(
      (acc, s) => ({
        registros: acc.registros + s.registros,
        ftds: acc.ftds + s.ftds,
        qftds: acc.qftds + s.qftds,
      }),
      { registros: 0, ftds: 0, qftds: 0 }
    );

    await prisma.userHouseData.updateMany({
      where: { userId: u.id, houseId: betano.id },
      data: totalsBetano,
    });

    await prisma.userHouseData.updateMany({
      where: { userId: u.id, houseId: novibet.id },
      data: totalsNovibet,
    });
  }
  console.log(`[SEED] ✓ ${snapshotBatches} batches de snapshots criados em ${Date.now() - snapshotsStart}ms`);

  const totalTime = Date.now() - totalStart;
  console.log("\n✅ Seed completed successfully!");
  console.log(`⏱️  Tempo total: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
  console.log("5-level affiliate hierarchy created:");
  console.log("N1: Admin User (CPA 200)");
  console.log("N2: 3 users (CPA 150)");
  console.log("N3: 9 users (CPA 100)");
  console.log("N4: 18 users (CPA 50)");
  console.log("N5: 18 users (CPA 25)");
  console.log("Total: 49 users");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
