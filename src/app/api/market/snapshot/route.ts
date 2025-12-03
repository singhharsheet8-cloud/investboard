import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterJSON } from "@/lib/openrouter-client";
import { FINANCE_DATA_SYSTEM_PROMPT } from "@/lib/prompts";
import {
  getSnapshotCache,
  upsertSnapshotCache,
} from "@/lib/db/repositories/snapshotRepo";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const refresh = url.searchParams.get("refresh") === "true";

    // Check cache first (indefinite caching - no TTL)
    if (!refresh) {
      try {
        const cached = await getSnapshotCache();
        if (cached) {
          return NextResponse.json(cached);
        }
      } catch (cacheErr) {
        console.error("Cache read failed, fetching fresh data:", cacheErr);
        // Continue to fetch fresh data
      }
    }

    // Fetch new data via LLM
    const userPrompt = `
Fetch current market snapshot data for Indian stock markets.

Include:
- Nifty 50 index (value, change, change %)
- Sensex index (value, change, change %)
- Optionally: Nifty Bank, Nifty IT, or other major indices
- Market breadth: advances, declines, unchanged counts

Use sources like NSE, BSE, Moneycontrol for real-time data.

Return ONLY the JSON object following the market_snapshot schema.
`;

    const llmRes = await callOpenRouterJSON<any>({
      systemPrompt: FINANCE_DATA_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0,
      maxTokens: 1500,
    });

    if (!llmRes.ok || !llmRes.data) {
      return NextResponse.json(
        { error: llmRes.error ?? "Failed to fetch market snapshot" },
        { status: 500 }
      );
    }

    const data = llmRes.data;
    
    // Try to cache, but don't fail if database is down
    try {
      await upsertSnapshotCache(data);
    } catch (cacheErr) {
      console.error("Cache write failed:", cacheErr);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Market snapshot error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}

