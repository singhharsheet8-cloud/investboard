import { NextRequest, NextResponse } from "next/server";
import {
  getWatchlistItems,
  addWatchlistItem,
  removeWatchlistItem,
} from "@/lib/db/repositories/watchlistRepo";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const items = await getWatchlistItems(userId);
    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Error fetching watchlist items:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch watchlist items" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, entityType, entityKey } = body;

  if (!userId || !entityType || !entityKey) {
    return NextResponse.json(
      { error: "userId, entityType, and entityKey are required" },
      { status: 400 }
    );
  }

  try {
    const item = await addWatchlistItem(
      userId,
      entityType as "stock" | "mutual_fund" | "ipo",
      entityKey
    );
    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Error adding watchlist item:", error);
    // Handle unique constraint violation (item already exists)
    if (error.code === "P2002" || error.message?.includes("Unique constraint")) {
      // Try to get existing item
      try {
        const { getWatchlistItems } = await import("@/lib/db/repositories/watchlistRepo");
        const items = await getWatchlistItems(userId);
        const existing = items.find(
          (item) => item.entityType === entityType && item.entityKey === entityKey
        );
        if (existing) {
          return NextResponse.json(existing);
        }
      } catch (err) {
        // Fall through to error response
      }
    }
    return NextResponse.json(
      { error: error.message ?? "Failed to add watchlist item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const url = req.nextUrl;
  const userId = url.searchParams.get("userId");
  const entityType = url.searchParams.get("entityType");
  const entityKey = url.searchParams.get("entityKey");

  if (!userId || !entityType || !entityKey) {
    return NextResponse.json(
      { error: "userId, entityType, and entityKey are required" },
      { status: 400 }
    );
  }

  try {
    await removeWatchlistItem(userId, entityType as any, entityKey);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing watchlist item:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to remove watchlist item" },
      { status: 500 }
    );
  }
}

