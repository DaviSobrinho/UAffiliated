import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function generateSnapshots(
  userId: string,
  houseId: string,
  cpa: number,
  days: number = 7
) {
  const snapshots = [];
  const now = new Date();

  for (let i = days; i > 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);

    // Deterministic pattern: 1-5 QFTDs por dia
    const dayOfMonth = date.getDate();
    const qftds = 1 + (dayOfMonth % 5);
    const ftds = Math.ceil(qftds * 0.9);
    const registros = Math.ceil(qftds * 1.2);

    // Revenue baseado em CPA
    const revenue = new Decimal(cpa).times(qftds).toNumber();

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
  console.log("🗑️  Limpando banco de dados...");
  await prisma.balanceAudit.deleteMany();
  await prisma.dailySnapshot.deleteMany();
  await prisma.userHouseData.deleteMany();
  await prisma.house.deleteMany();
  await prisma.user.deleteMany();

  console.log("🏠 Criando casas...");
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
      data: { name: house.name, color: house.color },
    });
    createdHouses[house.name] = created;
  }

  console.log("👥 Criando hierarquia de usuários...");
  const hashedPassword = await bcrypt.hash("user123", 10);

  // N1 - Admin
  const n1 = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: await bcrypt.hash("admin123", 10),
      name: "Admin (N1)",
      role: "ADMIN",
    },
  });

  // N1 - Admin 2 (for client testing)
  const n1_admin2 = await prisma.user.create({
    data: {
      email: "admin2@example.com",
      password: await bcrypt.hash("admin123", 10),
      name: "Admin Cliente (N1)",
      role: "ADMIN",
    },
  });

  // N2 - 3 usuários
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
  }

  // N3 - 3 por cada N2
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
    }
  }

  // N4 - 2 por cada N3
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
    }
  }

  // N5 - 1 por cada N4
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
  }

  console.log("💰 Criando dados de casas para todos os usuários...");

  // CPAs por nível (diminui conforme desce a hierarquia)
  const cpaByCpaMultipliers: Record<string, number> = {
    "Betano": 1,
    "Betfair": 0.85,
    "Bet Nacional": 0.9,
    "Esportivabet": 0.8,
    "Estrelabet": 0.75,
    "Novibet": 0.95,
    "Segurobet": 0.7,
    "Stake": 0.88,
    "Superbet": 0.82,
  };

  const createUserHouseData = async (userId: string, baseCpa: number, daysOfData: number = 7) => {
    const allSnapshots = [];

    for (const [houseName, multiplier] of Object.entries(cpaByCpaMultipliers)) {
      const house = createdHouses[houseName];
      const cpa = Math.round(baseCpa * multiplier);

      // Criar userHouseData
      const snapshots = await generateSnapshots(userId, house.id, cpa, daysOfData);
      allSnapshots.push(...snapshots);

      // Calcular totais
      const totals = snapshots.reduce(
        (acc, s) => ({
          registros: acc.registros + s.registros,
          ftds: acc.ftds + s.ftds,
          qftds: acc.qftds + s.qftds,
          revenue: acc.revenue + s.revenue,
        }),
        { registros: 0, ftds: 0, qftds: 0, revenue: 0 }
      );

      // Criar registro
      await prisma.userHouseData.create({
        data: {
          userId,
          houseId: house.id,
          cpa: new Decimal(cpa),
          affiliateLink: `${houseName.toLowerCase().replace(/\s+/g, "-")}/${userId}`,
          registros: totals.registros,
          ftds: totals.ftds,
          qftds: totals.qftds,
          balance: new Decimal(totals.revenue),
        },
      });
    }

    // Criar snapshots em batch
    if (allSnapshots.length > 0) {
      await prisma.dailySnapshot.createMany({
        data: allSnapshots,
        skipDuplicates: true,
      });
    }
  };

  // Para TODOS os usuários EXCETO admin2: dados de 1 semana
  console.log("📊 Gerando dados de 1 semana para todos os usuários (exceto admin2)...");
  const allUsers = [
    { user: n1, cpa: 200 },
    ...n2_users.map((u) => ({ user: u, cpa: 150 })),
    ...n3_users.map((u) => ({ user: u, cpa: 100 })),
    ...n4_users.map((u) => ({ user: u, cpa: 50 })),
    ...n5_users.map((u) => ({ user: u, cpa: 25 })),
  ];

  for (const { user, cpa } of allUsers) {
    await createUserHouseData(user.id, cpa, 7); // 7 dias
  }

  console.log("✅ Admin2 criada ZERADA (sem dados de casas)");

  // Para admin, 1 N2 direto, e 1 N3 direto: dados de 9 meses (270 dias)
  console.log("📈 Gerando dados de 9 meses para admin, 1 N2 e 1 N3...");
  const selectedN2 = n2_users[0];
  const selectedN3 = n3_users[0];

  // Limpar dados anteriores (snapshots e userHouseData) e recriar com 9 meses
  await prisma.dailySnapshot.deleteMany({
    where: {
      OR: [
        { userId: n1.id },
        { userId: selectedN2.id },
        { userId: selectedN3.id },
      ],
    },
  });

  await prisma.userHouseData.deleteMany({
    where: {
      OR: [
        { userId: n1.id },
        { userId: selectedN2.id },
        { userId: selectedN3.id },
      ],
    },
  });

  await createUserHouseData(n1.id, 200, 270); // 9 meses
  await createUserHouseData(selectedN2.id, 150, 270); // 9 meses
  await createUserHouseData(selectedN3.id, 100, 270); // 9 meses

  console.log("✅ Seed concluído!");
  console.log(`✨ Criados: 1 Admin + ${n2_users.length} N2s + ${n3_users.length} N3s + ${n4_users.length} N4s + ${n5_users.length} N5s`);
  console.log(`💼 Cada usuário tem dados em todas as 9 casas com CPAs diferentes`);
  console.log(`📅 1 semana de dados para todos, 9 meses para: admin, N2-1 e N3-1`);
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
