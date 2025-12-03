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

  const items = await getWatchlistItems(userId);
  return NextResponse.json(items);
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
      entityType,
      entityKey
    );
    return NextResponse.json(item);
  } catch (error: any) {
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

  await removeWatchlistItem(userId, entityType as any, entityKey);
  return NextResponse.json({ success: true });
}

