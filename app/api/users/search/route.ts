import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

// BFS to collect all descendant IDs
async function getAllDescendants(userId: string): Promise<string[]> {
  const descendants: string[] = [userId];
  const visited = new Set<string>();
  const queue = [userId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const children = await prisma.user.findMany({
      where: { affiliateParentId: currentId },
      select: { id: true },
    });

    for (const child of children) {
      descendants.push(child.id);
      queue.push(child.id);
    }
  }

  return descendants;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "15"), 50);

    const isAdmin = decoded.role === "ADMIN";

    if (isAdmin) {
      // Admin: search all users
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, email: true },
        take: limit,
      });

      return NextResponse.json({ users });
    } else {
      // Regular user: get all descendants first
      const descendantIds = await getAllDescendants(decoded.id);

      // Remove the user themselves from the list
      const otherDescendantIds = descendantIds.filter((id) => id !== decoded.id);

      if (otherDescendantIds.length === 0) {
        return NextResponse.json({ users: [] });
      }

      // Filter by search query in-memory, then take limit
      if (q === "") {
        // No search query, return first `limit` descendants
        const users = await prisma.user.findMany({
          where: { id: { in: otherDescendantIds } },
          select: { id: true, name: true, email: true },
          take: limit,
        });

        return NextResponse.json({ users });
      } else {
        // Search query provided, filter
        const users = await prisma.user.findMany({
          where: {
            id: { in: otherDescendantIds },
            OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }],
          },
          select: { id: true, name: true, email: true },
          take: limit,
        });

        return NextResponse.json({ users });
      }
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 });
  }
}
