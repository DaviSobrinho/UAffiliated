import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateHouseCache } from "@/lib/house-utils";

export async function GET() {
  const startTime = Date.now();
  try {
    console.log("[HOUSES-GET] 🏠 Buscando casas...");

    const queryStart = Date.now();
    const houses = await prisma.house.findMany({
      orderBy: { createdAt: "desc" },
    });
    console.log(`[HOUSES-GET] ✓ Query em ${Date.now() - queryStart}ms, encontradas ${houses.length} casas`);

    const duration = Date.now() - startTime;
    console.log(`[HOUSES-GET] ✅ Retornando ${houses.length} casas (${duration}ms)`);
    return NextResponse.json({ houses });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[HOUSES-GET] 💥 ERRO após ${duration}ms:`, error);
    return NextResponse.json(
      { error: "Failed to fetch houses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, color } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "House name is required" },
        { status: 400 }
      );
    }

    const existingHouse = await prisma.house.findUnique({
      where: { name: name.trim() },
    });

    if (existingHouse) {
      return NextResponse.json(
        { error: "House already exists" },
        { status: 400 }
      );
    }

    const house = await prisma.house.create({
      data: {
        name: name.trim(),
        color: color && typeof color === "string" ? color : "#3b82f6",
      },
    });

    console.log(`[HOUSES-POST] ✓ Casa criada: ${house.id} (${house.name})`);

    invalidateHouseCache();

    return NextResponse.json({ house }, { status: 201 });
  } catch (error) {
    console.error("[HOUSES-POST] Erro ao criar casa:", error);
    return NextResponse.json(
      { error: "Failed to create house" },
      { status: 500 }
    );
  }
}
