import { prisma } from "../prisma";
import { CachedEntityData } from "@/lib/types";

export async function getIPOCache(id: string): Promise<CachedEntityData | null> {
  const cached = await prisma.cachedEntity.findUnique({
    where: {
      entityType_key: {
        entityType: "ipo",
        key: id,
      },
    },
  });

  if (!cached) return null;

  return cached.data as unknown as CachedEntityData;
}

export async function upsertIPOCache(
  id: string,
  data: CachedEntityData
): Promise<void> {
  await prisma.cachedEntity.upsert({
    where: {
      entityType_key: {
        entityType: "ipo",
        key: id,
      },
    },
    update: {
      data: data as unknown as object,
      sourceUrls: data.sourceUrls as unknown as object,
      fetchedAt: new Date(),
      updatedAt: new Date(),
    },
    create: {
      entityType: "ipo",
      key: id,
      data: data as unknown as object,
      sourceUrls: data.sourceUrls as unknown as object,
      fetchedAt: new Date(),
    },
  });
}
