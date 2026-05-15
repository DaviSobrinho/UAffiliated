import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;

    if (!query.trim()) {
      // If no search query, return all users with pagination
      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
          skip,
          take: limit,
        }),
        prisma.user.count(),
      ]);

      const totalPages = Math.ceil(total / limit);
      return NextResponse.json(
        { users, totalPages, currentPage: page, total },
        { status: 200 }
      );
    }

    // Search in name or email
    const searchQuery = query.toLowerCase();
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { email: { contains: searchQuery, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { email: { contains: searchQuery, mode: "insensitive" } },
          ],
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return NextResponse.json(
      { users, totalPages, currentPage: page, total },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SEARCH] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
