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
  // Clear existing data
  await prisma.dailySnapshot.deleteMany();
  await prisma.userHouseData.deleteMany();
  await prisma.user.deleteMany();

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

  // N2 (direct children of admin)
  const n2_a = await prisma.user.create({
    data: {
      email: "user@example.com",
      password: hashedPassword,
      name: "User A (N2)",
      role: "USER",
      affiliateParentId: n1.id,
    },
  });

  const n2_b = await prisma.user.create({
    data: {
      email: "user2@example.com",
      password: hashedPassword,
      name: "User B (N2)",
      role: "USER",
      affiliateParentId: n1.id,
    },
  });

  // N3 (children of N2)
  const n3_a = await prisma.user.create({
    data: {
      email: "user-a1@example.com",
      password: hashedPassword,
      name: "User A1 (N3)",
      role: "USER",
      affiliateParentId: n2_a.id,
    },
  });

  const n3_b = await prisma.user.create({
    data: {
      email: "user-b1@example.com",
      password: hashedPassword,
      name: "User B1 (N3)",
      role: "USER",
      affiliateParentId: n2_b.id,
    },
  });

  // N4 (children of N3)
  const n4_a = await prisma.user.create({
    data: {
      email: "user-a1-1@example.com",
      password: hashedPassword,
      name: "User A1-1 (N4)",
      role: "USER",
      affiliateParentId: n3_a.id,
    },
  });

  const n4_b = await prisma.user.create({
    data: {
      email: "user-b1-1@example.com",
      password: hashedPassword,
      name: "User B1-1 (N4)",
      role: "USER",
      affiliateParentId: n3_b.id,
    },
  });

  // N5 (children of N4)
  const n5_a = await prisma.user.create({
    data: {
      email: "user-a1-1-1@example.com",
      password: hashedPassword,
      name: "User A1-1-1 (N5)",
      role: "USER",
      affiliateParentId: n4_a.id,
    },
  });

  const n5_b = await prisma.user.create({
    data: {
      email: "user-b1-1-1@example.com",
      password: hashedPassword,
      name: "User B1-1-1 (N5)",
      role: "USER",
      affiliateParentId: n4_b.id,
    },
  });

  // Create UserHouseData for all users with CPAs that decrease by level
  const createHouseData = async (userId: string, betanoCpa: number, novibetCpa: number) => {
    return [
      await prisma.userHouseData.create({
        data: {
          userId,
          houseId: "betano",
          houseName: "Betano",
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
          houseId: "novibet",
          houseName: "Novibet",
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
  await createHouseData(n2_a.id, 150, 120);
  await createHouseData(n2_b.id, 150, 120);
  await createHouseData(n3_a.id, 100, 80);
  await createHouseData(n3_b.id, 100, 80);
  await createHouseData(n4_a.id, 50, 40);
  await createHouseData(n4_b.id, 50, 40);
  await createHouseData(n5_a.id, 25, 20);
  await createHouseData(n5_b.id, 25, 20);

  // Generate and create snapshots for each user
  const users = [
    { id: n2_a.id, cpaB: 150, cpaN: 120 },
    { id: n2_b.id, cpaB: 150, cpaN: 120 },
    { id: n3_a.id, cpaB: 100, cpaN: 80 },
    { id: n3_b.id, cpaB: 100, cpaN: 80 },
    { id: n4_a.id, cpaB: 50, cpaN: 40 },
    { id: n4_b.id, cpaB: 50, cpaN: 40 },
    { id: n5_a.id, cpaB: 25, cpaN: 20 },
    { id: n5_b.id, cpaB: 25, cpaN: 20 },
  ];

  for (const u of users) {
    const snapshotsBetano = await generateSnapshots(u.id, "betano", u.cpaB);
    const snapshotsNovibet = await generateSnapshots(u.id, "novibet", u.cpaN);

    await prisma.dailySnapshot.createMany({
      data: snapshotsBetano,
      skipDuplicates: true,
    });

    await prisma.dailySnapshot.createMany({
      data: snapshotsNovibet,
      skipDuplicates: true,
    });

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
      where: { userId: u.id, houseId: "betano" },
      data: totalsBetano,
    });

    await prisma.userHouseData.updateMany({
      where: { userId: u.id, houseId: "novibet" },
      data: totalsNovibet,
    });
  }

  console.log("✅ Seed completed successfully!");
  console.log("5-level affiliate hierarchy created:");
  console.log("N1: Admin User (CPA 200)");
  console.log("N2: User A, User B (CPA 150)");
  console.log("N3: User A1, User B1 (CPA 100)");
  console.log("N4: User A1-1, User B1-1 (CPA 50)");
  console.log("N5: User A1-1-1, User B1-1-1 (CPA 25)");
  console.log("QFTDS: 1-4 per day (deterministic)");
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
