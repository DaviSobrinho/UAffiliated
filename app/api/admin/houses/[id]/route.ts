import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateHouseCache } from "@/lib/house-utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("auth")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const house = await prisma.house.findUnique({
      where: { id: params.id },
      include: { userHouseData: true },
    });

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    if (house.userHouseData.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete house with existing affiliate links" },
        { status: 400 }
      );
    }

    await prisma.house.delete({
      where: { id: params.id },
    });

    invalidateHouseCache();

    return NextResponse.json({ message: "House deleted successfully" });
  } catch (error) {
    console.error("Error deleting house:", error);
    return NextResponse.json(
      { error: "Failed to delete house" },
      { status: 500 }
    );
  }
}
