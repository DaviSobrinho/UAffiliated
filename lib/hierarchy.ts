import { prisma } from "@/lib/prisma";

interface UserParent {
  affiliateParentId: string | null;
}

export async function getUserLevel(userId: string): Promise<number> {
  let level = 1;
  let currentId: string | null = userId;

  // Walk up the tree to find the root
  while (currentId) {
    const user: UserParent | null = await prisma.user.findUnique({
      where: { id: currentId },
      select: { affiliateParentId: true },
    });

    if (!user || !user.affiliateParentId) {
      break;
    }

    currentId = user.affiliateParentId;
    level++;
  }

  return level;
}

export function getLevelLabel(level: number): string {
  return `N${level}`;
}
