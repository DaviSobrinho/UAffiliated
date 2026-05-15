import { prisma } from "@/lib/prisma";

/**
 * Get all descendants of a user using a single recursive CTE query.
 * Replaces BFS loops that were making N queries in O(depth) time.
 */
export async function getAllDescendants(userId: string): Promise<string[]> {
  const result = await prisma.$queryRaw<{ id: string }[]>`
    WITH RECURSIVE descendants AS (
      SELECT id FROM "User" WHERE "affiliateParentId" = ${userId}
      UNION ALL
      SELECT u.id FROM "User" u
      INNER JOIN descendants d ON u."affiliateParentId" = d.id
    )
    SELECT id FROM descendants
  `;

  return result.map(row => row.id);
}

/**
 * Get the level of a user in the affiliate hierarchy using a single CTE query.
 * Replaces sequential findUnique loops that were making N queries per level.
 */
export async function getUserLevel(userId: string): Promise<number> {
  const result = await prisma.$queryRaw<{ level: number }[]>`
    WITH RECURSIVE path AS (
      SELECT id, "affiliateParentId", 1 AS level FROM "User" WHERE id = ${userId}
      UNION ALL
      SELECT u.id, u."affiliateParentId", p.level + 1
      FROM "User" u
      INNER JOIN path p ON u.id = p."affiliateParentId"
    )
    SELECT COALESCE(MAX(level), 1) AS level FROM path
  `;

  return result[0]?.level ?? 1;
}

/**
 * Check if nodeId is a descendant of parentId using a single CTE query.
 * Replaces BFS loops that were traversing the entire subtree.
 */
export async function isDescendantOf(
  parentId: string,
  nodeId: string
): Promise<boolean> {
  if (parentId === nodeId) return true;

  const result = await prisma.$queryRaw<{ result: boolean }[]>`
    WITH RECURSIVE descendants AS (
      SELECT id FROM "User" WHERE "affiliateParentId" = ${parentId}
      UNION ALL
      SELECT u.id FROM "User" u
      INNER JOIN descendants d ON u."affiliateParentId" = d.id
    )
    SELECT EXISTS(SELECT 1 FROM descendants WHERE id = ${nodeId}) AS result
  `;

  return result[0]?.result ?? false;
}
