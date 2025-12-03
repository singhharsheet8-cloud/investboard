import { prisma } from "../prisma";
import { CachedEntityData } from "@/lib/types";

export async function getStockCache(
  symbol: string
): Promise<CachedEntityData | null> {
  const cached = await prisma.cachedEntity.findUnique({
    where: {
      entityType_key: {
        entityType: "stock",
        key: symbol,
      },
    },
  });

  if (!cached) return null;

  return cached.data as unknown as CachedEntityData;
}

export async function upsertStockCache(
  symbol: string,
  data: CachedEntityData
): Promise<void> {
  await prisma.cachedEntity.upsert({
    where: {
      entityType_key: {
        entityType: "stock",
        key: symbol,
      },
    },
    update: {
      data: data as unknown as object,
      sourceUrls: data.sourceUrls as unknown as object,
      fetchedAt: new Date(),
      updatedAt: new Date(),
    },
    create: {
      entityType: "stock",
      key: symbol,
      data: data as unknown as object,
      sourceUrls: data.sourceUrls as unknown as object,
      fetchedAt: new Date(),
    },
  });
}
