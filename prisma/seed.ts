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

  // Create sample UserHouseData only for admin user (for testing)
  const betano = createdHouses["Betano"];
  const novibet = createdHouses["Novibet"];
  const stake = createdHouses["Stake"];

  if (betano && novibet && stake) {
    // Create test records for admin
    const adminBetanoSnapshots = await generateSnapshots(n1.id, betano.id, 200, 30);
    const adminNovibetSnapshots = await generateSnapshots(n1.id, novibet.id, 150, 30);
    const adminStakeSnapshots = await generateSnapshots(n1.id, stake.id, 175, 30);

    // Create userHouseData for admin
    await prisma.userHouseData.create({
      data: {
        userId: n1.id,
        houseId: betano.id,
        cpa: 200,
        affiliateLink: `betano/${n1.id}`,
        registros: 0,
        ftds: 0,
        qftds: 0,
      },
    });

    await prisma.userHouseData.create({
      data: {
        userId: n1.id,
        houseId: novibet.id,
        cpa: 150,
        affiliateLink: `novibet/${n1.id}`,
        registros: 0,
        ftds: 0,
        qftds: 0,
      },
    });

    await prisma.userHouseData.create({
      data: {
        userId: n1.id,
        houseId: stake.id,
        cpa: 175,
        affiliateLink: `stake/${n1.id}`,
        registros: 0,
        ftds: 0,
        qftds: 0,
      },
    });

    // Create snapshots for admin's houses
    await prisma.dailySnapshot.createMany({
      data: adminBetanoSnapshots,
      skipDuplicates: true,
    });

    await prisma.dailySnapshot.createMany({
      data: adminNovibetSnapshots,
      skipDuplicates: true,
    });

    await prisma.dailySnapshot.createMany({
      data: adminStakeSnapshots,
      skipDuplicates: true,
    });

    // Update UserHouseData totals
    const totalsBetano = adminBetanoSnapshots.reduce(
      (acc, s) => ({
        registros: acc.registros + s.registros,
        ftds: acc.ftds + s.ftds,
        qftds: acc.qftds + s.qftds,
      }),
      { registros: 0, ftds: 0, qftds: 0 }
    );

    const totalsNovibet = adminNovibetSnapshots.reduce(
      (acc, s) => ({
        registros: acc.registros + s.registros,
        ftds: acc.ftds + s.ftds,
        qftds: acc.qftds + s.qftds,
      }),
      { registros: 0, ftds: 0, qftds: 0 }
    );

    const totalsStake = adminStakeSnapshots.reduce(
      (acc, s) => ({
        registros: acc.registros + s.registros,
        ftds: acc.ftds + s.ftds,
        qftds: acc.qftds + s.qftds,
      }),
      { registros: 0, ftds: 0, qftds: 0 }
    );

    await prisma.userHouseData.updateMany({
      where: { userId: n1.id, houseId: betano.id },
      data: totalsBetano,
    });

    await prisma.userHouseData.updateMany({
      where: { userId: n1.id, houseId: novibet.id },
      data: totalsNovibet,
    });

    await prisma.userHouseData.updateMany({
      where: { userId: n1.id, houseId: stake.id },
      data: totalsStake,
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
