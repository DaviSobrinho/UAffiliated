import { prisma } from "./prisma";

// In-memory cache for house IDs. Persists between requests in the same process.
const houseCache = new Map<string, string>();

export async function resolveHouseId(houseNameOrId: string): Promise<string | null> {
  if (!houseNameOrId) return null;

  // Check cache first
  const cacheKey = houseNameOrId.toLowerCase();
  if (houseCache.has(cacheKey)) {
    return houseCache.get(cacheKey)!;
  }

  // If it looks like a UUID (longer string), assume it's already an ID
  if (houseNameOrId.length > 10) {
    houseCache.set(cacheKey, houseNameOrId);
    return houseNameOrId;
  }

  // Try to find house by name (case-insensitive)
  const house = await prisma.house.findFirst({
    where: { name: { equals: houseNameOrId, mode: "insensitive" } },
    select: { id: true },
  });

  if (house) {
    houseCache.set(cacheKey, house.id);
    return house.id;
  }

  return null;
}

/**
 * Invalidate the house cache. Call this after creating, updating, or deleting houses.
 */
export function invalidateHouseCache(): void {
  houseCache.clear();
}
