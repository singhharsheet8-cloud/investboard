import { NextRequest, NextResponse } from "next/server";
import {
  getWatchlistPreferences,
  upsertWatchlistPreferences,
} from "@/lib/db/repositories/watchlistRepo";
import { MetricKey } from "@/lib/watchlist-metrics";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const userId = url.searchParams.get("userId");
  const entityType = url.searchParams.get("entityType");

  if (!userId || !entityType) {
    return NextResponse.json(
      { error: "userId and entityType are required" },
      { status: 400 }
    );
  }

  const pref = await getWatchlistPreferences(
    userId,
    entityType as "stock" | "mutual_fund" | "ipo"
  );

  return NextResponse.json(pref);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { userId, entityType, visibleMetricKeys } = body;

  if (!userId || !entityType || !Array.isArray(visibleMetricKeys)) {
    return NextResponse.json(
      {
        error:
          "userId, entityType, and visibleMetricKeys (array) are required",
      },
      { status: 400 }
    );
  }

  const pref = await upsertWatchlistPreferences(
    userId,
    entityType,
    visibleMetricKeys as MetricKey[]
  );

  return NextResponse.json(pref);
}

