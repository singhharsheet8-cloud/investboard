import { prisma } from "../prisma";
import { MetricKey } from "@/lib/watchlist-metrics";
import { getFromMemoryCache, setInMemoryCache, cacheKeys } from "@/lib/cache";

export interface WatchlistItem {
  id: string;
  userId: string;
  entityType: "stock" | "mutual_fund" | "ipo";
  entityKey: string;
  createdAt: Date;
}

export interface WatchlistPreference {
  id: string;
  userId: string;
  entityType: "stock" | "mutual_fund" | "ipo";
  visibleMetricKeys: MetricKey[];
  createdAt: Date;
  updatedAt: Date;
}

export async function getWatchlistItems(
  userId: string
): Promise<WatchlistItem[]> {
  try {
    const items = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const result = items.map((item) => ({
      id: item.id,
      userId: item.userId,
      entityType: item.entityType as "stock" | "mutual_fund" | "ipo",
      entityKey: item.entityKey,
      createdAt: item.createdAt,
    }));
    
    // Cache in memory as fallback
    setInMemoryCache(cacheKeys.watchlist(userId), result);
    return result;
  } catch (error: any) {
    console.error("Database error in getWatchlistItems:", error);
    // Try memory cache as fallback
    const cached = getFromMemoryCache(cacheKeys.watchlist(userId));
    if (cached && Array.isArray(cached)) {
      return cached as WatchlistItem[];
    }
    // Return empty array if database is unavailable
    return [];
  }
}

export async function addWatchlistItem(
  userId: string,
  entityType: "stock" | "mutual_fund" | "ipo",
  entityKey: string
): Promise<WatchlistItem> {
  try {
    // Check if item already exists
    const existing = await prisma.watchlistItem.findFirst({
      where: {
        userId,
        entityType,
        entityKey,
      },
    });

    if (existing) {
      return {
        id: existing.id,
        userId: existing.userId,
        entityType: existing.entityType as "stock" | "mutual_fund" | "ipo",
        entityKey: existing.entityKey,
        createdAt: existing.createdAt,
      };
    }

    const item = await prisma.watchlistItem.create({
      data: {
        userId,
        entityType,
        entityKey,
      },
    });

    const result = {
      id: item.id,
      userId: item.userId,
      entityType: item.entityType as "stock" | "mutual_fund" | "ipo",
      entityKey: item.entityKey,
      createdAt: item.createdAt,
    };
    
    // Update memory cache
    const existingItems = getFromMemoryCache(cacheKeys.watchlist(userId)) || [];
    if (Array.isArray(existingItems)) {
      setInMemoryCache(cacheKeys.watchlist(userId), [...existingItems, result]);
    }
    
    return result;
  } catch (error: any) {
    console.error("Database error in addWatchlistItem:", error);
    // If it's a unique constraint error, try to return existing item
    if (error.code === "P2002") {
      try {
        const existing = await prisma.watchlistItem.findFirst({
          where: {
            userId,
            entityType,
            entityKey,
          },
        });
        if (existing) {
          return {
            id: existing.id,
            userId: existing.userId,
            entityType: existing.entityType as "stock" | "mutual_fund" | "ipo",
            entityKey: existing.entityKey,
            createdAt: existing.createdAt,
          };
        }
      } catch (err) {
        // Fall through
      }
    }
    // If database fails, still add to memory cache
    const newItem: WatchlistItem = {
      id: `mem-${Date.now()}`,
      userId,
      entityType,
      entityKey,
      createdAt: new Date(),
    };
    const existingItems = getFromMemoryCache(cacheKeys.watchlist(userId)) || [];
    if (Array.isArray(existingItems)) {
      setInMemoryCache(cacheKeys.watchlist(userId), [...existingItems, newItem]);
    } else {
      setInMemoryCache(cacheKeys.watchlist(userId), [newItem]);
    }
    return newItem;
  }
}

export async function removeWatchlistItem(
  userId: string,
  entityType: "stock" | "mutual_fund" | "ipo",
  entityKey: string
): Promise<void> {
  try {
    await prisma.watchlistItem.deleteMany({
      where: {
        userId,
        entityType,
        entityKey,
      },
    });
    
    // Update memory cache
    const existingItems = getFromMemoryCache(cacheKeys.watchlist(userId)) || [];
    if (Array.isArray(existingItems)) {
      const filtered = existingItems.filter(
        (item: any) => !(item.entityType === entityType && item.entityKey === entityKey)
      );
      setInMemoryCache(cacheKeys.watchlist(userId), filtered);
    }
  } catch (error: any) {
    console.error("Database error in removeWatchlistItem:", error);
    // Still update memory cache even if DB fails
    const existingItems = getFromMemoryCache(cacheKeys.watchlist(userId)) || [];
    if (Array.isArray(existingItems)) {
      const filtered = existingItems.filter(
        (item: any) => !(item.entityType === entityType && item.entityKey === entityKey)
      );
      setInMemoryCache(cacheKeys.watchlist(userId), filtered);
    }
  }
}

export async function getWatchlistPreferences(
  userId: string,
  entityType: "stock" | "mutual_fund" | "ipo"
): Promise<WatchlistPreference | null> {
  try {
    const pref = await prisma.watchlistPreference.findUnique({
      where: {
        userId_entityType: {
          userId,
          entityType,
        },
      },
    });

    if (!pref) return null;

    return {
      id: pref.id,
      userId: pref.userId,
      entityType: pref.entityType as "stock" | "mutual_fund" | "ipo",
      visibleMetricKeys: pref.visibleMetricKeys as MetricKey[],
      createdAt: pref.createdAt,
      updatedAt: pref.updatedAt,
    };
  } catch (error: any) {
    console.error("Database error in getWatchlistPreferences:", error);
    return null; // Return null if database is unavailable
  }
}

export async function upsertWatchlistPreferences(
  userId: string,
  entityType: "stock" | "mutual_fund" | "ipo",
  visibleMetricKeys: MetricKey[]
): Promise<WatchlistPreference> {
  try {
    const pref = await prisma.watchlistPreference.upsert({
      where: {
        userId_entityType: {
          userId,
          entityType,
        },
      },
      update: {
        visibleMetricKeys: visibleMetricKeys as any,
        updatedAt: new Date(),
      },
      create: {
        userId,
        entityType,
        visibleMetricKeys: visibleMetricKeys as any,
      },
    });

    return {
      id: pref.id,
      userId: pref.userId,
      entityType: pref.entityType as "stock" | "mutual_fund" | "ipo",
      visibleMetricKeys: pref.visibleMetricKeys as MetricKey[],
      createdAt: pref.createdAt,
      updatedAt: pref.updatedAt,
    };
  } catch (error: any) {
    console.error("Database error in upsertWatchlistPreferences:", error);
    throw error; // Re-throw to let API route handle it
  }
}

