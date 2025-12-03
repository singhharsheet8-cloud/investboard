import { prisma } from "../prisma";
import { CachedEntityData } from "@/lib/types";

export async function getMFCache(code: string): Promise<CachedEntityData | null> {
  const cached = await prisma.cachedEntity.findUnique({
    where: {
      entityType_key: {
        entityType: "mutual_fund",
        key: code,
      },
    },
  });

  if (!cached) return null;

  return cached.data as unknown as CachedEntityData;
}

export async function upsertMFCache(
  code: string,
  data: CachedEntityData
): Promise<void> {
  await prisma.cachedEntity.upsert({
    where: {
      entityType_key: {
        entityType: "mutual_fund",
        key: code,
      },
    },
    update: {
      data: data as unknown as object,
      sourceUrls: data.sourceUrls as unknown as object,
      fetchedAt: new Date(),
      updatedAt: new Date(),
    },
    create: {
      entityType: "mutual_fund",
      key: code,
      data: data as unknown as object,
      sourceUrls: data.sourceUrls as unknown as object,
      fetchedAt: new Date(),
    },
  });
}
