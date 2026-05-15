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
  await prisma.dailySnapshot.deleteMany();
  await prisma.userHouseData.deleteMany();
  await prisma.house.deleteMany();
  await prisma.user.deleteMany();

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

  for (const house of predefinedHouses) {
    const created = await prisma.house.create({
      data: {
        name: house.name,
        color: house.color,
      },
    });
    createdHouses[house.name] = created;
  }

  const betano = createdHouses["Betano"];
  const novibet = createdHouses["Novibet"];

  const hashedPassword = await bcrypt.hash("user123", 10);

  const n1 = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: await bcrypt.hash("admin123", 10),
      name: "Admin (N1)",
      role: "ADMIN",
    },
  });

  let userCount = 1;

  const n2_users = [];
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

  const n3_users = [];
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

  const n4_users = [];
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

  const n5_users = [];
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

  for (const u of users) {
    const snapshotsBetano = await generateSnapshots(u.id, betano.id, u.cpaB, 30);
    const snapshotsNovibet = await generateSnapshots(u.id, novibet.id, u.cpaN, 30);

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
      where: { userId: u.id, houseId: betano.id },
      data: totalsBetano,
    });

    await prisma.userHouseData.updateMany({
      where: { userId: u.id, houseId: novibet.id },
      data: totalsNovibet,
    });
  }
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
