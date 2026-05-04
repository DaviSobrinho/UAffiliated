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

    // Deterministic, repeating pattern based on day of month
    const dayOfMonth = date.getDate();
    const registros = 8 + (dayOfMonth % 5);
    const ftds = Math.max(1, Math.round(registros * 0.75));
    const qftds = Math.max(1, Math.round(ftds * 0.8));

    // Use integer arithmetic for revenue: cpaCents * qftds / 100
    const cpaCents = Math.round(cpa * 100);
    const revenueCents = cpaCents * qftds;
    const revenue = revenueCents / 100;

    snapshots.push({
      userId,
      houseId,
      date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      registros,
      ftds,
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

  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  const hashedUserPassword = await bcrypt.hash("user123", 10);
  const hashedSubUserPassword = await bcrypt.hash("subuser123", 10);

  // Create test users with affiliate hierarchy
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: hashedAdminPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  const user = await prisma.user.create({
    data: {
      email: "user@example.com",
      password: hashedUserPassword,
      name: "Regular User",
      role: "USER",
      affiliateParentId: admin.id,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "user2@example.com",
      password: hashedUserPassword,
      name: "Second User",
      role: "USER",
      affiliateParentId: admin.id,
    },
  });

  const subuser = await prisma.user.create({
    data: {
      email: "subuser@example.com",
      password: hashedSubUserPassword,
      name: "Sub User",
      role: "USER",
      affiliateParentId: user.id,
    },
  });

  const subuser2 = await prisma.user.create({
    data: {
      email: "subuser2@example.com",
      password: hashedSubUserPassword,
      name: "Second Sub User",
      role: "USER",
      affiliateParentId: user2.id,
    },
  });

  const deepUser = await prisma.user.create({
    data: {
      email: "deep@example.com",
      password: hashedUserPassword,
      name: "Deep User",
      role: "USER",
      affiliateParentId: subuser.id,
    },
  });

  // Create UserHouseData for all users
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

  // Create house data for each user
  await createHouseData(admin.id, 200, 150);
  await createHouseData(user.id, 150, 100);
  await createHouseData(user2.id, 150, 100);
  await createHouseData(subuser.id, 80, 50);
  await createHouseData(subuser2.id, 80, 50);
  await createHouseData(deepUser.id, 40, 25);

  // Generate and create snapshots for each user/house combination
  const users = [
    { id: user.id, cpaB: 150, cpaN: 100 },
    { id: user2.id, cpaB: 150, cpaN: 100 },
    { id: subuser.id, cpaB: 80, cpaN: 50 },
    { id: subuser2.id, cpaB: 80, cpaN: 50 },
    { id: deepUser.id, cpaB: 40, cpaN: 25 },
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
  console.log("Users created: admin, user, user2, subuser, subuser2, deepUser");
  console.log("Affiliate tree: admin → [user, user2] → [subuser, subuser2] → [deepUser]");
  console.log("90 days of DailySnapshot data generated for all users across 2 houses");
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
