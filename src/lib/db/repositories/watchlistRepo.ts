import { prisma } from "../prisma";
import { MetricKey } from "@/lib/watchlist-metrics";

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
  const items = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return items.map((item) => ({
    id: item.id,
    userId: item.userId,
    entityType: item.entityType as "stock" | "mutual_fund" | "ipo",
    entityKey: item.entityKey,
    createdAt: item.createdAt,
  }));
}

export async function addWatchlistItem(
  userId: string,
  entityType: "stock" | "mutual_fund" | "ipo",
  entityKey: string
): Promise<WatchlistItem> {
  const item = await prisma.watchlistItem.create({
    data: {
      userId,
      entityType,
      entityKey,
    },
  });

  return {
    id: item.id,
    userId: item.userId,
    entityType: item.entityType as "stock" | "mutual_fund" | "ipo",
    entityKey: item.entityKey,
    createdAt: item.createdAt,
  };
}

export async function removeWatchlistItem(
  userId: string,
  entityType: "stock" | "mutual_fund" | "ipo",
  entityKey: string
): Promise<void> {
  await prisma.watchlistItem.deleteMany({
    where: {
      userId,
      entityType,
      entityKey,
    },
  });
}

export async function getWatchlistPreferences(
  userId: string,
  entityType: "stock" | "mutual_fund" | "ipo"
): Promise<WatchlistPreference | null> {
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
}

export async function upsertWatchlistPreferences(
  userId: string,
  entityType: "stock" | "mutual_fund" | "ipo",
  visibleMetricKeys: MetricKey[]
): Promise<WatchlistPreference> {
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
}

