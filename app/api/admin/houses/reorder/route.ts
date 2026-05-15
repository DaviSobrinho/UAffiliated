import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateHouseCache } from "@/lib/house-utils";

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

    const { houseIds } = await request.json();

    if (!Array.isArray(houseIds) || houseIds.length === 0) {
      return NextResponse.json(
        { error: "houseIds deve ser um array não vazio" },
        { status: 400 }
      );
    }

    // Update order for each house
    await Promise.all(
      houseIds.map((id, index) =>
        prisma.house.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    console.log(`[HOUSES-REORDER] ✓ Casas reordenadas: ${houseIds.join(", ")}`);

    invalidateHouseCache();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[HOUSES-REORDER] Erro:", error);
    return NextResponse.json(
      { error: "Failed to reorder houses" },
      { status: 500 }
    );
  }
}
