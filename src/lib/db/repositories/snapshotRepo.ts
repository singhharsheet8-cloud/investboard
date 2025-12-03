import { prisma } from "../prisma";
import { CachedEntityData } from "@/lib/types";

const SNAPSHOT_KEY = "global";

export async function getSnapshotCache(): Promise<CachedEntityData | null> {
  const cached = await prisma.cachedEntity.findUnique({
    where: {
      entityType_key: {
        entityType: "market_snapshot",
        key: SNAPSHOT_KEY,
      },
    },
  });

  if (!cached) return null;

  return cached.data as unknown as CachedEntityData;
}

export async function upsertSnapshotCache(
  data: CachedEntityData
): Promise<void> {
  await prisma.cachedEntity.upsert({
    where: {
      entityType_key: {
        entityType: "market_snapshot",
        key: SNAPSHOT_KEY,
      },
    },
    update: {
      data: data as unknown as object,
      sourceUrls: data.sourceUrls as unknown as object,
      fetchedAt: new Date(),
      updatedAt: new Date(),
    },
    create: {
      entityType: "market_snapshot",
      key: SNAPSHOT_KEY,
      data: data as unknown as object,
      sourceUrls: data.sourceUrls as unknown as object,
      fetchedAt: new Date(),
    },
  });
}
